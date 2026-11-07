'use strict';

// 能力层测试（networking / energy / config-system，无网络）：
//   node scripts/capability-layer.test.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { generate } = require('../generator');
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

const ROOT = path.join(__dirname, '..');
const tmp = (n) => path.join(__dirname, '.tmp-cap', n);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const baseManifest = () => JSON.parse(read('examples/machine-capabilities.manifest.json'));
const BE_PATH = 'src/main/java/com/kaupenjoe/tutorialmod/block/entity/custom/GemPolishingStationBlockEntity.java';

(async () => {
  console.log('== 全能力生成 ==');

  const full = generate({ manifestPath: path.join(ROOT, 'examples/machine-capabilities.manifest.json'), outDir: tmp('full'), quiet: true });

  test('Network hub：单通道 + 消息 ID 顺序分配', () => {
    const net = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/networking/Network.java'));
    assert(net.includes('NetworkRegistry.ChannelBuilder'), '应有 ChannelBuilder');
    assert(net.includes('PROTOCOL_VERSION = "1.0"'));
    const regs = (net.match(/registerMessage/g) || []).length;
    assert.strictEqual(regs, 2, 'C2S+S2C 两条消息');
    assert(net.includes('registerMessage(0, GemPolishingStationBlockEntityC2SPacket'));
    assert(net.includes('registerMessage(1, GemPolishingStationBlockEntityS2CPacket'));
  });

  test('C2S/S2C 独立 Packet 类生成', () => {
    const c2s = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/networking/packet/GemPolishingStationBlockEntityC2SPacket.java'));
    assert(c2s.includes('writeBlockPos') && c2s.includes('writeVarInt') && c2s.includes('handlePacketAction'));
    const s2c = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/networking/packet/GemPolishingStationBlockEntityS2CPacket.java'));
    assert(s2c.includes('sendSystemMessage'));
  });

  test('方块实体注入：能量存储 + 耗能门 + 包处理 + 完成通知', () => {
    const be = read(path.join('scripts/.tmp-cap/full', BE_PATH));
    assert(be.includes('ForgeEnergyStorage energyStorage'), '能量存储字段');
    assert(be.includes('ForgeCapabilities.ENERGY'), 'getCapability 能量分支');
    assert(be.includes('consumeEnergy()'), '耗能方法');
    assert(be.includes('hasRecipe() && !consumeEnergy()'), '耗能门');
    assert(be.includes('handlePacketAction'), 'C2S 处理入口');
    assert(be.includes('PacketDistributor.TRACKING_CHUNK'), 'S2C 通知发送');
  });

  test('Menu 注入 getBlockEntity；Screen 注入按钮 + 点击发包', () => {
    const menu = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/screen/GemPolishingStationMenu.java'));
    assert(menu.includes('public GemPolishingStationBlockEntity getBlockEntity()'));
    const screen = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/screen/GemPolishingStationScreen.java'));
    assert(screen.includes('mouseClicked'), '按钮点击');
    assert(screen.includes('sendToServer(new GemPolishingStationBlockEntityC2SPacket'), 'C2S 发包');
    assert(screen.includes('drawString(this.font, "Clear"'), '按钮绘制');
  });

  test('外壳接线：Network.register + 配置注册', () => {
    const shell = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/TutorialMod.java'));
    assert(shell.includes('Network.register()'));
    assert(shell.includes('context.registerConfig(ModConfig.Type.COMMON, ModConfig.SPEC'));
    assert(shell.includes('import com.kaupenjoe.tutorialmod.config.ModConfig;'));
  });

  test('配置类：int/double/boolean 三型 + defineInRange/define', () => {
    const cfg = read(path.join('scripts/.tmp-cap/full', 'src/main/java/com/kaupenjoe/tutorialmod/config/ModConfig.java'));
    assert(cfg.includes('ForgeConfigSpec.IntValue CRAFT_TIME'), 'int 项');
    assert(cfg.includes('defineInRange("craft_time", 78, 1, 1200)'));
    assert(cfg.includes('ForgeConfigSpec.BooleanValue LUCKY_DROP'), 'bool 项');
    assert(cfg.includes('define("lucky_drop", false)'), 'bool 默认 false 渲染正确');
    assert(cfg.includes('ForgeConfigSpec.DoubleValue SPEED_MULTIPLIER'), 'double 项');
  });

  console.log('== 注入隔离 ==');

  test('无能力时方块实体不被注入（干净基线）', () => {
    generate({ manifestPath: path.join(ROOT, 'examples/gem-polishing-station.manifest.json'), outDir: tmp('plain'), quiet: true });
    const be = read(path.join('scripts/.tmp-cap/plain', BE_PATH));
    assert(!be.includes('ForgeEnergyStorage'));
    assert(!be.includes('handlePacketAction'));
  });

  test('consumePerTick=0 → 只存不耗（无 consumeEnergy）', () => {
    const m = baseManifest();
    m.categories.find((c) => c.id === 'capabilities').selections = m.categories
      .find((c) => c.id === 'capabilities').selections.filter((s) => s.ref !== 'networking');
    const energy = m.categories.find((c) => c.id === 'capabilities').selections.find((s) => s.ref === 'energy');
    energy.params.consumePerTick = 0;
    fs.writeFileSync(tmp('no-consume.json'), JSON.stringify(m), 'utf8');
    generate({ manifestPath: tmp('no-consume.json'), outDir: tmp('no-consume'), quiet: true });
    const be = read(path.join('scripts/.tmp-cap/no-consume', BE_PATH));
    assert(be.includes('ForgeEnergyStorage'), '仍应有能量存储');
    assert(!be.includes('consumeEnergy()'), '不应有耗能方法');
  });

  test('多 networking 实例通道参数不一致 → 保护门拦截', () => {
    const m = baseManifest();
    const caps = m.categories.find((c) => c.id === 'capabilities');
    caps.selections.push({ ref: 'networking', params: { beClassName: 'GemPolishingStationBlockEntity', networkClassName: 'OtherNetwork', channelPath: 'main', protocolVersion: '1.0' } });
    fs.writeFileSync(tmp('conflict-net.json'), JSON.stringify(m), 'utf8');
    assert.throws(
      () => generate({ manifestPath: tmp('conflict-net.json'), outDir: tmp('conflict-net'), quiet: true }),
      /必须使用相同的 networkClassName/
    );
  });

  console.log('== 意图层联动（mock） ==');

  await testAsync('"抛光台加网络同步和能量" → 识别出 networking + energy', async () => {
    const r = await runChain('我要一个抛光台，加网络同步和能量系统', {
      provider: mock, mode: 'two-stage', catalog: loadCatalog(), quiet: true, runGen: false, outDir: tmp('intent-cap'),
    });
    const refs = new Set(r.ordered.map((i) => i.ref));
    assert(refs.has('networking'));
    assert(refs.has('energy'));
    assert(refs.has('block-with-gui'));
  });

  fs.rmSync(path.join(__dirname, '.tmp-cap'), { recursive: true, force: true });

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('测试崩溃：' + e.message);
  process.exit(1);
});
