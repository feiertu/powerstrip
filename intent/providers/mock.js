'use strict';

// 离线「无模型」provider：关键词 → 预置场景。
// 用途：无 API Key 时的降级演示、意图链端到端测试（参数集均来自已通过护栏校验的示例答卷）。
// 与 api provider 实现同一接口：{ route, fill, arbitrate, singleShot }，全部返回解析好的对象。

const SCENARIOS = [
  {
    label: '带GUI机器', pattern: /抛光|打磨|加工台|机床|机器/,
    cats: {
      'block-behavior': [
        { ref: 'block-with-gui', params: {
          className: 'GemPolishingStationBlock', registryPath: 'gem_polishing_station', registryField: 'GEM_POLISHING_STATION',
          beClassName: 'GemPolishingStationBlockEntity', beRegistryPath: 'gem_polishing_be', beRegistryField: 'GEM_POLISHING_BE',
          menuClassName: 'GemPolishingStationMenu', menuRegistryPath: 'gem_polishing_menu', menuRegistryField: 'GEM_POLISHING_MENU',
          screenClassName: 'GemPolishingStationScreen', rendererClassName: 'GemPolishingBlockEntityRenderer',
          guiTexturePath: 'gem_polishing_station_gui', propertiesPreset: 'machine', craftTime: 78 } },
      ],
      'block-entity-gui': [
        { ref: 'custom-recipe', params: {
          recipeClassName: 'GemPolishingRecipe', recipeId: 'gem_polishing', serializerField: 'GEM_POLISHING_SERIALIZER',
          typeField: 'GEM_POLISHING_TYPE', inputCount: 3, outputItem: 'minecraft:diamond', outputCount: 1 } },
      ],
    },
  },
  {
    label: '矿石探测器', pattern: /探测器|扫描|探矿/,
    cats: {
      'item-behavior': [
        { ref: 'item-detector', params: {
          className: 'MetalDetectorItem', regPath: 'metal_detector', regField: 'METAL_DETECTOR',
          durability: 100, tagRegField: 'METAL_DETECTOR_VALUABLES', tagPath: 'metal_detector_valuables' } },
      ],
    },
  },
  {
    label: '作物', pattern: /作物|玉米|庄稼/,
    cats: {
      'block-behavior': [
        { ref: 'crop-block', params: {
          className: 'CornCropBlock', regPath: 'corn_crop', regField: 'CORN_CROP', seedRegField: 'CORN_CROP_SEEDS', maxAge: 7 } },
      ],
    },
  },
  {
    label: '骰子方块', pattern: /骰子方块|掷骰|随机方块/,
    cats: {
      'block-behavior': [
        { ref: 'interact-random-block', params: {
          className: 'DiceBlock', regPath: 'dice_block', regField: 'DICE_BLOCK',
          maxNumber: 6, luckyNumber: 6, luckyItem: 'DIAMOND', xpAmount: 10 } },
      ],
    },
  },
  {
    label: '原木', pattern: /原木|木柱|圆木|木头/,
    cats: {
      'block-behavior': [
        { ref: 'flammable-rotated-pillar', params: {
          className: 'ModFlammableRotatedPillarBlock', regPath: 'pine_log', regField: 'PINE_LOG' } },
      ],
    },
  },
  {
    label: '告示牌', pattern: /告示牌|牌子|木牌/,
    cats: {
      'block-behavior': [
        { ref: 'sign-block', params: {
          className: 'ModStandingSignBlock', wallClassName: 'ModWallSignBlock', regPath: 'pine_sign', wallRegPath: 'pine_wall_sign',
          regField: 'PINE_SIGN', wallRegField: 'PINE_WALL_SIGN', beClassName: 'ModSignBlockEntity',
          beRegField: 'SIGN_BLOCK_ENTITIES', woodRegField: 'PINE' } },
      ],
      'loot-data-compat': [
        { ref: 'wood-types', params: { regField: 'PINE', woodName: 'pine' } },
      ],
    },
  },
  {
    label: '音效', pattern: /音效|声音方块|声音/,
    cats: {
      registration: [
        { ref: 'sound-registry', params: { regField: 'METAL_DETECTOR_FOUND_ORE', regPath: 'metal_detector_found_ore', soundType: 'variable-range' } },
      ],
      'block-behavior': [
        { ref: 'sound-block', params: { className: 'SoundBlock', regPath: 'sound_block', regField: 'SOUND_BLOCK', soundRegField: 'METAL_DETECTOR_FOUND_ORE' } },
      ],
    },
  },
  {
    label: '生物实体', pattern: /生物|犀牛|实体动物|动物/,
    cats: {
      entity: [
        { ref: 'creature-entity', params: {
          className: 'RhinoEntity', regPath: 'rhino', regField: 'RHINO', mobCategory: 'CREATURE', width: 2.5, height: 2.5,
          health: 20.0, moveSpeed: 0.25, attackDamage: 4.0, foodItem: 'APPLE', modelClassName: 'RhinoModel',
          rendererClassName: 'RhinoRenderer', layerRegField: 'RHINO_LAYER', layerPath: 'rhino_layer', modelPath: 'rhino',
          texturePath: 'rhino', animationPath: 'rhino', idleAnimName: 'rhino_idle', walkAnimName: 'rhino_walk',
          idleAnimField: 'RHINO_IDLE', walkAnimField: 'RHINO_WALK', attackGoalClassName: 'RhinoAttackGoal' } },
        { ref: 'ai-goal', params: { goalClassName: 'RhinoAttackGoal', entityClassName: 'RhinoEntity' } },
      ],
    },
  },
  {
    label: '船', pattern: /船|交通工具/,
    cats: {
      'item-behavior': [
        { ref: 'boat-item', params: {
          className: 'ModBoatItem', regPath: 'mod_boat', regField: 'MOD_BOAT', boatEntityClassName: 'ModBoatEntity',
          boatEntityRegPath: 'mod_boat', boatEntityRegField: 'MOD_BOAT_ENTITY', boatRendererClassName: 'ModBoatRenderer' } },
      ],
    },
  },
  {
    label: '盔甲', pattern: /盔甲|护甲|胸甲/,
    cats: {
      registration: [
        { ref: 'armor-material-registry', params: { regField: 'SAPPHIRE', name: 'sapphire', repairItemField: 'RAW_SAPPHIRE' } },
        { ref: 'item-registry', params: { className: 'Item', regPath: 'raw_sapphire', regField: 'RAW_SAPPHIRE', constructorExpr: 'new Item(new Item.Properties())', customClass: false } },
      ],
      'item-behavior': [
        { ref: 'custom-armor', params: { className: 'ModArmorItem', regPath: 'sapphire_chestplate', regField: 'SAPPHIRE_CHESTPLATE', materialRegField: 'SAPPHIRE', armorType: 'CHESTPLATE' } },
      ],
    },
  },
  {
    label: '燃料', pattern: /燃料|可燃物品/,
    cats: {
      'item-behavior': [
        { ref: 'fuel-item', params: { className: 'FuelItem', regPath: 'fuel_item', regField: 'FUEL_ITEM', burnTime: 200 } },
      ],
    },
  },
  {
    label: '投掷物', pattern: /投掷|投射物|飞镖|骰子物品/,
    cats: {
      'item-behavior': [
        { ref: 'throwable-item', params: {
          className: 'DiceItem', regPath: 'dice', regField: 'DICE', projectileClassName: 'DiceProjectileEntity',
          projectileRegPath: 'dice_projectile', projectileRegField: 'DICE_PROJECTILE' } },
      ],
    },
  },
  {
    label: '矿物生成', pattern: /矿物|矿脉|矿石/,
    cats: {
      registration: [
        { ref: 'block-registry', params: { className: 'Block', registryPath: 'sapphire_ore', registryField: 'SAPPHIRE_ORE', propertiesPreset: 'stone-like' } },
      ],
      worldgen: [
        { ref: 'ore-generation', params: {
          keyField: 'OVERWORLD_SAPPHIRE_ORE_KEY', keyPath: 'sapphire_ore', oreBlockRegField: 'SAPPHIRE_ORE',
          modifierRegField: 'ADD_SAPPHIRE_ORE', modifierRegPath: 'add_sapphire_ore',
          veinSize: 9, veinsPerChunk: 12, minHeight: -64, maxHeight: 80 } },
      ],
    },
  },
  {
    label: '树生成', pattern: /树|松树|森林/,
    cats: {
      registration: [
        { ref: 'block-registry', params: { className: 'Block', registryPath: 'pine_log_block', registryField: 'PINE_LOG', propertiesPreset: 'wood-log' } },
        { ref: 'block-registry', params: { className: 'Block', registryPath: 'pine_leaves', registryField: 'PINE_LEAVES', propertiesPreset: 'stone-like' } },
      ],
      worldgen: [
        { ref: 'tree-generation', params: {
          trunkPlacerClassName: 'PineTrunkPlacer', foliagePlacerClassName: 'PineFoliagePlacer', treeGrowerClassName: 'PineTreeGrower',
          trunkRegField: 'PINE_TRUNK_PLACER', trunkRegPath: 'pine_trunk_placer', foliageRegField: 'PINE_FOLIAGE_PLACER',
          foliageRegPath: 'pine_foliage_placer', featureKeyField: 'PINE_KEY', featureKeyPath: 'pine',
          logBlockRegField: 'PINE_LOG', leavesBlockRegField: 'PINE_LEAVES', baseHeight: 5, heightRandA: 4, heightRandB: 3,
          foliageRadius: 2, foliageOffset: 0 } },
      ],
    },
  },
  {
    label: '维度传送门', pattern: /维度|传送门|异世界/,
    cats: {
      worldgen: [
        { ref: 'dimension', params: { dimPath: 'kaupendim', levelStemKeyField: 'KAUPENDIM_KEY', levelKeyField: 'KAUPENDIM_LEVEL_KEY', typeKeyField: 'KAUPENDIM_TYPE' } },
        { ref: 'teleporter', params: { teleporterClassName: 'ModTeleporter', dimLevelKeyField: 'KAUPENDIM_LEVEL_KEY' } },
      ],
      'block-behavior': [
        { ref: 'portal-block', params: { className: 'ModPortalBlock', regPath: 'kaupen_portal', regField: 'KAUPEN_PORTAL', dimLevelKeyField: 'KAUPENDIM_LEVEL_KEY', teleporterClassName: 'ModTeleporter' } },
      ],
    },
  },
  {
    label: '战利品修饰', pattern: /战利品|掉落物/,
    cats: {
      'loot-data-compat': [
        { ref: 'add-item-modifier', params: { className: 'AddItemModifier', regField: 'ADD_ITEM', regPath: 'add_item', addedItem: 'minecraft:diamond', count: 1 } },
      ],
    },
  },
  {
    label: '自定义标签', pattern: /标签|tag/,
    cats: {
      'loot-data-compat': [
        { ref: 'custom-tags', params: { regField: 'MY_BLOCK_TAG', tagPath: 'my_block_tag', tagType: 'block' } },
      ],
    },
  },
  {
    label: '数据生成', pattern: /数据生成|datagen|生成json/i,
    cats: {
      'loot-data-compat': [
        { ref: 'data-generator', params: { simpleCubeBlocks: [], selfDropBlocks: [], simpleItems: [], handheldItems: [] } },
      ],
    },
  },
  {
    label: 'JEI兼容', pattern: /jei|配方查询/i,
    cats: {
      registration: [
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE', constructorExpr: 'new Item(new Item.Properties())', customClass: false } },
      ],
      'loot-data-compat': [
        { ref: 'jei-compat', params: { className: 'JEITutorialModPlugin', infoItems: [{ kind: 'item', field: 'SAPPHIRE' }], infoText: 'Generated by PowerStrip' } },
      ],
    },
  },
  {
    label: '事件监听', pattern: /事件|监听/,
    cats: {
      'loot-data-compat': [
        { ref: 'event-listener', params: { regField: 'EVENTS' } },
      ],
    },
  },
  {
    label: '食物', pattern: /食物|草莓|吃的/,
    cats: {
      registration: [
        { ref: 'food-registry', params: { regField: 'STRAWBERRY', nutrition: 2, saturationMod: 0.2, meat: false } },
        { ref: 'item-registry', params: { className: 'Item', regPath: 'strawberry', regField: 'STRAWBERRY', constructorExpr: 'new Item(new Item.Properties().food(ModFoods.STRAWBERRY))', customClass: false } },
      ],
    },
  },
  {
    label: '工具等级', pattern: /工具|镐子|锄头|剑|等级/,
    cats: {
      registration: [
        { ref: 'tool-tier-registry', params: { regField: 'SAPPHIRE', uses: 1561, speed: 8.0, damage: 3.0, level: 3, enchantmentValue: 10, repairItemField: 'SAPPHIRE' } },
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE', constructorExpr: 'new Item(new Item.Properties())', customClass: false } },
      ],
    },
  },
  {
    label: '创造标签页', pattern: /创造标签|标签页|创造模式物品栏/,
    cats: {
      registration: [
        { ref: 'creative-tab-registry', params: { regField: 'TUTORIAL_TAB', regPath: 'tutorial_tab', iconKind: 'item', iconField: 'SAPPHIRE', displayItems: [{ kind: 'item', field: 'SAPPHIRE' }] } },
        { ref: 'item-registry', params: { className: 'Item', regPath: 'sapphire', regField: 'SAPPHIRE', constructorExpr: 'new Item(new Item.Properties())', customClass: false } },
      ],
    },
  },
  {
    label: '村民职业', pattern: /村民|职业/,
    cats: {
      registration: [
        { ref: 'villager-registry', params: { professionName: 'soundmaster', professionRegField: 'SOUND_MASTER', poiRegField: 'SOUND_POI', poiRegPath: 'sound_poi', blockRegField: 'SOUND_BLOCK', workSound: 'SoundEvents.VILLAGER_WORK_ARMORER' } },
        { ref: 'sound-registry', params: { regField: 'METAL_DETECTOR_FOUND_ORE', regPath: 'metal_detector_found_ore', soundType: 'variable-range' } },
      ],
      'block-behavior': [
        { ref: 'sound-block', params: { className: 'SoundBlock', regPath: 'sound_block', regField: 'SOUND_BLOCK', soundRegField: 'METAL_DETECTOR_FOUND_ORE' } },
      ],
    },
  },
  {
    label: '网络同步', pattern: /网络|同步|数据包|packet/i,
    cats: {
      'block-behavior': [
        { ref: 'block-with-gui', params: {
          className: 'GemPolishingStationBlock', registryPath: 'gem_polishing_station', registryField: 'GEM_POLISHING_STATION',
          beClassName: 'GemPolishingStationBlockEntity', beRegistryPath: 'gem_polishing_be', beRegistryField: 'GEM_POLISHING_BE',
          menuClassName: 'GemPolishingStationMenu', menuRegistryPath: 'gem_polishing_menu', menuRegistryField: 'GEM_POLISHING_MENU',
          screenClassName: 'GemPolishingStationScreen', rendererClassName: 'GemPolishingBlockEntityRenderer',
          guiTexturePath: 'gem_polishing_station_gui', propertiesPreset: 'machine', craftTime: 78 } },
      ],
      'block-entity-gui': [
        { ref: 'custom-recipe', params: {
          recipeClassName: 'GemPolishingRecipe', recipeId: 'gem_polishing', serializerField: 'GEM_POLISHING_SERIALIZER',
          typeField: 'GEM_POLISHING_TYPE', inputCount: 3, outputItem: 'minecraft:diamond', outputCount: 1 } },
      ],
      capabilities: [
        { ref: 'networking', params: { beClassName: 'GemPolishingStationBlockEntity', networkClassName: 'Network', channelPath: 'main', protocolVersion: '1.0', withC2S: true, withS2C: true } },
      ],
    },
  },
  {
    label: '能量系统', pattern: /能量|电力|耗电|fe|rf/i,
    cats: {
      'block-behavior': [
        { ref: 'block-with-gui', params: {
          className: 'GemPolishingStationBlock', registryPath: 'gem_polishing_station', registryField: 'GEM_POLISHING_STATION',
          beClassName: 'GemPolishingStationBlockEntity', beRegistryPath: 'gem_polishing_be', beRegistryField: 'GEM_POLISHING_BE',
          menuClassName: 'GemPolishingStationMenu', menuRegistryPath: 'gem_polishing_menu', menuRegistryField: 'GEM_POLISHING_MENU',
          screenClassName: 'GemPolishingStationScreen', rendererClassName: 'GemPolishingBlockEntityRenderer',
          guiTexturePath: 'gem_polishing_station_gui', propertiesPreset: 'machine', craftTime: 78 } },
      ],
      'block-entity-gui': [
        { ref: 'custom-recipe', params: {
          recipeClassName: 'GemPolishingRecipe', recipeId: 'gem_polishing', serializerField: 'GEM_POLISHING_SERIALIZER',
          typeField: 'GEM_POLISHING_TYPE', inputCount: 3, outputItem: 'minecraft:diamond', outputCount: 1 } },
      ],
      capabilities: [
        { ref: 'energy', params: { beClassName: 'GemPolishingStationBlockEntity', capacity: 10000, maxReceive: 200, maxExtract: 200, consumePerTick: 4 } },
      ],
    },
  },
  {
    label: '配置系统', pattern: /配置|可调参数|config/i,
    cats: {
      capabilities: [
        { ref: 'config-system', params: { configClassName: 'ModConfig', entries: [
          { key: 'craft_time', type: 'int', default: 78, min: 1, max: 1200, comment: 'Craft time in ticks' },
        ] } },
      ],
    },
  },
];

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function matchScenarios(text) {
  return SCENARIOS.filter((s) => s.pattern.test(text));
}

