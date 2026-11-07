'use strict';

// 资源层防错乱测试（无网络）：
//   node scripts/resource-layer.test.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { generate } = require('../generator');
const { checkSideConsistency, checkNbtKeys } = require('../lib/checks');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  \u2713 ' + name); }
  catch (e) { failed += 1; console.log('  \u2717 ' + name + '\n      ' + e.message); }
}

const ROOT = path.join(__dirname, '..');
const tmp = (name) => path.join(__dirname, '.tmp-res', name);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function gen(manifest, outName) {
  return generate({ manifestPath: path.join(ROOT, 'examples', manifest), outDir: tmp(outName), quiet: true });
}

function pngDims(buf) {
  assert.strictEqual(buf.readUInt32BE(0), 0x89504e47, 'PNG 魔数');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

(async () => {
  console.log('== 基础资源生成 ==');

  const misc = gen('misc-blocks.manifest.json', 'misc');
  test('作物 blockstate 含 0..maxAge 全部生长阶段', () => {
    const bs = JSON.parse(read(path.join('scripts/.tmp-res/misc', 'src/main/resources/assets/tutorialmod/blockstates/corn_crop.json')));
    const ages = Object.keys(bs.variants);
    assert.strictEqual(ages.length, 8);
    assert(ages.includes('age=7'));
    const stage7 = path.join('scripts/.tmp-res/misc', 'src/main/resources/assets/tutorialmod/models/block/corn_crop_stage7.json');
    assert(fs.existsSync(path.join(ROOT, stage7)), '应生成 stage7 模型');
  });
  test('旋转柱生成 cube_column 模型与三轴 blockstate', () => {
    const bs = JSON.parse(read(path.join('scripts/.tmp-res/misc', 'src/main/resources/assets/tutorialmod/blockstates/pine_log.json')));
    assert(bs.variants['axis=x'] && bs.variants['axis=y'] && bs.variants['axis=z']);
    const model = JSON.parse(read(path.join('scripts/.tmp-res/misc', 'src/main/resources/assets/tutorialmod/models/block/pine_log.json')));
    assert.strictEqual(model.parent, 'minecraft:block/cube_column');
  });
  test('骰子方块生成 cube_all 模型', () => {
    const model = JSON.parse(read(path.join('scripts/.tmp-res/misc', 'src/main/resources/assets/tutorialmod/models/block/dice_block.json')));
    assert.strictEqual(model.parent, 'minecraft:block/cube_all');
  });
  test('占位贴图是合法 1×1 PNG', () => {
    const buf = fs.readFileSync(path.join(ROOT, 'scripts/.tmp-res/misc/src/main/resources/assets/tutorialmod/textures/block/dice_block.png'));
    const d = pngDims(buf);
    assert.strictEqual(d.w, 1);
    assert.strictEqual(d.h, 1);
  });

  console.log('== 实体资源 + 引用一致性 ==');

  const rhino = gen('entity-rhino.manifest.json', 'rhino');
  test('实体 geo/animation/贴图齐备且动画名与 ModAnimationDefinitions 一致', () => {
    const anim = JSON.parse(read(path.join('scripts/.tmp-res/rhino', 'src/main/resources/assets/tutorialmod/animations/rhino.animation.json')));
    assert(anim.animations['rhino_idle'], '应含 rhino_idle');
    assert(anim.animations['rhino_walk'], '应含 rhino_walk');
    const geo = JSON.parse(read(path.join('scripts/.tmp-res/rhino', 'src/main/resources/assets/tutorialmod/geo/rhino.geo.json')));
    assert.strictEqual(geo['minecraft:geometry'][0].description.identifier, 'geometry.rhino');
    assert(fs.existsSync(path.join(ROOT, 'scripts/.tmp-res/rhino/src/main/resources/assets/tutorialmod/textures/entity/rhino.png')));
    // 模型模板引用的动画字段与动画文件内容闭环
    const model = fs.readFileSync(path.join(ROOT, 'scripts/.tmp-res/rhino/src/main/java/com/kaupenjoe/tutorialmod/entity/client/RhinoModel.java'), 'utf8');
    assert(model.includes('ModAnimationDefinitions.RHINO_IDLE'));
  });
  test('语言文件含实体与方块键', () => {
    const lang = JSON.parse(read(path.join('scripts/.tmp-res/rhino', 'src/main/resources/assets/tutorialmod/lang/en_us.json')));
    assert(lang['entity.tutorialmod.rhino']);
  });

  console.log('== 注册类资源聚合 ==');

  const kitchen = gen('registration-kitchen.manifest.json', 'kitchen');
  test('sounds.json 与语言文件聚合正确', () => {
    const sounds = JSON.parse(read(path.join('scripts/.tmp-res/kitchen', 'src/main/resources/assets/tutorialmod/sounds.json')));
    assert(sounds.metal_detector_found_ore);
    assert.strictEqual(sounds.metal_detector_found_ore.subtitle, 'subtitles.tutorialmod.metal_detector_found_ore');
    const lang = JSON.parse(read(path.join('scripts/.tmp-res/kitchen', 'src/main/resources/assets/tutorialmod/lang/en_us.json')));
    assert(lang['item.tutorialmod.sapphire']);
    assert(lang['block.tutorialmod.sound_block']);
    assert(lang['entity.minecraft.villager.soundmaster']);
  });

  console.log('== 数据 JSON + 简化点留白 ==');

  const loot = gen('loot-misc.manifest.json', 'loot');
  test('标签/战利品修饰 JSON 落位', () => {
    const tag = JSON.parse(read(path.join('scripts/.tmp-res/loot', 'src/main/resources/data/tutorialmod/tags/blocks/my_block_tag.json')));
    assert.deepStrictEqual(tag.values, []);
    const entry = JSON.parse(read(path.join('scripts/.tmp-res/loot', 'src/main/resources/data/tutorialmod/loot_modifiers/add_item.json')));
    assert.strictEqual(entry.added_item.id, 'minecraft:diamond');
    const global = JSON.parse(read(path.join('scripts/.tmp-res/loot', 'src/main/resources/data/forge/loot_modifiers/global_loot_modifiers.json')));
    assert(global.entries.includes('tutorialmod:add_item'));
  });
  test('告示牌 modelStyle=custom → 不生成通用方块模型（简化点留白，防止错误模型误导）', () => {
    assert(!fs.existsSync(path.join(ROOT, 'scripts/.tmp-res/loot/src/main/resources/assets/tutorialmod/blockstates/pine_sign.json')));
  });

  const polish = gen('gem-polishing-station.manifest.json', 'polish');
  test('配方 JSON 与序列化器字段一致', () => {
    const r = JSON.parse(read(path.join('scripts/.tmp-res/polish', 'src/main/resources/data/tutorialmod/recipes/gem_polishing.json')));
    assert.strictEqual(r.type, 'tutorialmod:gem_polishing');
    assert(r.ingredient && r.input_count === 3 && r.output);
  });

  console.log('== 防错乱：路径冲突 ==');

  test('两个实体共用贴图路径 → 所有权表拦截', () => {
    const manifest = {
      meta: { mcVersion: '1.20.1', loader: 'forge', modId: 'tutorialmod', group: 'com.example.tutorialmod', mainClass: 'TutorialMod' },
      categories: [{
        id: 'entity',
        selections: [
          { ref: 'creature-entity', params: {
            className: 'AlphaEntity', regPath: 'alpha', regField: 'ALPHA', modelClassName: 'AlphaModel', rendererClassName: 'AlphaRenderer',
            layerRegField: 'ALPHA_LAYER', layerPath: 'alpha_layer', modelPath: 'alpha', texturePath: 'shared', animationPath: 'alpha',
            idleAnimName: 'alpha_idle', walkAnimName: 'alpha_walk', idleAnimField: 'ALPHA_IDLE', walkAnimField: 'ALPHA_WALK' } },
          { ref: 'creature-entity', params: {
            className: 'BetaEntity', regPath: 'beta', regField: 'BETA', modelClassName: 'BetaModel', rendererClassName: 'BetaRenderer',
            layerRegField: 'BETA_LAYER', layerPath: 'beta_layer', modelPath: 'beta', texturePath: 'shared', animationPath: 'beta',
            idleAnimName: 'beta_idle', walkAnimName: 'beta_walk', idleAnimField: 'BETA_IDLE', walkAnimField: 'BETA_WALK' } },
        ],
      }],
    };
    fs.writeFileSync(tmp('conflict-manifest.json'), JSON.stringify(manifest), 'utf8');
    assert.throws(
      () => generate({ manifestPath: tmp('conflict-manifest.json'), outDir: tmp('conflict'), quiet: true }),
      /资源路径冲突/
    );
  });

  console.log('== 防错乱：NBT 键对称核查 ==');

  test('put/get 键漂移被拦截（单元）', () => {
    const dir = tmp('nbt-unit');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'block/entity/custom'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'block/entity/custom/BadBE.java'),
      'void saveAdditional(CompoundTag pTag){ pTag.put("inventory", x); pTag.putInt("a.b", 1); }\n' +
      'void load(CompoundTag pTag){ pTag.getCompound("inventory"); pTag.getInt("x.y"); }\n', 'utf8');
    const violations = checkNbtKeys(dir, ['block/entity/custom/BadBE.java']);
    assert.strictEqual(violations.length, 1);
    assert(violations[0].includes('a.b'));
  });
  test('对称键通过（单元）', () => {
    const dir = tmp('nbt-unit2');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'block/entity/custom'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'block/entity/custom/GoodBE.java'),
      'pTag.put("inventory", x); pTag.putInt("a.b", 1); pTag.getCompound("inventory"); pTag.getInt("a.b");', 'utf8');
    assert.strictEqual(checkNbtKeys(dir, ['block/entity/custom/GoodBE.java']).length, 0);
  });

  console.log('== 防错乱：客户端/服务端一致性核查 ==');

  test('客户端类出现在公共区域被拦截、ClientModEvents 区域放行（单元）', () => {
    const dir = tmp('side-unit');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const main = [
      'public class TutorialMod {',
      '    public TutorialMod() {',
      '        bad(new TestRenderer()); // 应拦截',
      '    }',
      '    public static class ClientModEvents {',
      '        static void setup() { new TestRenderer(); } // 应放行',
      '    }',
      '}',
    ].join('\n');
    fs.writeFileSync(path.join(dir, 'TutorialMod.java'), main, 'utf8');
    const violations = checkSideConsistency(dir, ['TutorialMod.java'], ['TestRenderer'], 'TutorialMod');
    assert.strictEqual(violations.length, 1);
    assert(violations[0].includes(':3'), '应指向第 3 行（构造器中的引用）');
  });

  console.log('== 全链静态核查（真实生成物） ==');

  test('entity-rhino 生成物通过 side 与 NBT 核查', () => {
    const dir = path.join(ROOT, 'scripts/.tmp-res/rhino');
    const javaRels = rhino.written;
    const clientClasses = ['RhinoModel', 'RhinoRenderer'];
    assert.strictEqual(checkSideConsistency(dir, javaRels, clientClasses, 'TutorialMod').length, 0);
    assert.strictEqual(checkNbtKeys(dir, javaRels).length, 0);
  });

  // 清理
  fs.rmSync(path.join(__dirname, '.tmp-res'), { recursive: true, force: true });

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('测试崩溃：' + e.message);
  process.exit(1);
});
