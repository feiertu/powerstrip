'use strict';

// 意图识别层编排器（两段式 LLM 调用链）：
//   单次业务请求 = [1 路由调用] → [N 并行填充调用] → [确定性合并 + 冲突仲裁] → [校验 + 最多 2 轮重填] → [单次代码生成]
//   单次模型调用模式（--mode single）：一次调用直接产出完整 manifest，走同样的合并/校验/生成流水线。
//
// 用法：node intent/index.js "需求描述" [--provider mock|api] [--mode two-stage|single]
//         [--mc 1.20.1] [--loader forge] [--modid x] [--group a.b.c] [--main X] [--out dir] [--no-gen] [--quiet]

const fs = require('fs');
const path = require('path');
const { loadCatalog, planManifest, generate } = require('../generator');
const { buildCompact } = require('./catalog-compact');
const { mergeSelections, applyArbitration } = require('./merger');

const ROOT = path.join(__dirname, '..');

// 校验错误 → 归属分类（错误信息含 插座 "xxx"）
function attributeError(err, catalog) {
  const m = String(err.message).match(/插座 "([a-z-]+)"/);
  if (!m) return null;
  const def = catalog.sockets[m[1]];
  return def ? def.category : null;
}

// 路由结果校验：7 类必须全覆盖表态
function normalizeDecisions(raw, catalog) {
  const decisions = raw && raw.decisions;
  if (!Array.isArray(decisions) || decisions.length === 0) {
    throw new Error('路由调用返回的 decisions 为空或格式错误。');
  }
  const byId = new Map();
  for (const d of decisions) {
    if (!d || typeof d.category !== 'string' || !['selected', 'terminated'].includes(d.state)) {
      throw new Error(`路由返回的条目格式错误：${JSON.stringify(d)}`);
    }
    byId.set(d.category, d);
  }
  const missing = catalog.categories.filter((c) => !byId.has(c.id));
  if (missing.length) {
    throw new Error(`路由结果未覆盖全部分类（漏识别）：${missing.map((c) => c.id).join('、')}`);
  }
  const selected = [];
  for (const d of decisions) {
    const catDef = catalog.categories.find((c) => c.id === d.category);
    if (!catDef) throw new Error(`路由返回了未知分类 "${d.category}"（误识别）。`);
    if (d.state === 'selected') selected.push({ id: d.category, mentions: d.mentions || '' });
  }
  return selected;
}

function normalizeCategories(raw, catalog) {
  const cats = raw && raw.categories;
  if (!Array.isArray(cats)) throw new Error('模型返回的 categories 为空或格式错误。');
  const out = [];
  for (const c of cats) {
    if (!c || typeof c.id !== 'string' || !catalog.categories.some((x) => x.id === c.id)) {
      throw new Error(`返回了未知分类 "${c && c.id}"（误识别）。`);
    }
    out.push({ id: c.id, selections: Array.isArray(c.selections) ? c.selections : [] });
  }
  return out;
}

