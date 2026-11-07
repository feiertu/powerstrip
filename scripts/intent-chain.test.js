'use strict';

// 意图层测试（无需网络，mock provider 驱动）：
//   node scripts/intent-chain.test.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { mergeSelections, applyArbitration } = require('../intent/merger');
const mock = require('../intent/providers/mock');
const { runChain } = require('../intent/index');
const { loadCatalog } = require('../generator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed += 1; console.log('  \u2713 ' + name); }
  catch (e) { failed += 1; console.log('  \u2717 ' + name + '\n      ' + e.message); }
}

async function testAsync(name, fn) {
  try { await fn(); passed += 1; console.log('  \u2713 ' + name); }
  catch (e) { failed += 1; console.log('  \u2717 ' + name + '\n      ' + e.message); }
}

const catalog = loadCatalog();
const quiet = true;

(async () => {
  console.log('== 合并器 ==');

  test('幂等去重：同键同参只保留一份', () => {
    const groups = [
      { id: 'registration', selections: [
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE' } },
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE' } },
      ] },
    ];
    const r = mergeSelections(groups);
    assert.strictEqual(r.categories[0].selections.length, 1);
    assert.strictEqual(r.conflicts.length, 0);
  });

  test('冲突检测：同键异参进仲裁列表', () => {
    const groups = [
      { id: 'registration', selections: [
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE' } },
        { ref: 'item-registry', params: { className: 'FuelItem', regPath: 'sapphire', regField: 'SAPPHIRE' } },
      ] },
    ];
    const r = mergeSelections(groups);
    assert.strictEqual(r.conflicts.length, 1);
    assert.strictEqual(r.conflicts[0].key, 'sapphire');
    assert.strictEqual(r.categories[0].selections.length, 1); // 冲突时保留 A，等仲裁
  });

  test('仲裁 keep=b 覆盖参数', () => {
    const groups = [
      { id: 'registration', selections: [
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE' } },
        { ref: 'item-registry', params: { className: 'FuelItem', regPath: 'sapphire', regField: 'SAPPHIRE' } },
      ] },
    ];
    const r = mergeSelections(groups);
    applyArbitration(r.categories, r.conflicts[0], 'b');
    assert.strictEqual(r.categories[0].selections[0].params.className, 'FuelItem');
  });

  console.log('== mock 路由 ==');

  test('路由 7 类全覆盖表态', async () => {
    const compact = require('../intent/catalog-compact').buildCompact(catalog);
    const r = await mock.route('帮我做一个抛光台', compact.route);
    assert.strictEqual(r.decisions.length, 7);
    const states = new Map(r.decisions.map((d) => [d.category, d.state]));
    assert.strictEqual(states.get('block-behavior'), 'selected');
    assert.strictEqual(states.get('block-entity-gui'), 'selected');
    assert.strictEqual(states.get('worldgen'), 'terminated');
  });

  console.log('== 端到端（mock 两段式） ==');

  let chainResult = null;
  await testAsync('抛光台 + 探测器：识别、派生、合并、校验、生成全链', async () => {
    chainResult = await runChain('帮我做一个带GUI的抛光台，再来一个能扫描矿石的金属探测器', {
      provider: mock, mode: 'two-stage', catalog, quiet, runGen: true,
      outDir: path.join(__dirname, '.tmp-intent-out'),
    });
    const refs = new Set(chainResult.ordered.map((i) => i.ref));
    assert(refs.has('block-with-gui'), '应含 block-with-gui');
    assert(refs.has('custom-recipe'), '应含 custom-recipe');
    assert(refs.has('item-detector'), '应含 item-detector');
    assert(refs.has('custom-tags'), '探测器应自动带出自定义标签');
    assert(refs.has('block-registry'), '应派生方块注册');
    assert(refs.has('item-registry'), '应派生物品注册');
    assert(fs.existsSync(path.join(chainResult.outDir, 'manifest.json')), 'manifest 应落盘');
    assert(chainResult.generation.written.length > 0, '应生成 Java 文件');
    const mainFile = chainResult.generation.written.find((w) => w.endsWith('TutorialMod.java'));
    assert(mainFile, '应生成主类');
  });

  test('派生链可追溯（ASSEMBLY 含派生来源）', () => {
    const report = fs.readFileSync(path.join(chainResult.outDir, 'ASSEMBLY.md'), 'utf8');
    assert(report.includes('（由 `block-with-gui` 派生）'), 'ASSEMBLY 应记录 block-registry 的派生来源');
  });

  console.log('== 端到端（mock 单次模式） ==');

  await testAsync('单次模式与两段式产出等价覆盖', async () => {
    const r2 = await runChain('帮我做一个带GUI的抛光台，再来一个能扫描矿石的金属探测器', {
      provider: mock, mode: 'single', catalog, quiet, runGen: false,
      outDir: path.join(__dirname, '.tmp-intent-out-single'),
    });
    const refs = new Set(r2.ordered.map((i) => i.ref));
    assert(refs.has('block-with-gui'));
    assert(refs.has('item-detector'));
  });

  console.log('== 漏识别防护 ==');

  await testAsync('全终止请求应被拒绝（防漏识别兜底）', async () => {
    let threw = false;
    try {
      await runChain('今天天气不错', { provider: mock, mode: 'two-stage', catalog, quiet, runGen: false });
    } catch (e) {
      threw = true;
      assert(String(e.message).includes('终止'), '错误信息应说明全部终止');
    }
    assert(threw, '应抛出错误');
  });

  console.log('== 误识别防护 ==');

  test('未知分类/插座在合并与校验阶段被拦截', () => {
    assert.throws(
      () => require('../intent/index').normalizeCategories(
        { categories: [{ id: 'not-a-category', selections: [] }] }, catalog),
      /未知分类/
    );
  });

  // 清理
  fs.rmSync(path.join(__dirname, '.tmp-intent-out'), { recursive: true, force: true });
  fs.rmSync(path.join(__dirname, '.tmp-intent-out-single'), { recursive: true, force: true });

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('测试崩溃：' + e.message);
  process.exit(1);
});
