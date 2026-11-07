'use strict';

// 极简模板引擎（零依赖）。
// 语法：{{path}}、{{#if path}}、{{#unless path}}、{{#each path}}、{{else}}、
//       {{/if}} {{/unless}} {{/each}}、{{! 注释}}
// 值解析支持点路径（如 {{meta.group}}），从内层帧向外层查找；
// {{#each}} 内可用 {{this}}、{{this.x}}、{{@index}}、{{@first}}、{{@last}}。

function tokenize(tpl) {
  const tokens = [];
  const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(tpl)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', text: tpl.slice(last, m.index) });
    const inner = m[1];
    if (inner.startsWith('!')) {
      // 注释，丢弃
    } else if (inner.startsWith('#if')) {
      tokens.push({ type: 'open', kind: 'if', path: inner.slice(3).trim() });
    } else if (inner.startsWith('#unless')) {
      tokens.push({ type: 'open', kind: 'unless', path: inner.slice(7).trim() });
    } else if (inner.startsWith('#each')) {
      tokens.push({ type: 'open', kind: 'each', path: inner.slice(5).trim() });
    } else if (inner.startsWith('/')) {
      tokens.push({ type: 'close', kind: inner.slice(1).trim() });
    } else if (inner === 'else') {
      tokens.push({ type: 'else' });
    } else {
      tokens.push({ type: 'expr', path: inner });
    }
    last = re.lastIndex;
  }
  if (last < tpl.length) tokens.push({ type: 'text', text: tpl.slice(last) });
  return tokens;
}

function buildTree(tokens) {
  const root = [];
  const stack = [{ kind: null, children: root, node: null }];
  for (const tok of tokens) {
    if (tok.type === 'text' || tok.type === 'expr') {
      stack[stack.length - 1].children.push(tok);
    } else if (tok.type === 'open') {
      const node = { type: 'block', kind: tok.kind, path: tok.path, then: [], else: null };
      stack[stack.length - 1].children.push(node);
      stack.push({ kind: tok.kind, children: node.then, node });
    } else if (tok.type === 'else') {
      const top = stack[stack.length - 1];
      if (!top || top.kind === null) throw new Error('模板错误：孤立 {{else}}');
      top.node.else = [];
      top.children = top.node.else;
    } else if (tok.type === 'close') {
      const top = stack.pop();
      if (!top || top.kind === null) throw new Error(`模板错误：多余的 {{/${tok.kind}}}`);
      if (top.kind !== tok.kind) throw new Error(`模板错误：{{/${tok.kind}}} 与 {{#${top.kind}}} 不匹配`);
    }
  }
  if (stack.length !== 1) throw new Error(`模板错误：{{#${stack[stack.length - 1].kind}}} 未闭合`);
  return root;
}

function isTruthy(v) {
  if (Array.isArray(v)) return v.length > 0;
  return !(v === undefined || v === null || v === false || v === 0 || v === '');
}

function resolve(path, frames) {
  const parts = path.split('.');
  for (let k = frames.length - 1; k >= 0; k--) {
    let v = frames[k];
    let ok = true;
    for (const p of parts) {
      if (v === null || typeof v !== 'object' || !(p in v)) { ok = false; break; }
      v = v[p];
    }
    if (ok) return v;
  }
  return undefined;
}

function renderNodes(nodes, frames) {
  let s = '';
  for (const n of nodes) {
    if (n.type === 'text') {
      s += n.text;
    } else if (n.type === 'expr') {
      const v = resolve(n.path, frames);
      s += (v === undefined || v === null || v === false) ? '' : String(v);
    } else if (n.type === 'block') {
      if (n.kind === 'each') {
        const v = resolve(n.path, frames);
        if (Array.isArray(v) && v.length > 0) {
          v.forEach((item, idx) => {
            const frame = { this: item };
            if (item !== null && typeof item === 'object') Object.assign(frame, item);
            frame['@index'] = idx;
            frame['@first'] = idx === 0;
            frame['@last'] = idx === v.length - 1;
            frames.push(frame);
            s += renderNodes(n.then, frames);
            frames.pop();
          });
        } else if (n.else) {
          s += renderNodes(n.else, frames);
        }
      } else {
        const truthy = isTruthy(resolve(n.path, frames));
        const show = n.kind === 'if' ? truthy : !truthy;
        if (show) s += renderNodes(n.then, frames);
        else if (n.else) s += renderNodes(n.else, frames);
      }
    }
  }
  return s;
}

function render(tpl, ctx) {
  const tree = buildTree(tokenize(tpl));
  return renderNodes(tree, [ctx]);
}

module.exports = { render };
