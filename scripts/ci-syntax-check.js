'use strict';
// CI 语法检查：对仓库内全部 .js 执行 node --check（跳过 reference/、verify-mdk、out-*、node_modules）。
// 跨平台：linux/macos/windows 均可直接 node 运行。

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = [/[\\/]reference[\\/]/, /[\\/]verify-mdk[\\/]/, /[\\/]out-/, /[\\/]node_modules[\\/]/];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    const rel = p.slice(ROOT.length);
    if (SKIP.some((re) => re.test(rel))) continue;
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let failed = 0;
for (const f of files) {
  // stdio:'ignore'：沙箱环境下子进程管道被禁，靠退出码判定；本地调试可手动 node --check 看详情
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'ignore' });
  } catch (e) {
    console.error(`语法错误: ${path.relative(ROOT, f)} (exit ${e.status ?? '非零'})`);
    failed += 1;
  }
}
if (failed) {
  console.error(`${failed} 个文件语法错误`);
  process.exit(1);
}
console.log(`语法检查通过: ${files.length} 个 JS 文件`);
