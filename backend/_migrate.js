// 临时拆分脚本：按「锚点行区间」把已搬到模块的路由从 server.js 中摘掉，
// 并可按锚点插入装配代码。用锚点（而非行号）避免反复改动后行号漂移。
// 拆分完成后本文件会被删除。
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, '_migrate.spec.json'), 'utf8'));
const lines = fs.readFileSync(file, 'utf8').split('\n');

for (const r of spec.remove || []) {
  const start = lines.findIndex((l) => l.includes(r.from));
  if (start < 0) throw new Error('未找到起始锚点: ' + r.from);
  let end = -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].includes(r.to)) { end = i; break; }
  }
  if (end < 0) throw new Error('未找到结束锚点: ' + r.to);
  lines.splice(start, end - start);
}

if (spec.insertFile) {
  const idx = lines.findIndex((l) => l.includes(spec.insertAt));
  if (idx < 0) throw new Error('未找到插入锚点: ' + spec.insertAt);
  const insert = fs.readFileSync(path.join(__dirname, spec.insertFile), 'utf8').replace(/\n$/, '').split('\n');
  lines.splice(idx, 0, ...insert);
}

fs.writeFileSync(file, lines.join('\n'));
console.log('migrate ok');