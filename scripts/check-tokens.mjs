#!/usr/bin/env node
/**
 * 防回潮护栏：禁止 src/ 里再出现调色板类名与 dark: 颜色变体。
 *
 * 阶段 3 把全站约 1500 处硬编码颜色换成语义 token 之后，必须有东西挡住下一次
 * 「顺手写个 bg-gray-100」—— 否则过两周又会长回原样，而且这次是长在 token
 * 之上，更难拆。用独立脚本而不是 ESLint no-restricted-syntax，是因为
 * className={`...`} 里的类名在 AST 上是 TemplateElement，选择器写起来很脆。
 *
 * 检查范围只到 className 属性值内部，所以 alert 文案、注释、CustomCSS 里的
 * CSS 示例文本都不会被误报。
 *
 * 用法：npm run check:tokens
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');

/** 主题定义自身必须能写调色板值，豁免。 */
const EXEMPT = new Set(['src/theme/palettes.js', 'src/theme/apply.js', 'src/theme/tokens.css']);

const PALETTE_UTILS = 'bg|text|border|divide|ring|from|via|to|fill|stroke|decoration|placeholder|outline|caret|shadow|accent';
const PALETTE_NAMES =
  'gray|slate|zinc|neutral|stone|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red|rose|pink|purple|violet|indigo|fuchsia|primary';

const PALETTE_RE = new RegExp(
  `(?:^|\\s)((?:[a-z-]+:)*(?:${PALETTE_UTILS})-(?:${PALETTE_NAMES})-\\d{2,3})`
);
const DARK_RE = new RegExp(
  `(?:^|\\s)((?:[a-z-]+:)*dark:(?:[a-z-]+:)*(?:${PALETTE_UTILS})-(?:${PALETTE_NAMES}|white|black)(?:-\\d{2,3})?(?:/\\d{1,3})?)`
);

/* ---------- 只抽取 className 属性值 ---------- */

function findStringEnd(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === '\\') {
      j += 2;
      continue;
    }
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
      const e = findTemplateEnd(src, j);
      if (e === -1) return -1;
      j = e + 1;
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

function findTemplateEnd(src, i) {
  let j = i + 1;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === '`') return j;
    if (ch === '$' && src[j + 1] === '{') {
      const e = findBalanced(src, j + 1);
      if (e === -1) return -1;
      j = e + 1;
      continue;
    }
    j++;
  }
  return -1;
}

function scanLiterals(src, start, end, out = []) {
  let i = start;
  while (i < end) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const e = findStringEnd(src, i);
      if (e === -1 || e > end) break;
      out.push(src.slice(i + 1, e));
      i = e + 1;
      continue;
    }
    if (ch === '`') {
      let j = i + 1;
      let segStart = j;
      while (j < end) {
        const c = src[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '`') break;
        if (c === '$' && src[j + 1] === '{') {
          if (j > segStart) out.push(src.slice(segStart, j));
          const e = findBalanced(src, j + 1);
          if (e === -1) return out;
          scanLiterals(src, j + 2, e, out);
          j = e + 1;
          segStart = j;
          continue;
        }
        j++;
      }
      if (j > segStart) out.push(src.slice(segStart, j));
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

function extractClassNames(src) {
  const out = [];
  const re = /className\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src[m.index - 1];
    if (before && /[A-Za-z0-9_$.\-]/.test(before)) continue;
    const i = re.lastIndex;
    if (src[i] === '"' || src[i] === "'") {
      const end = findStringEnd(src, i);
      if (end === -1) continue;
      out.push({ text: src.slice(i + 1, end), line: src.slice(0, m.index).split('\n').length });
      re.lastIndex = end + 1;
    } else if (src[i] === '{') {
      const end = findBalanced(src, i);
      if (end === -1) continue;
      const lits = [];
      scanLiterals(src, i + 1, end, lits);
      for (const l of lits) {
        out.push({ text: l, line: src.slice(0, m.index).split('\n').length });
      }
      re.lastIndex = end + 1;
    }
  }
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(jsx|tsx|js|ts)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

const problems = [];
for (const file of walk(SRC)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (EXEMPT.has(rel)) continue;
  for (const { text, line } of extractClassNames(fs.readFileSync(file, 'utf8'))) {
    for (const m of text.matchAll(new RegExp(PALETTE_RE.source, 'g'))) {
      problems.push(`${rel}:${line}  调色板类名「${m[1]}」`);
    }
    for (const m of text.matchAll(new RegExp(DARK_RE.source, 'g'))) {
      problems.push(`${rel}:${line}  dark: 颜色变体「${m[1]}」`);
    }
  }
}

if (problems.length) {
  console.error('发现硬编码颜色类名（请改用语义 token，见 src/styles/tokens.css）：\n');
  for (const p of problems) console.error('  ' + p);
  console.error(`\n共 ${problems.length} 处。`);
  process.exit(1);
}

console.log('OK：src 内没有硬编码的调色板类名与 dark: 颜色变体。');
