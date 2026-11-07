'use strict';

// PowerStrip 组装器（50 套路全量）：
// 读入「选填题答卷」（manifest）→ 依赖图展开 → 保护门校验 → 渲染 hub/插座/外壳 → 落盘。
//
// 编程用法：const { generate } = require('./generator');
//   generate({ manifestPath, outDir, quiet })
// CLI 用法：node generator.js [manifest.json] [输出目录]

const fs = require('fs');
const path = require('path');
const { render } = require('./lib/render');
const { expandGraph, orderByRequires } = require('./lib/graph');
const { validateAndBuildContext } = require('./lib/guard');
const { AssetRegistry } = require('./lib/assets');
const { checkSideConsistency, checkNbtKeys } = require('./lib/checks');

const ROOT = __dirname;

function titleCase(p) {
  return p.split('_').map((s) => (s ? s[0].toUpperCase() + s.slice(1) : '')).join(' ');
}

function collectLangKeys(hubEntries, ctx) {
  const map = new Map();
  const add = (key, value) => { if (key && !map.has(key)) map.set(key, value); };
  for (const e of hubEntries.ModBlocks?.blocks || []) add(`block.${ctx.meta.modId}.${e.regPath}`, titleCase(e.regPath));
  for (const e of hubEntries.ModItems?.items || []) add(`item.${ctx.meta.modId}.${e.regPath}`, titleCase(e.regPath));
  for (const e of hubEntries.ModCreativeModTabs?.entries || []) add(`creativetab.${e.regPath}`, titleCase(e.regPath));
  for (const e of hubEntries.ModEntities?.entries || []) add(`entity.${ctx.meta.modId}.${e.regPath}`, titleCase(e.regPath));
  for (const e of hubEntries.ModVillagers?.entries || []) add(`entity.minecraft.villager.${e.professionName}`, titleCase(e.professionName));
  for (const e of hubEntries.ModSounds?.entries || []) add(`subtitles.${ctx.meta.modId}.${e.regPath}`, titleCase(e.regPath));
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

// 资源条目构建：每个实例按 catalog 的 resources 声明渲染；集合类资源（语言/音效）单独聚合
function buildAssetEntries(ordered, hubEntries, ctx, catalog) {
  const entries = [];
  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    if (!def.resources || !def.resources.length) continue;
    const fileCtx = { meta: ctx.meta, features: ctx.features, params: { ...inst.params } };
    fileCtx.params.modelIsCube = inst.params.modelStyle === 'cube-all';
    fileCtx.params.modelIsColumn = inst.params.modelStyle === 'cube-column';
    fileCtx.params.modelIsCustom = inst.params.modelStyle === 'custom';
    fileCtx.params.modelIsCubeOrColumn = fileCtx.params.modelIsCube || fileCtx.params.modelIsColumn;
    if (inst.ref === 'block-registry') fileCtx.params.regPath = inst.params.registryPath; // 资源模板统一用 regPath
    if (inst.ref === 'crop-block') fileCtx.ages = Array.from({ length: inst.params.maxAge + 1 }, (_, i) => i);
    if (inst.ref === 'custom-tags') fileCtx.params.tagDir = inst.params.tagType === 'item' ? 'items' : 'blocks';
    const owner = `socket:${inst.ref}#${inst.params.className || inst.params.regField || ''}`;
    for (const res of def.resources) {
      if (res.when) {
        const whenVal = render(`{{${res.when}}}`, fileCtx);
        if (!whenVal) continue;
      }
      if (res.each) {
        for (const item of fileCtx[res.each] || []) {
          const ectx = { ...fileCtx, params: { ...fileCtx.params }, [res.itemVar]: item };
          entries.push({ type: 'tpl', template: res.template, outPath: render(res.outPath, ectx), ctx: ectx, owner });
        }
      } else if (res.png) {
        entries.push({ type: 'png', outPath: render(res.png, fileCtx), owner });
      } else {
        entries.push({ type: 'tpl', template: res.template, outPath: render(res.outPath, fileCtx), ctx: fileCtx, owner });
      }
    }
  }
  // 聚合：语言文件 + sounds.json
  const keys = collectLangKeys(hubEntries, ctx);
  if (keys.length) {
    entries.push({ type: 'tpl', template: 'templates/assets/lang-en.json.tpl', outPath: `src/main/resources/assets/${ctx.meta.modId}/lang/en_us.json`, ctx: { ...ctx, keys }, owner: 'aggregate:lang' });
  }
  const sounds = hubEntries.ModSounds?.entries || [];
  if (sounds.length) {
    entries.push({ type: 'tpl', template: 'templates/assets/sounds.json.tpl', outPath: `src/main/resources/assets/${ctx.meta.modId}/sounds.json`, ctx: { ...ctx, sounds }, owner: 'aggregate:sounds' });
  }
  return entries;
}

