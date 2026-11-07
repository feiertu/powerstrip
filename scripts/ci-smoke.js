'use strict';
// CI 冒烟：8 份示例答卷全部确定性生成 + 保护门负例（1.26.1 必须被拦截）。
// 输出目录用系统临时目录，不污染工作区。

const fs = require('fs');
const os = require('os');
const path = require('path');
const { generate } = require('../generator');

const ROOT = path.join(__dirname, '..');
const EXAMPLES = [
  'gem-polishing-station',
  'registration-kitchen',
  'misc-blocks',
  'entity-rhino',
  'items-projectile',
  'worldgen-full',
  'loot-misc',
  'machine-capabilities',
];
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'powerstrip-ci-'));

let failed = 0;
for (const name of EXAMPLES) {
  const outDir = path.join(tmpRoot, name);
  try {
    const r = generate({ manifestPath: path.join(ROOT, 'examples', name + '.manifest.json'), outDir, quiet: true });
    console.log(`OK  ${name}: ${r.written.length} Java + ${r.assetRelPaths.length} 资源`);
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
    failed += 1;
  }
}

let blocked = false;
try {
  generate({ manifestPath: path.join(ROOT, 'examples', 'guard-demo-1.26.manifest.json'), outDir: path.join(tmpRoot, 'guard'), quiet: true });
} catch (e) {
  blocked = /保护门拦截/.test(String(e && e.message || e));
}
if (!blocked) {
  console.error('FAIL 保护门负例：1.26.1 未被拦截');
  failed += 1;
} else {
  console.log('OK  保护门负例：1.26.1 被拦截');
}

fs.rmSync(tmpRoot, { recursive: true, force: true });
if (failed) {
  console.error(`${failed} 项冒烟失败`);
  process.exit(1);
}
console.log('冒烟全部通过');
