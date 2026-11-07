'use strict';

// 保护门：组装前的一切检查都发生在这里。
// 1) 版本约束 —— 仅 1.20.x Forge，且插座级 versions 白名单（其余版本本体可下载，但本排插不适用）；
// 2) 参数校验 —— 开关必须拨到合法档位（类型/正则/选项/范围）；
// 3) 电源线对齐 —— 跨插座引用必须指向真实存在的实例（references，支持 anyOf 与可选项）；
// 4) 命名冲突 —— 类名、注册名在各自空间内不得重复（collisionGroup）。

const PRESET_PROPS = {
  'iron-like': 'BlockBehaviour.Properties.copy(Blocks.IRON_BLOCK)',
  'stone-like': 'BlockBehaviour.Properties.copy(Blocks.STONE)',
  'machine': 'BlockBehaviour.Properties.copy(Blocks.IRON_BLOCK).noOcclusion()',
  'wood-log': 'BlockBehaviour.Properties.copy(Blocks.OAK_LOG).strength(2f)',
  'crop': 'BlockBehaviour.Properties.copy(Blocks.WHEAT).noOcclusion().noCollission()',
  'portal': 'BlockBehaviour.Properties.copy(Blocks.NETHER_PORTAL).noLootTable().noOcclusion().noCollission()',
  'sound-block': 'BlockBehaviour.Properties.copy(Blocks.IRON_BLOCK)',
};

const ITEM_ID_RE = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
const CLASS_RE = /^[A-Z][A-Za-z0-9_]*$/;
const FIELD_RE = /^[A-Z][A-Z0-9_]*$/;
const PATH_RE = /^[a-z0-9_]+$/;

