'use strict';

// 生成后静态核查（防错乱的第二、三道闸）：
// 1) 客户端/服务端一致性 —— clientClasses 声明的客户端类，只允许出现在
//    客户端目录文件、自身定义文件、主类 ClientModEvents 区块、ModEventBusClientEvents 中；
// 2) NBT 键对称 —— 方块实体 save/load 的 put*/get* 键集合必须一致（防持久化错位漂移）。

const fs = require('fs');
const path = require('path');

const CLIENT_DIRS = ['/entity/client/', '/block/entity/renderer/', '/compat/'];

// 主类中 ClientModEvents 内部类的行区间（大括号配对）
function clientRegionOf(mainClassText) {
  const lines = mainClassText.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('class ClientModEvents')) { start = i; break; }
  }
  if (start < 0) return null;
  let depth = 0;
  let opened = false;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth += 1; opened = true; }
      else if (ch === '}') { depth -= 1; }
    }
    if (opened && depth <= 0) return { start, end: i };
  }
  return { start, end: lines.length - 1 };
}

function checkSideConsistency(outDir, javaRelPaths, clientClasses, mainClassName) {
  const violations = [];
  if (!clientClasses.length) return violations;

  const mainRel = javaRelPaths.find((p) => p.replace(/\\/g, '/').endsWith(`${mainClassName}.java`));
  let clientRegion = null;
  if (mainRel) {
    const text = fs.readFileSync(path.join(outDir, mainRel), 'utf8');
    clientRegion = clientRegionOf(text);
  }

  for (const cls of clientClasses) {
    const re = new RegExp(`\\b${cls}\\b`);
    for (const rel of javaRelPaths) {
      const norm = '/' + rel.replace(/\\/g, '/');
      const isDef = path.basename(rel) === `${cls}.java`;
      const isClientFile = CLIENT_DIRS.some((d) => norm.includes(d)) || path.basename(rel) === 'ModEventBusClientEvents.java';
      if (isDef || isClientFile) continue;
      const lines = fs.readFileSync(path.join(outDir, rel), 'utf8').split('\n');
      lines.forEach((line, idx) => {
        if (/^\s*import\s/.test(line)) return; // import 不触发类加载，引用位置才关键
        if (!re.test(line)) return;
        const inClientRegion = clientRegion && rel === mainRel && idx >= clientRegion.start && idx <= clientRegion.end;
        if (!inClientRegion) {
          violations.push(`${rel}:${idx + 1} 在非客户端区域引用了客户端类 ${cls}`);
        }
      });
    }
  }
  return violations;
}

function checkNbtKeys(outDir, javaRelPaths) {
  const violations = [];
  const putRe = /\.put[A-Za-z]*\(\s*"([^"]+)"/g;
  const getRe = /\.get[A-Za-z]*\(\s*"([^"]+)"/g;
  for (const rel of javaRelPaths) {
    const norm = rel.replace(/\\/g, '/');
    if (!/(^|\/)block\/entity\/custom\//.test(norm)) continue;
    const text = fs.readFileSync(path.join(outDir, rel), 'utf8');
    const puts = new Set([...text.matchAll(putRe)].map((m) => m[1]));
    const gets = new Set([...text.matchAll(getRe)].map((m) => m[1]));
    const onlyPut = [...puts].filter((k) => !gets.has(k));
    const onlyGet = [...gets].filter((k) => !puts.has(k));
    if (onlyPut.length || onlyGet.length) {
      violations.push(`${rel} NBT 键不对称：只写 [${onlyPut.join(', ') || '无'}]，只读 [${onlyGet.join(', ') || '无'}]`);
    }
  }
  return violations;
}

module.exports = { checkSideConsistency, checkNbtKeys, clientRegionOf };
