#!/usr/bin/env node
/**
 * 一次性扫描（用完即删）：找出 className 模板串里
 * 「类名直接贴着 ${」的拼接 —— 这类写法会把两段拼成一个无效类名，
 * 例如 `w-10 h-10${'bg-blue-500'}` 得到 `h-10bg-blue-500`，样式完全不生效。
 *
 * 只有当插值内部所有字符串字面量都不以空格开头时才算真断裂。
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.jsx$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function findStringEnd(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === '\\') { j += 2; continue; }
    if (src[j] === q) return j;
    j++;
  }
  return -1;
}

function findBalanced(src, i) {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '"' || ch === "'") {
      const e = findStringEnd(src, j);
      if (e === -1) return -1;
      j = e + 1;
      continue;
    }
    if (ch === '`') {
      j++;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') break;
        if (src[j] === '$' && src[j + 1] === '{') {
          const e = findBalanced(src, j + 1);
          if (e === -1) return -1;
          j = e + 1;
          continue;
        }
        j++;
      }
      j++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return j;
    }
    j++;
  }
  return -1;
}

const broken = [];
const fixesByFile = new Map();

for (const file of walk(SRC)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const re = /className\s*=\s*\{?\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    const tick = src.indexOf('`', m.index);
    // 找到模板串结束
    let j = tick + 1;
    const segs = [];
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') break;
      if (src[j] === '$' && src[j + 1] === '{') {
        const e = findBalanced(src, j + 1);
        if (e === -1) break;
        const inner = src.slice(j + 2, e);
        // 插值前一个字符是不是类名字符
        const prev = src[j - 1];
        const attached = /[A-Za-z0-9\]\)]/.test(prev || '');
        if (attached) {
          // 内部所有字符串字面量都不以空格开头 → 真断裂
          const lits = [...inner.matchAll(/'([^']*)'|"([^"]*)"/g)].map((x) => x[1] ?? x[2]);
          const allNoSpace = lits.length > 0 && lits.every((s) => !s.startsWith(' '));
          if (allNoSpace) {
            const line = src.slice(0, m.index).split('\n').length;
            segs.push({ line, prev: (prev || '') + '${', inner: inner.replace(/\s+/g, ' ').slice(0, 90) });
            const list = fixesByFile.get(file) || [];
            list.push(j); // 在 j（$ 的位置）之前插空格
            fixesByFile.set(file, list);
          }
        }
        j = e + 1;
        continue;
      }
      j++;
    }
    for (const s of segs) broken.push(`${rel}:${s.line}  ${s.prev}${s.inner}}`);
    re.lastIndex = tick + 1;
  }
}

console.log(`发现 ${broken.length} 处拼接断裂：`);
broken.forEach((b) => console.log('  ' + b));

if (process.argv.includes('--apply')) {
  let touched = 0;
  for (const [file, offsets] of fixesByFile) {
    let src = fs.readFileSync(file, 'utf8');
    for (const off of [...offsets].sort((a, b) => b - a)) {
      src = src.slice(0, off) + ' ' + src.slice(off);
    }
    fs.writeFileSync(file, src, 'utf8');
    touched++;
  }
  console.log(`\n已修复 ${touched} 个文件（在 \${ 前补空格）`);
}

