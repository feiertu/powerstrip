'use strict';

// 确定性合并器（纯函数、无模型、可单测）：
// 1) 幂等去重：同 (插座, 注册名) 且参数一致 → 保留一份；
// 2) 冲突检测：同 (插座, 注册名) 但参数不同 → 交仲裁（禁止合并器自己拍板）；
// 3) 无注册名类插座（如 event-listener）以 ref 为键。

const KEY_PARAMS = [
  'regPath', 'registryPath', 'recipeId', 'professionName', 'woodName', 'tagPath',
  'keyPath', 'rulePath', 'dimPath', 'modifierRegPath', 'beRegistryPath', 'menuRegistryPath',
  'biomePath', 'layerPath', 'featureKeyPath', 'poiRegPath', 'trunkRegPath', 'foliageRegPath',
];

function keyFor(sel) {
  const p = sel.params || {};
  for (const k of KEY_PARAMS) {
    if (typeof p[k] === 'string' && p[k]) return p[k];
  }
  return null;
}

function stable(params) {
  const keys = Object.keys(params || {}).sort();
  const out = {};
  for (const k of keys) out[k] = params[k];
  return JSON.stringify(out);
}

// 输入：[{ id: 分类id, selections: [{ref, params}] }]
// 输出：{ categories: [{id, selections}], conflicts: [{ref, key, a, b}] }
function mergeSelections(categoryGroups) {
  const byKey = new Map();
  const merged = new Map();
  const conflicts = [];

  for (const group of categoryGroups) {
    if (!merged.has(group.id)) merged.set(group.id, []);
    for (const sel of group.selections || []) {
      const key = keyFor(sel);
      const k = `${sel.ref}|${key}`;
      const prev = byKey.get(k);
      if (prev) {
        if (stable(prev.sel.params) === stable(sel.params)) continue; // 幂等重复
        conflicts.push({ ref: sel.ref, key, a: prev.sel.params, b: sel.params });
      } else {
        const entry = { sel };
        byKey.set(k, entry);
        merged.get(group.id).push(sel);
      }
    }
  }

  const categories = [...merged.entries()].map(([id, selections]) => ({ id, selections }));
  return { categories, conflicts };
}

// 应用仲裁结果：keep='a' 保留现有，keep='b' 用冲突方的参数覆盖
function applyArbitration(categories, conflict, keep) {
  if (keep !== 'b') return;
  for (const group of categories) {
    for (const sel of group.selections) {
      if (sel.ref === conflict.ref && keyFor(sel) === conflict.key && stable(sel.params) === stable(conflict.a)) {
        sel.params = conflict.b;
        return;
      }
    }
  }
}

module.exports = { mergeSelections, applyArbitration, keyFor };
