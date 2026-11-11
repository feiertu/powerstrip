'use strict';

// 模板 API 修复回归测试（对应 GitHub issue #1-#5，无网络）：
//   node scripts/template-fixes.test.js
// 断言生成产物采用 1.20.1 Forge 正确 API 形态（静态源码检查 + 资源存在性）。

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { generate } = require('../generator');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  \u2713 ' + name); }
  catch (e) { failed += 1; console.log('  \u2717 ' + name + '\n      ' + e.message); }
}

const ROOT = path.join(__dirname, '..');
const TMP = path.join(__dirname, '.tmp-fixes');
const read = (rel) => fs.readFileSync(path.join(TMP, rel), 'utf8');
const MAIN = 'src/main/java/com/kaupenjoe/tutorialmod/TutorialMod.java';

function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p)); else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(TMP, p).split(path.sep).join('/');

(async () => {
  console.log('== issue#1/#2/#3 主类形态（修复前此处应失败） ==');

  generate({ manifestPath: path.join(ROOT, 'examples/gem-polishing-station.manifest.json'), outDir: path.join(TMP, 'plain'), quiet: true });
  generate({ manifestPath: path.join(ROOT, 'examples/machine-capabilities.manifest.json'), outDir: path.join(TMP, 'cap'), quiet: true });
  generate({ manifestPath: path.join(ROOT, 'examples/worldgen-full.manifest.json'), outDir: path.join(TMP, 'wg'), quiet: true });
  generate({ manifestPath: path.join(ROOT, 'examples/loot-misc.manifest.json'), outDir: path.join(TMP, 'loot'), quiet: true });

  test('issue#1 主类无参构造（不再接收 FMLJavaModLoadingContext 参数）', () => {
    const main = read(path.join('plain', MAIN));
    assert(!main.includes('(FMLJavaModLoadingContext context)'), '不应再有带参构造');
    assert(main.includes('public TutorialMod()'), '应有无参构造');
    assert(main.includes('FMLJavaModLoadingContext.get().getModEventBus()'), '应经静态 get() 取 mod 总线');
  });

  test('issue#2 配置经 ModLoadingContext.get().registerConfig 注册', () => {
    const main = read(path.join('cap', MAIN));
    assert(main.includes('ModLoadingContext.get().registerConfig(net.minecraftforge.fml.config.ModConfig.Type.COMMON, ModConfig.SPEC)'), '1.20.1 注册形态（全限定名防类名冲突）');
    assert(!main.includes('context.registerConfig'), '不应调用不存在的 FMLJavaModLoadingContext.registerConfig');
    assert(main.includes('import net.minecraftforge.fml.ModLoadingContext;'), '应有 ModLoadingContext import');
    assert(!main.includes('import net.minecraftforge.fml.config.ModConfig;'), '不应导入 fml ModConfig（与生成配置类同名冲突）');
  });

  test('issue#3 维度 bootstrap 不再注册为 mod 总线监听器', () => {
    const main = read(path.join('wg', MAIN));
    assert(!main.includes('addListener(ModDimensions'), 'BootstapContext 参数方法不是 IModBusEvent');
  });

  test('issue#3 维度 JSON 作为静态资源随包提供', () => {
    const dimType = path.join(TMP, 'wg', 'src/main/resources/data/tutorialmod/dimension_type/kaupendim_type.json');
    const dim = path.join(TMP, 'wg', 'src/main/resources/data/tutorialmod/dimension/kaupendim.json');
    assert(fs.existsSync(dimType), '应有 dimension_type JSON');
    assert(fs.existsSync(dim), '应有 dimension JSON');
    const dt = JSON.parse(fs.readFileSync(dimType, 'utf8'));
    assert.strictEqual(dt.fixed_time, 12000);
    assert.strictEqual(dt.effects, 'minecraft:overworld');
    assert.strictEqual(dt.height, 256);
    const d = JSON.parse(fs.readFileSync(dim, 'utf8'));
    assert.strictEqual(d.type, 'tutorialmod:kaupendim_type');
    assert.strictEqual(d.generator.type, 'minecraft:noise');
    assert.strictEqual(d.generator.biome_source.type, 'minecraft:fixed');
    assert.strictEqual(d.generator.biome_source.biome, 'minecraft:plains');
  });

  console.log('== issue#4 战利品修饰器 codec 直注册（修复前此处应失败） ==');

  test('issue#4 生成代码不引用 1.20.1 不存在的 GlobalLootModifierSerializer', () => {
    const lootDir = path.join(TMP, 'loot', 'src/main/java/com/kaupenjoe/tutorialmod/loot');
    const files = listFiles(lootDir);
    assert(files.length >= 2, '应有 loot 目录与文件');
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      assert(!src.includes('GlobalLootModifierSerializer'), rel(f) + ' 不应引用已移除的类');
    }
  });

  test('issue#4 修饰器类暴露静态 CODEC 且无 Serializer 内部类', () => {
    const src = read(path.join('loot', 'src/main/java/com/kaupenjoe/tutorialmod/loot/AddItemModifier.java'));
    assert(src.includes('public static final Codec<AddItemModifier> CODEC'), '静态 CODEC 字段');
    assert(src.includes('RecordCodecBuilder.create'), 'RecordCodecBuilder 构造');
    assert(!src.includes('class Serializer'), '不应再有 Serializer 内部类');
    assert(!src.includes('INSTANCE'), '不应再有 INSTANCE 单例');
    assert(src.includes('return CODEC;'), 'codec() 返回 CODEC');
  });

  test('issue#4 注册中心直接注册 Codec', () => {
    const hub = read(path.join('loot', 'src/main/java/com/kaupenjoe/tutorialmod/loot/ModLootModifiers.java'));
    assert(hub.includes('DeferredRegister<Codec<? extends IGlobalLootModifier>>'), 'Codec 泛型注册表');
    assert(hub.includes('.register("add_item", () -> AddItemModifier.CODEC)'), '直注册修饰器 CODEC');
    assert(!hub.includes('GlobalLootModifierSerializer'), '不应引用已移除的类');
  });

  console.log('== issue#5 插件文档（修复前此处应失败） ==');

  test('issue#5 文档注明 run_code 子上下文限制与 Node 直调替代', () => {
    const doc = fs.readFileSync(path.join(ROOT, 'docs/DSH插件.md'), 'utf8');
    assert(doc.includes('run_code'), '应说明 run_code 子上下文限制');
    assert(doc.includes('generator.js'), '应给出 generate 的 Node 直调示例');
    assert(doc.includes('runChain'), '应给出意图层 runChain 直调示例');
  });

  fs.rmSync(TMP, { recursive: true, force: true });

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('测试崩溃：' + e.message);
  process.exit(1);
});