function categoriesOf(hits) {
  const set = new Set();
  for (const h of hits) for (const c of Object.keys(h.cats)) set.add(c);
  return [...set];
}

module.exports = {
  name: 'mock',

  async route(text, compact) {
    const hits = matchScenarios(text);
    const selected = categoriesOf(hits);
    const decisions = compact.categories.map((c) => ({
      category: c.id,
      state: selected.includes(c.id) ? 'selected' : 'terminated',
      mentions: selected.includes(c.id)
        ? hits.filter((h) => h.cats[c.id]).map((h) => h.label).join('、')
        : '',
    }));
    const intents = hits.flatMap((h) => categoriesOf([h]).map((cid) => ({
      category: cid,
      summary: h.label,
      terms: [h.label],
    })));
    return { decisions, intents };
  },

  async fill(text, categoryId, compactCat, opts) {
    const hits = matchScenarios(text);
    const selections = [];
    for (const h of hits) {
      const list = h.cats[categoryId];
      if (list) selections.push(...list.map(clone));
    }
    return { selections };
  },

  async arbitrate(text, conflict) {
    return { keep: 'a' };
  },

  async singleShot(text, compact) {
    const hits = matchScenarios(text);
    const byCat = new Map();
    for (const h of hits) {
      for (const [cid, list] of Object.entries(h.cats)) {
        if (!byCat.has(cid)) byCat.set(cid, []);
        byCat.get(cid).push(...list.map(clone));
      }
    }
    return { categories: [...byCat.entries()].map(([id, selections]) => ({ id, selections })) };
  },
};