async function runChain(requestText, options = {}) {
  const catalog = options.catalog || loadCatalog();
  const provider = options.provider;
  const mode = options.mode || 'two-stage';
  const meta = {
    mcVersion: options.mcVersion || '1.20.1',
    loader: options.loader || 'forge',
    modId: options.modId || 'tutorialmod',
    group: options.group || 'com.example.tutorialmod',
    mainClass: options.mainClass || 'TutorialMod',
  };
  const quiet = options.quiet === true;
  const log = quiet ? () => {} : (...a) => console.log(...a);
  const compact = buildCompact(catalog);

  log(`需求：${requestText}`);
  log(`provider=${provider.name} mode=${mode} mc=${meta.mcVersion}/${meta.loader}`);

  // —— 阶段 A：识别 ——
  let categories;
  if (mode === 'single') {
    log('[A] 单次模型调用：直接生成完整 manifest…');
    const raw = await provider.singleShot(requestText, compact);
    categories = normalizeCategories(raw, catalog);
  } else {
    log('[A1] 路由调用：7 类全覆盖判定（+终止）…');
    const raw = await provider.route(requestText, compact.route);
    const selected = normalizeDecisions(raw, catalog);
    if (selected.length === 0) {
      throw new Error('路由结果：7 个分类全部为终止，没有可拼装的插座。');
    }
    log('  选中：' + selected.map((s) => `${s.id}（${s.mentions}）`).join('、'));

    log('[A2] 并行填充：每个选中分类一次调用…');
    const fills = await Promise.all(selected.map(async (s) => {
      const f = await provider.fill(requestText, s.id, compact.byCategory[s.id]);
      return { id: s.id, selections: (f && f.selections) || [] };
    }));
    for (const f of fills) log(`  ${f.id}: ${f.selections.length} 个选择`);
    categories = fills;
  }

  // —— 阶段 B：确定性合并 + 冲突仲裁 ——
  let merged = mergeSelections(categories);
  if (merged.conflicts.length) {
    log(`[B] 检测到 ${merged.conflicts.length} 处命名冲突，逐个仲裁…`);
    for (const c of merged.conflicts) {
      const res = await provider.arbitrate(requestText, c);
      applyArbitration(merged.categories, c, (res && res.keep) || 'a');
      log(`  仲裁 ${c.ref}/${c.key} → keep=${(res && res.keep) || 'a'}`);
    }
  }
  categories = merged.categories;

  // —— 阶段 C：校验 + 重填（最多 2 轮） ——
  let manifest = { meta, categories };
  let ordered = null;
  for (let round = 0; round < 2; round++) {
    try {
      ({ ordered } = planManifest(manifest, catalog));
      break;
    } catch (e) {
      log(`[C] 校验失败：${e.message}`);
      const cat = attributeError(e, catalog);
      if (cat === null) throw e;
      log(`[C] 重填分类 ${cat}（第 ${round + 1} 轮，错误已注入）…`);
      const f = await provider.fill(requestText, cat, compact.byCategory[cat], { error: e.message });
      categories = categories.filter((c) => c.id !== cat);
      categories.push({ id: cat, selections: (f && f.selections) || [] });
      const m2 = mergeSelections(categories);
      for (const c of m2.conflicts) {
        const res = await provider.arbitrate(requestText, c);
        applyArbitration(m2.categories, c, (res && res.keep) || 'a');
      }
      categories = m2.categories;
      manifest = { meta, categories };
    }
  }
  if (!ordered) {
    ({ ordered } = planManifest(manifest, catalog)); // 最后一轮直接抛错
  }

  // —— 阶段 D：单次代码生成 ——
  log('[D] 单次代码生成…');
  const outDir = path.resolve(options.outDir || path.join(ROOT, 'out-intent'));
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  let generation = null;
  if (options.runGen !== false) {
    generation = generate({ manifestPath, outDir, quiet });
  }

  const engaged = [...new Set(ordered.map((i) => catalog.sockets[i.ref].category))];
  const terminated = catalog.categories.filter((c) => !engaged.includes(c.id)).map((c) => c.name);
  log(`完成：${ordered.length} 个插座，终止分类 ${terminated.join('、') || '无'}，清单 ${manifestPath}`);
  return { manifest, ordered, generation, outDir, manifestPath };
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { mode: 'two-stage' };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--provider') opts.provider = next();
    else if (a === '--mode') opts.mode = next();
    else if (a === '--mc') opts.mcVersion = next();
    else if (a === '--loader') opts.loader = next();
    else if (a === '--modid') opts.modId = next();
    else if (a === '--group') opts.group = next();
    else if (a === '--main') opts.mainClass = next();
    else if (a === '--out') opts.outDir = next();
    else if (a === '--no-gen') opts.runGen = false;
    else if (a === '--quiet') opts.quiet = true;
    else if (!a.startsWith('--')) positional.push(a);
    else throw new Error('未知参数：' + a);
  }
  const requestText = positional.join(' ');
  if (!requestText) {
    throw new Error('用法：node intent/index.js "需求描述" [--provider mock|api] [--mode two-stage|single] [--out dir] [--no-gen]');
  }
  if (!opts.provider) {
    opts.provider = process.env.POWERSTRIP_API_KEY ? 'api' : 'mock';
    if (opts.provider === 'mock') {
      console.log('[提示] 未设置 POWERSTRIP_API_KEY，使用离线 mock provider（关键词场景降级）。');
    }
  }
  const provider = opts.provider === 'api' ? require('./providers/api') : require('./providers/mock');
  await runChain(requestText, { ...opts, provider });
}

if (require.main === module) {
  main().catch((e) => {
    console.error('失败：' + e.message);
    process.exit(1);
  });
}

module.exports = { runChain, attributeError, normalizeCategories };
