'use strict';

// 依赖图：把「插上一个排插，自动带出它需要的一串排插」变成代码。
// 1) expandGraph —— 从显式选择的插座出发，按 requires 闭包 + 目录里的 deriveFrom
//    规则自动派生出缺省的插座实例；
// 2) orderByRequires —— 对插座类型做拓扑排序（requires 在前）。
//
// deriveFrom 规则语义：
//   - { root: 'X', map: {...} }          —— 按实例派生：每个 X 实例 × 每条规则各生成一份派生实例
//                                          （即使目标类型已有其他实例，也会为新的根实例补派生）；
//   - { refSocket: 'Y', map: {...} }     —— 参数来源：其 map 合并进每一个派生实例（不单独成实例）；
//   - map 值三种写法：'参数名'（从源实例拷参数）、{ literal: 值 }（固定字面量）、
//     { expr: '模板' }（用源实例参数渲染模板字符串，如 'new {{className}}(...)'）。

const { render } = require('./render');

function mapParams(map, srcParams, instances) {
  const out = {};
  for (const [toKey, from] of Object.entries(map)) {
    if (from === null || typeof from !== 'object') {
      out[toKey] = srcParams[from];
    } else if (from.socket) {
      const target = instances.find((i) => i.ref === from.socket);
      if (target) out[toKey] = target.params[from.param];
    } else if (from.literal !== undefined) {
      out[toKey] = from.literal;
    } else if (from.expr !== undefined) {
      out[toKey] = render(from.expr, srcParams);
    }
  }
  return out;
}

function expandGraph(manifest, catalog) {
  const instances = [];

  for (const cat of manifest.categories || []) {
    const catDef = catalog.categories.find((c) => c.id === cat.id);
    if (!catDef) throw new Error(`清单错误：未知分类 "${cat.id}"（可选：${catalog.categories.map((c) => c.id).join(', ')}）`);
    for (const sel of cat.selections || []) {
      const socketDef = catalog.sockets[sel.ref];
      if (!socketDef) throw new Error(`清单错误：分类 ${cat.id} 引用了未知插座 "${sel.ref}"`);
      if (!catDef.sockets.includes(sel.ref)) {
        throw new Error(`清单错误：插座 "${sel.ref}" 不属于分类 ${cat.id}（属于：${socketDef.category}）`);
      }
      instances.push({ ref: sel.ref, params: sel.params || {}, derived: false });
    }
  }

  if (instances.length === 0) {
    throw new Error('清单错误：所有分类都选了「终止」，没有可拼装的插座。');
  }

  // requires 闭包 + 按 (规则 × 根实例) 派生，直到不动点
  const derivedKeys = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    const required = new Set();
    for (const inst of instances) {
      for (const r of catalog.sockets[inst.ref].requires) required.add(r);
    }
    for (const r of required) {
      const def = catalog.sockets[r];
      if (!def.deriveFrom || def.deriveFrom.length === 0) {
        if (!instances.some((i) => i.ref === r)) {
          throw new Error(`依赖错误：插座 "${r}"（${def.name}）缺少实例且没有派生规则，请显式选择它。`);
        }
        continue;
      }
      const rootRules = def.deriveFrom.filter((x) => x.root);
      const refRules = def.deriveFrom.filter((x) => x.refSocket);
      let matchedAny = false;
      rootRules.forEach((rule, ruleIdx) => {
        instances.forEach((rootInst, instIdx) => {
          if (rootInst.ref !== rule.root) return;
          matchedAny = true;
          const key = `${r}|${ruleIdx}|${instIdx}`;
          if (derivedKeys.has(key)) return;
          const params = mapParams(rule.map, rootInst.params, instances);
          for (const refRule of refRules) {
            const refInst = instances.find((i) => i.ref === refRule.refSocket);
            if (refInst) Object.assign(params, mapParams(refRule.map, refInst.params, instances));
          }
          derivedKeys.add(key);
          const src = [rule.root];
          if (refRules.length) src.push(...refRules.map((x) => x.refSocket));
          instances.push({ ref: r, params, derived: true, derivedFrom: src.join('+') });
          changed = true;
        });
      });
      if (!matchedAny && !instances.some((i) => i.ref === r)) {
        const roots = def.deriveFrom.map((x) => x.root || x.refSocket).join('、');
        throw new Error(`依赖错误：插座 "${r}" 无法派生，需要先选择以下之一：${roots}`);
      }
    }
  }

  return instances;
}

function orderByRequires(instances, catalog) {
  const types = [...new Set(instances.map((i) => i.ref))];
  const adj = {};
  const indeg = {};
  for (const t of types) { adj[t] = []; indeg[t] = 0; }
  for (const t of types) {
    for (const r of catalog.sockets[t].requires) {
      if (types.includes(r)) {
        adj[r].push(t);
        indeg[t] += 1;
      }
    }
  }
  const queue = types.filter((t) => indeg[t] === 0);
  const order = [];
  while (queue.length) {
    const t = queue.shift();
    order.push(t);
    for (const n of adj[t]) {
      indeg[n] -= 1;
      if (indeg[n] === 0) queue.push(n);
    }
  }
  if (order.length !== types.length) {
    const cyclic = types.filter((t) => indeg[t] > 0);
    throw new Error(`依赖错误：插座依赖存在环，涉及：${cyclic.join('、')}`);
  }
  const result = [];
  for (const t of order) result.push(...instances.filter((i) => i.ref === t));
  return result;
}

module.exports = { expandGraph, orderByRequires };