function validateAndBuildContext(manifest, instances, catalog) {
  const meta = manifest.meta || {};
  const warnings = [];

  // —— 保护门 1：版本与加载器 ——
  const versionOk = /^1\.20\.1$/.test(meta.mcVersion || '');
  if (!versionOk) {
    throw new Error(
      `保护门拦截：mcVersion "${meta.mcVersion || '(未填写)'}" 不受支持。` +
      `不同版本的《我的世界》本体均可下载，但当前排插仅适用于 1.20.1 Forge。`
    );
  }
  const loader = String(meta.loader || '').toLowerCase();
  if (loader !== 'forge') {
    throw new Error(`保护门拦截：loader "${meta.loader || '(未填写)'}" 不受支持，仅支持 forge（1.20.1）。`);
  }

  // 版本特性开关：1.20.2 起 API 有四处变化
  const parts = String(meta.mcVersion).split('.');
  const minor = parseInt(parts[2] || '0', 10);
  const features = {
    blockCodec: minor >= 2,           // Block.codec() / simpleCodec
    recipeRegistryAccess: minor >= 2, // Recipe.getResultItem(RegistryAccess) / assemble(Container, RegistryAccess)
    screenBgWithMouse: minor >= 2,    // renderBackground(GuiGraphics, int, int, float)
  };

  // —— 保护门 2：参数校验 + 默认值 ——
  for (const inst of instances) {
    const def = catalog.sockets[inst.ref];

    // 插座级版本白名单（默认仅 1.20.1）
    const supported = def.versions || ['1.20.1'];
    if (!supported.includes(meta.mcVersion)) {
      throw new Error(`保护门拦截：插座 "${inst.ref}"（${def.name}）仅支持 ${supported.join(' / ')}，当前 mcVersion 为 ${meta.mcVersion}。`);
    }

    const params = {};
    for (const [key, schema] of Object.entries(def.params || {})) {
      let v = inst.params[key];
      if (v === undefined) {
        if (schema.default !== undefined) v = schema.default;
        else if (schema.required) throw new Error(`保护门拦截：插座 "${inst.ref}" 缺少必填参数 "${key}"。`);
        else continue;
      }
      switch (schema.type) {
        case 'choice':
          if (!schema.choices.includes(v)) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不在选项 [${schema.choices.join('、')}] 内。`);
          }
          break;
        case 'boolean':
          if (typeof v !== 'boolean') throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是布尔值。`);
          break;
        case 'int':
          if (!Number.isInteger(v)) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不是整数。`);
          if (schema.min !== undefined && v < schema.min) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"=${v} 小于下限 ${schema.min}。`);
          if (schema.max !== undefined && v > schema.max) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"=${v} 大于上限 ${schema.max}。`);
          break;
        case 'float':
          if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不是数值。`);
          break;
        case 'string':
          if (typeof v !== 'string') throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是字符串。`);
          if (schema.pattern && !new RegExp(schema.pattern).test(v)) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不符合规则 ${schema.pattern}。`);
          }
          break;
        case 'expr':
          if (typeof v !== 'string' || !v.trim().startsWith('new ')) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不是合法的构造表达式（须以 new 开头）。`);
          }
          break;
        case 'itemId':
          if (!ITEM_ID_RE.test(v)) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}"="${v}" 不是合法的物品 ID（形如 minecraft:diamond）。`);
          }
          break;
        case 'refList':
          if (!Array.isArray(v)) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是数组。`);
          for (const e of v) {
            if (!e || typeof e !== 'object' || !['item', 'block'].includes(e.kind) || typeof e.field !== 'string' || !FIELD_RE.test(e.field)) {
              throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 中存在非法条目（需 {kind:'item'|'block', field:'大写字段名'}）。`);
            }
          }
          break;
        case 'fieldList':
          if (!Array.isArray(v) || !v.every((x) => typeof x === 'string' && FIELD_RE.test(x))) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是合法的大写字段名数组。`);
          }
          break;
        case 'idList':
          if (!Array.isArray(v) || !v.every((x) => typeof x === 'string' && ITEM_ID_RE.test(x))) {
            throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是合法的资源 ID 数组。`);
          }
          break;
        case 'configList':
          if (!Array.isArray(v)) throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 不是数组。`);
          for (const e of v) {
            if (!e || typeof e !== 'object' || typeof e.key !== 'string' || !/^[a-z][a-z0-9_]*$/.test(e.key)) {
              throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 存在非法条目（需 key 为小写标识符）。`);
            }
            if (!['int', 'double', 'boolean'].includes(e.type)) {
              throw new Error(`保护门拦截：插座 "${inst.ref}" 的参数 "${key}" 的 "${e.key}" type 必须是 int/double/boolean。`);
            }
            if (e.type === 'boolean') {
              if (typeof e.default !== 'boolean') throw new Error(`保护门拦截：配置项 "${e.key}" 是 boolean，default 必须是布尔值。`);
            } else {
              if (typeof e.default !== 'number' || !Number.isFinite(e.default)) throw new Error(`保护门拦截：配置项 "${e.key}" 是 ${e.type}，default 必须是数值。`);
              if (e.min !== undefined && e.default < e.min) throw new Error(`保护门拦截：配置项 "${e.key}" default=${e.default} 小于 min=${e.min}。`);
              if (e.max !== undefined && e.default > e.max) throw new Error(`保护门拦截：配置项 "${e.key}" default=${e.default} 大于 max=${e.max}。`);
            }
          }
          break;
        default:
          throw new Error(`目录错误：插座 "${inst.ref}" 参数 "${key}" 的类型 "${schema.type}" 未实现。`);
      }
      params[key] = v;
    }
    inst.params = params;
  }

  // —— 保护门 3：电源线对齐（跨插座引用必须命中；可选参数缺省时跳过） ——
  for (const inst of instances) {
    const def = catalog.sockets[inst.ref];
    for (const ref of def.references || []) {
      if (inst.params[ref.param] === undefined) continue; // 可选引用
      const groups = ref.anyOf || [{ toSocket: ref.toSocket, toParam: ref.toParam }];
      const ok = groups.some((g) =>
        instances.some((i) => i.ref === g.toSocket && i.params[g.toParam] === inst.params[ref.param])
      );
      if (!ok) {
        const desc = groups.map((g) => `${g.toSocket}.${g.toParam}`).join(' 或 ');
        throw new Error(
          `保护门拦截：电源线对不上 —— "${inst.ref}" 的 "${ref.param}"="${inst.params[ref.param]}" ` +
          `找不到 ${desc} 匹配的实例。`
        );
      }
    }
  }

  // —— 保护门 4：命名冲突 ——
  const seen = {};
  for (const inst of instances) {
    const def = catalog.sockets[inst.ref];
    for (const [key, schema] of Object.entries(def.params || {})) {
      if (!schema.collisionGroup) continue;
      const val = inst.params[key];
      if (val === undefined) continue;
      const k = `${schema.collisionGroup}|${val}`;
      if (seen[k]) {
        throw new Error(`保护门拦截：${schema.collisionGroup} 中出现重复 "${val}"（${seen[k]} 与 ${inst.ref} 冲突）。`);
      }
      seen[k] = inst.ref;
    }
  }

  // 预置属性 → 实际表达式
  for (const inst of instances) {
    if (inst.ref === 'block-registry') {
      inst.params.propertiesExpr = PRESET_PROPS[inst.params.propertiesPreset];
    }
  }

  return { meta, features, warnings };
}

module.exports = { validateAndBuildContext, PRESET_PROPS };
