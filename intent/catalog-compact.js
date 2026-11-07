'use strict';

// 把 catalog.json 压缩成给模型看的选项表（路由 / 单分类填充 / 单次全量三种粒度）

function paramSummary(schema) {
  const parts = [schema.type];
  if (schema.choices) parts.push('选项=' + schema.choices.join('|'));
  if (schema.pattern) parts.push('格式=' + schema.pattern);
  if (schema.min !== undefined || schema.max !== undefined) parts.push(`范围=${schema.min ?? ''}~${schema.max ?? ''}`);
  if (schema.required) parts.push('必填');
  if (schema.default !== undefined) parts.push('默认=' + JSON.stringify(schema.default));
  return parts.join('，');
}

function socketSummary(catalog, id) {
  const s = catalog.sockets[id];
  const params = Object.entries(s.params || {})
    .map(([k, v]) => `  - ${k}（${paramSummary(v)}）`)
    .join('\n');
  const deps = (s.requires || []).map((r) => `#${catalog.sockets[r].num} ${catalog.sockets[r].name}`).join('、') || '无';
  const versions = (s.versions || ['1.20.1']).join('/');
  return `[${s.num}] ${id}（${s.name}，${versions}，依赖：${deps}）\n${params}`;
}

function buildCompact(catalog) {
  const route = {
    categories: catalog.categories.map((c) => ({
      id: c.id,
      num: c.num,
      name: c.name,
      sockets: c.sockets.map((id) => `[${catalog.sockets[id].num}] ${catalog.sockets[id].name}`),
    })),
  };
  const byCategory = {};
  for (const c of catalog.categories) {
    byCategory[c.id] = {
      id: c.id,
      num: c.num,
      name: c.name,
      sockets: c.sockets.map((id) => socketSummary(catalog, id)),
    };
  }
  const all = catalog.categories
    .map((c) => `${c.num}. ${c.name}（id=${c.id}）\n` + c.sockets.map((id) => socketSummary(catalog, id)).join('\n\n'))
    .join('\n\n');
  return { route, byCategory, all };
}

module.exports = { buildCompact };