function collectClientClasses(ordered, catalog, ctx) {
  const names = new Set(['ModModelLayers', 'ModAnimationDefinitions']);
  if (ctx.flags.hasEventListeners) names.add('ModEventBusClientEvents');
  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    for (const paramName of def.clientClasses || []) {
      if (inst.params[paramName]) names.add(inst.params[paramName]);
    }
  }
  return [...names];
}

function loadCatalog() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'sockets', 'catalog.json'), 'utf8'));
}

// 校验 + 展开（不落盘），返回 ordered 实例列表；失败抛保护门错误
function planManifest(manifest, catalog) {
  const instances = expandGraph(manifest, catalog);
  for (const def of Object.values(catalog.sockets)) {
    if (def.singleInstance) {
      const id = Object.keys(catalog.sockets).find((k) => catalog.sockets[k] === def);
      const count = instances.filter((i) => i.ref === id).length;
      if (count > 1) throw new Error(`保护门拦截：插座 "${def.name}" 每份清单只能选择一次（当前 ${count} 次）。`);
    }
  }
  const ordered = orderByRequires(instances, catalog);
  const ctx = validateAndBuildContext(manifest, ordered, catalog);
  return { ordered, ctx };
}

function generate(options) {
  const manifestPath = options.manifestPath;
  const outDir = path.resolve(options.outDir || path.join(ROOT, 'out'));
  const quiet = options.quiet === true;
  const log = quiet ? () => {} : (...a) => console.log(...a);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const catalog = loadCatalog();

  const { ordered, ctx } = planManifest(manifest, catalog);

  // 组装上下文
  ctx.meta.pkgPath = ctx.meta.group.replace(/\./g, '/');
  ctx.instances = ordered;

  // hub 条目收集
  const hubEntries = {};
  for (const hubId of Object.keys(catalog.hubs)) hubEntries[hubId] = {};
  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    for (const hub of def.hubs || []) {
      if (!hubEntries[hub.hub][hub.list]) hubEntries[hub.hub][hub.list] = [];
      const entry = {};
      for (const [entryKey, paramName] of Object.entries(hub.fields)) {
        entry[entryKey] = inst.params[paramName];
      }
      hubEntries[hub.hub][hub.list].push(entry);
    }
  }

  // hub 条目转换器
  for (const e of hubEntries.ModBlocks?.blocks || []) e.isVanillaClass = e.className === 'Block';
  for (const e of hubEntries.ModSounds?.entries || []) e.fixedRange = e.soundType === 'fixed-range';
  for (const e of hubEntries.ModCreativeModTabs?.entries || []) {
    e.iconExpr = e.iconKind === 'block' ? `ModBlocks.${e.iconField}.get()` : `ModItems.${e.iconField}.get()`;
    e.displayItems = (e.displayItems || []).map((r) => ({ expr: r.kind === 'block' ? `ModBlocks.${r.field}.get()` : `ModItems.${r.field}.get()` }));
  }
  if (hubEntries.ModTags?.entries) {
    hubEntries.ModTags.blockEntries = hubEntries.ModTags.entries.filter((e) => e.tagType === 'block');
    hubEntries.ModTags.itemEntries = hubEntries.ModTags.entries.filter((e) => e.tagType === 'item');
  }
  if (hubEntries.ModNetworking?.messages) {
    let mid = 0;
    const msgs = [];
    for (const e of hubEntries.ModNetworking.messages) {
      if (e.withC2S) msgs.push({ beClassName: e.beClassName, msgId: mid++, isC2S: true });
      if (e.withS2C) msgs.push({ beClassName: e.beClassName, msgId: mid++, isS2C: true });
    }
    hubEntries.ModNetworking.messages = msgs;
  }
  ctx.hubs = hubEntries;

  // 能力层上下文：networking 多实例必须共享同一通道（一致性校验）
  const networkingInsts = ordered.filter((i) => i.ref === 'networking');
  if (networkingInsts.length) {
    const first = networkingInsts[0].params;
    for (const n of networkingInsts) {
      if (n.params.networkClassName !== first.networkClassName ||
          n.params.channelPath !== first.channelPath ||
          n.params.protocolVersion !== first.protocolVersion) {
        throw new Error(`保护门拦截：多个 networking 插座必须使用相同的 networkClassName/channelPath/protocolVersion（发现 ${n.params.networkClassName}/${n.params.channelPath}/${n.params.protocolVersion} 与 ${first.networkClassName}/${first.channelPath}/${first.protocolVersion} 不一致）。`);
      }
    }
    ctx.networkingCtx = { networkClassName: first.networkClassName, channelPath: first.channelPath, protocolVersion: first.protocolVersion };
  }
  const configInst = ordered.find((i) => i.ref === 'config-system');
  if (configInst) ctx.configCtx = { configClassName: configInst.params.configClassName };

  // 能力注入表：beClassName → { networking?, energy? }；menuClassName → beClassName
  const capabilitiesByBe = new Map();
  for (const inst of ordered) {
    if (inst.ref === 'networking' || inst.ref === 'energy') {
      const key = inst.params.beClassName;
      if (!capabilitiesByBe.has(key)) capabilitiesByBe.set(key, {});
      capabilitiesByBe.get(key)[inst.ref] = inst.params;
    }
  }
  const menuBeMap = new Map();
  for (const inst of ordered) {
    if (inst.ref === 'menu') menuBeMap.set(inst.params.menuClassName, inst.params.beClassName);
  }
  ctx.capabilitiesByBe = capabilitiesByBe;
  ctx.menuBeMap = menuBeMap;

  // 注册清单（外壳与事件类使用）
  ctx.creatureRenderers = ordered.filter((i) => i.ref === 'entity-renderer')
    .map((i) => ({ entityRegField: i.params.entityRegField, rendererClassName: i.params.rendererClassName }));
  ctx.projectileRenderers = ordered.filter((i) => i.ref === 'projectile-entity')
    .map((i) => ({ regField: i.params.regField }));
  ctx.boatRenderers = ordered.filter((i) => i.ref === 'vehicle-entity')
    .map((i) => ({ regField: i.params.regField, rendererClassName: i.params.rendererClassName }));
  ctx.layerRegistrations = ordered.filter((i) => i.ref === 'model-layer')
    .map((i) => ({ layerRegField: i.params.layerRegField, modelClassName: i.params.modelClassName }));
  ctx.creatureAttributes = ordered.filter((i) => i.ref === 'creature-entity')
    .map((i) => ({ regField: i.params.regField, className: i.params.className }));
  ctx.berRegistrations = ordered.filter((i) => i.ref === 'ber')
    .map((i) => ({ beRegField: i.params.beRegistryField, rendererClassName: i.params.rendererClassName }));
  ctx.screenRegistrations = ordered.filter((i) => i.ref === 'screen')
    .map((i) => ({ menuRegField: i.params.menuRegistryField, screenClassName: i.params.screenClassName }));
  ctx.woodTypes = hubEntries.ModWoodTypes?.entries || [];

  const has = (ref) => ordered.some((i) => i.ref === ref);
  const listNonEmpty = (hubId) => Object.values(hubEntries[hubId] || {}).some((l) => Array.isArray(l) && l.length > 0);

  ctx.flags = {
    hasBlocks: listNonEmpty('ModBlocks'),
    hasItems: listNonEmpty('ModItems') || listNonEmpty('ModBlocks'),
    hasBlockEntities: listNonEmpty('ModBlockEntities'),
    hasMenus: listNonEmpty('ModMenuTypes'),
    hasRecipes: listNonEmpty('ModRecipes'),
    hasTabs: listNonEmpty('ModCreativeModTabs'),
    hasEntities: listNonEmpty('ModEntities'),
    hasSounds: listNonEmpty('ModSounds'),
    hasVillagers: listNonEmpty('ModVillagers'),
    hasLootModifiers: listNonEmpty('ModLootModifiers'),
    hasBiomeModifiers: listNonEmpty('ModBiomeModifiers'),
    hasOreGen: listNonEmpty('ModConfiguredFeatures') && (hubEntries.ModConfiguredFeatures.oreEntries || []).length > 0,
    hasTreeGen: (hubEntries.ModConfiguredFeatures.treeEntries || []).length > 0,
    hasSurfaceRules: listNonEmpty('ModSurfaceRules'),
    hasWoodTypes: listNonEmpty('ModWoodTypes'),
    hasDimensions: listNonEmpty('ModDimensions'),
    hasDatagen: has('data-generator'),
    hasEventListeners: has('event-listener'),
    hasCreatures: ctx.creatureRenderers.length > 0,
    hasProjectiles: ctx.projectileRenderers.length > 0,
    hasBoats: ctx.boatRenderers.length > 0,
    hasModelLayers: ctx.layerRegistrations.length > 0,
    hasBers: ctx.berRegistrations.length > 0,
    hasScreens: ctx.screenRegistrations.length > 0,
    hasSeeds: (hubEntries.ModItems.items || []).some((e) => e.isSeeds),
    hasNetworking: listNonEmpty('ModNetworking'),
    hasConfig: !!ctx.configCtx,
  };
  ctx.flags.hasConfigured = ctx.flags.hasOreGen || ctx.flags.hasTreeGen;
  ctx.flags.emitBusEvents = ctx.flags.hasEventListeners || ctx.flags.hasCreatures;
  ctx.flags.needsCommonSetup = !ctx.flags.emitBusEvents && ctx.flags.hasSurfaceRules;
  ctx.flags.hasSigns = (hubEntries.ModBlockEntities.signs || []).length > 0;
  ctx.flags.hasBiomes = listNonEmpty('ModTerrablender');

  // hub 渲染判定
  function hubNeeded(hubId) {
    if (hubId === 'ModItems') return ctx.flags.hasItems;
    if (hubId === 'ModEvents') return ctx.flags.hasEventListeners;
    if (hubId === 'ModEventBusClientEvents') return ctx.flags.hasEventListeners;
    if (hubId === 'ModEventBusEvents') {
      return ctx.flags.hasEventListeners || ctx.flags.hasEntities || ctx.flags.hasSurfaceRules;
    }
    return listNonEmpty(hubId);
  }

  // 文件清单
  const pkg = ctx.meta.pkgPath;
  const files = [];

  files.push({ template: 'templates/shell/MainModClass.java.tpl', outPath: `src/main/java/${pkg}/${ctx.meta.mainClass}.java`, ctx });

  for (const [hubId, hubDef] of Object.entries(catalog.hubs)) {
    if (hubNeeded(hubId)) {
      files.push({ template: hubDef.template, outPath: render(hubDef.outPath, ctx), ctx });
    }
  }

  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    const fileCtx = { meta: ctx.meta, features: ctx.features, params: inst.params };
    // 能力注入：block-entity 按自身类名；menu 按其 beClassName；screen 经 menuClassName 间接
    let caps = {};
    if (inst.ref === 'block-entity') caps = capabilitiesByBe.get(inst.params.className) || {};
    else if (inst.ref === 'menu') caps = capabilitiesByBe.get(inst.params.beClassName) || {};
    else if (inst.ref === 'screen') {
      const beName = menuBeMap.get(inst.params.menuClassName);
      caps = beName ? (capabilitiesByBe.get(beName) || {}) : {};
    }
    fileCtx.capabilities = caps;
    fileCtx.params.energyConsumes = !!(caps.energy && caps.energy.consumePerTick > 0);
    if (inst.ref === 'config-system') {
      fileCtx.params.entries = (inst.params.entries || []).map((e) => ({
        ...e,
        field: e.key.toUpperCase(),
        typeName: { int: 'IntValue', double: 'DoubleValue', boolean: 'BooleanValue' }[e.type],
        isBool: e.type === 'boolean',
        defaultText: e.default === true ? 'true' : e.default === false ? 'false' : String(e.default),
      }));
    }
    if (inst.ref === 'jei-compat') {
      fileCtx.params.infoItemsExprs = (inst.params.infoItems || []).map((r) => ({
        expr: r.kind === 'block' ? `ModBlocks.${r.field}.get()` : `ModItems.${r.field}.get()`,
      }));
    }
    for (const f of def.files || []) {
      files.push({ template: f.template, outPath: render(f.outPath, fileCtx), ctx: fileCtx });
    }
    for (const f of def.supportFiles || []) {
      files.push({ template: f.template, outPath: render(f.outPath, fileCtx), ctx: fileCtx });
    }
  }

  // 渲染落盘（同路径只生成一次；清理后把 manifest 副本一并写回，保证产物可复现）
  const written = [];
  const seenPaths = new Set();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, path.basename(manifestPath)), JSON.stringify(manifest, null, 2), 'utf8');
  for (const f of files) {
    if (seenPaths.has(f.outPath)) continue;
    seenPaths.add(f.outPath);
    const tpl = fs.readFileSync(path.join(ROOT, f.template), 'utf8');
    const content = render(tpl, f.ctx);
    const full = path.join(outDir, f.outPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    written.push(f.outPath);
  }

  // —— 资源层：asset 生成 + 所有权登记 ——
  const assetEntries = buildAssetEntries(ordered, hubEntries, ctx, catalog);
  const registry = new AssetRegistry(outDir);
  for (const w of written) registry.claim(w, 'java');
  for (const a of assetEntries) {
    if (a.type === 'png') {
      registry.writePng(a.outPath, a.owner);
    } else {
      const tpl = fs.readFileSync(path.join(ROOT, a.template), 'utf8');
      registry.writeText(a.outPath, render(tpl, a.ctx), a.owner);
    }
  }
  const assetRelPaths = registry.written;

  // —— 生成后静态核查：客户端/服务端一致性 + NBT 键对称 ——
  const clientClasses = collectClientClasses(ordered, catalog, ctx);
  const sideViolations = checkSideConsistency(outDir, written, clientClasses, ctx.meta.mainClass);
  const nbtViolations = checkNbtKeys(outDir, written);
  if (sideViolations.length || nbtViolations.length) {
    throw new Error('保护门拦截：生成后静态核查失败 ——\n' +
      [...sideViolations, ...nbtViolations].map((v) => '  - ' + v).join('\n'));
  }

  // 组装报告
  const report = buildReport(ctx, ordered, written, assetRelPaths, manifestPath, catalog);
  fs.writeFileSync(path.join(outDir, 'ASSEMBLY.md'), report, 'utf8');

  log('== PowerStrip 组装完成 ==');
  for (const w of ctx.warnings) log('[警告] ' + w);
  log(`清单：${path.basename(manifestPath)}`);
  log(`版本约束：Minecraft ${ctx.meta.mcVersion} / ${ctx.meta.loader}`);
  log('插座（显式/派生）：');
  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    const tag = inst.derived ? `(由 ${inst.derivedFrom} 派生)` : '(显式选择)';
    const note = def.note ? ' ⚠待核查' : '';
    log(`  [${String(def.num).padStart(2)}] ${def.name.padEnd(10)} ${tag}${note}`);
  }
  log(`生成 ${written.length} 个 Java 文件 + ${assetRelPaths.length} 个资源文件 → ${path.relative(process.cwd(), outDir)}/`);
  for (const w of written) log('  ' + w);
  log('资源（assets/data）：');
  for (const w of assetRelPaths) log('  ' + w);
  log('防错乱核查：资源路径所有权 ✓ 客户端/服务端一致性 ✓ NBT 键对称 ✓');
  log('详细报告：out/ASSEMBLY.md');
  log('下一步：将 out/src 放入 1.20.x Forge MDK 工程，运行 gradlew build 编译验证（保护门第二层）。');

  return { written, assetRelPaths, ordered, ctx, outDir };
}

