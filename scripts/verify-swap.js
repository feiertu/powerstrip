'use strict';
// 验证工程源码交换：node scripts/verify-swap.js <manifest> <mdkDir>
// 生成到 <mdkDir>/.ps-out，再把 src/main 并入 <mdkDir>/src/main（保留 mods.toml/pack.mcmeta）
const fs = require('fs');
const path = require('path');
const { generate } = require('../generator');

const [manifestPath, mdkDir] = process.argv.slice(2);
if (!manifestPath || !mdkDir) {
  console.error('用法: node scripts/verify-swap.js <manifest> <mdkDir>');
  process.exit(1);
}
const absManifest = path.resolve(manifestPath);
const absMdk = path.resolve(mdkDir);
const tmpOut = path.join(absMdk, '.ps-out');

const r = generate({ manifestPath: absManifest, outDir: tmpOut, quiet: true });
console.log(`生成 ${r.written.length} Java + ${r.assetRelPaths.length} 资源`);

function syncDir(srcDir, dstDir) {
  fs.rmSync(dstDir, { recursive: true, force: true });
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(path.dirname(dstDir), { recursive: true });
  fs.cpSync(srcDir, dstDir, { recursive: true });
}

const src = path.join(tmpOut, 'src', 'main');
const dst = path.join(absMdk, 'src', 'main');
syncDir(path.join(src, 'java'), path.join(dst, 'java'));
syncDir(path.join(src, 'resources', 'assets'), path.join(dst, 'resources', 'assets'));
syncDir(path.join(src, 'resources', 'data'), path.join(dst, 'resources', 'data'));
fs.rmSync(tmpOut, { recursive: true, force: true });
console.log('已并入 ' + absMdk + '（保留 mods.toml/pack.mcmeta）');
