'use strict';

// 资源层：asset 路径所有权表（防重复/冲突）+ 1×1 占位 PNG + 资源渲染写入。
// 所有权表是"防错乱"的第一道闸：任何两个不同 owner 生成同一路径 → 直接拦截。

const fs = require('fs');
const path = require('path');

// 1×1 透明 PNG（占位贴图：方块/物品/实体/GUI 贴图先占位，用户替换真实美术）
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

class AssetRegistry {
  constructor(outDir) {
    this.outDir = outDir;
    this.owners = new Map();
    this.written = [];
  }

  // 声明路径所有权：同一路径被两个不同 owner 生成 → 抛保护门错误
  claim(relPath, owner) {
    const norm = relPath.replace(/\\/g, '/');
    const prev = this.owners.get(norm);
    if (prev && prev !== owner) {
      throw new Error(`保护门拦截：资源路径冲突 —— "${norm}" 同时被 ${prev} 与 ${owner} 生成。`);
    }
    this.owners.set(norm, owner);
  }

  writeText(relPath, content, owner) {
    if (!content || !content.trim()) return null;
    this.claim(relPath, owner);
    const full = path.join(this.outDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    this.written.push(relPath);
    return relPath;
  }

  writePng(relPath, owner) {
    this.claim(relPath, owner);
    const full = path.join(this.outDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, PNG_1PX);
    this.written.push(relPath);
    return relPath;
  }
}

module.exports = { AssetRegistry, PNG_1PX };