function buildReport(ctx, ordered, written, assetRelPaths, manifestPath, catalog) {
  const lines = [];
  lines.push('# PowerStrip 组装报告');
  lines.push('');
  lines.push(`- 清单文件：\`${path.basename(manifestPath)}\``);
  lines.push(`- 版本约束：Minecraft **${ctx.meta.mcVersion}** / **${ctx.meta.loader}**（仅支持 1.20.x Forge）`);
  lines.push(`- modId：\`${ctx.meta.modId}\`　包名：\`${ctx.meta.group}\`　主类：\`${ctx.meta.mainClass}\``);
  lines.push('');
  lines.push('## 分类答卷');
  const engaged = new Set(ordered.map((i) => catalog.sockets[i.ref].category));
  for (const c of catalog.categories) {
    if (engaged.has(c.id)) {
      const refs = ordered.filter((i) => catalog.sockets[i.ref].category === c.id)
        .map((i) => `[${catalog.sockets[i.ref].num}] ${catalog.sockets[i.ref].name}`);
      lines.push(`- ${c.num}. ${c.name}：**${refs.join('、')}**`);
    } else {
      lines.push(`- ${c.num}. ${c.name}：终止`);
    }
  }
  lines.push('');
  lines.push('## 依赖展开（排插链条）');
  for (const inst of ordered) {
    const def = catalog.sockets[inst.ref];
    const deps = def.requires.map((r) => catalog.sockets[r]?.name || r).join('、') || '无';
    const tag = inst.derived ? `（由 \`${inst.derivedFrom}\` 派生）` : '（显式）';
    const note = def.note ? `　⚠️ ${def.note}` : '';
    lines.push(`- [${def.num}] ${def.name}${tag} ← 需要：${deps}${note}`);
  }
  lines.push('');
  lines.push('## 生成文件');
  for (const w of written) lines.push(`- \`${w}\``);
  lines.push('');
  lines.push('## 资源文件（assets/data）');
  for (const w of assetRelPaths) lines.push(`- \`${w}\``);
  lines.push('');
  lines.push('## 防错乱核查');
  lines.push('- 资源路径所有权表：通过（无重复路径、无跨插座冲突）');
  lines.push('- 客户端/服务端一致性：通过（客户端类引用位置静态核查）');
  lines.push('- NBT 键对称：通过（方块实体 save/load 键集合一致）');
  lines.push('- 1×1 占位 PNG：方块/物品/实体/GUI 贴图为占位图，替换真实美术即可（路径已锁定）');
  lines.push('');
  lines.push('## 保护门校验');
  lines.push('- 版本/加载器、插座级版本白名单、参数档位、电源线引用、命名冲突：全部通过');
  for (const w of ctx.warnings) lines.push(`- 警告：${w}`);
  lines.push('');
  lines.push('## 组装后需要手工补的');
  lines.push('1. **编译验证**：把 `src/` 并入 1.20.x Forge MDK，运行 `gradlew build` —— 编译通过即「插紧了」（本机无 MDK，未执行）。');
  lines.push('2. **资源文件**：blockstates/models/贴图/语言文件、实体 geo/贴图/动画 JSON、GUI 贴图、音效 ogg 等（资源层插座后续提供）。');
  lines.push('3. **数据 JSON**：配方、标签、群系修饰、维度、战利品修饰的 JSON（datagen 插座只覆盖部分 Provider）。');
  lines.push('4. 标注 ⚠️ 的插座 API 按 1.20.1 教程形态编写但未经编译验证，见上方各条 note。');
  return lines.join('\n');
}

if (require.main === module) {
  const manifestPath = process.argv[2] || path.join(ROOT, 'examples', 'gem-polishing-station.manifest.json');
  const outDir = process.argv[3] || path.join(ROOT, 'out');
  try {
    generate({ manifestPath, outDir });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { generate, planManifest, loadCatalog };
