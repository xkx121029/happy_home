#!/usr/bin/env node
/**
 * 一次性验证脚本（用完即删）。
 *
 * V3 类名存在性：抽出 src 里所有 className token，逐个断言在 dist 的 CSS 里
 *    真有对应规则 —— 抓错拼（bg-surface2）、抓动态拼接导致的静默失效。
 * V4 回潮检查：断言 src 里不再有调色板类名与 dark: 颜色变体。
 * V5 丢色检查：对比 HEAD 与工作区，断言原来有背景色/文字色的元素没把颜色丢掉。
 *
 * 用法：node scripts/verify-tokens.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist', 'assets');

/* ---------- 提取器（与 codemod 同一套思路） ---------- */

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

function extractLiterals(src) {
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
      out.push(src.slice(i + 1, end));
      re.lastIndex = end + 1;
    } else if (src[i] === '{') {
      const end = findBalanced(src, i);
      if (end === -1) continue;
      scanLiterals(src, i + 1, end, out);
      re.lastIndex = end + 1;
    }
  }
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(jsx|tsx)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

/* ---------- V3：dist CSS 里的类名索引 ---------- */

const cssText = fs
  .readdirSync(DIST)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(DIST, f), 'utf8'))
  .join('\n');

const cssClasses = new Set();
{
  const re = /\.((?:\\.|[\w-])+)/g;
  let m;
  while ((m = re.exec(cssText))) {
    cssClasses.add(m[1].replace(/\\(.)/g, '$1'));
  }
}

// Tailwind 不会为这些生成规则：状态标记与纯 JS 变量
const ALLOW = new Set(['group', 'peer', 'dark', 'light', 'sr-only']);
const ALLOW_PREFIX = [/^(?:container|group\/|peer\/)/];

const files = walk(SRC).filter((f) => !['palettes.js', 'apply.js'].includes(path.basename(f)));

const missing = new Map();
const paletteLeft = new Map();
const darkColorLeft = new Map();

const PALETTE =
  /(?:^|\s)((?:[a-z-]+:)*(?:bg|text|border|divide|ring|from|via|to|fill|stroke|decoration|placeholder|outline|caret|shadow|accent)-(?:gray|slate|zinc|neutral|stone|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red|rose|pink|purple|violet|indigo|fuchsia|primary)-\d{2,3})/g;
const DARK_COLOR =
  /(?:^|\s)((?:[a-z-]+:)*dark:(?:[a-z-]+:)*(?:bg|text|border|divide|ring|from|via|to|fill|stroke|placeholder)-(?:gray|slate|zinc|neutral|stone|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red|rose|pink|purple|violet|indigo|fuchsia|primary|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?)/g;

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  for (const lit of extractLiterals(src)) {
    for (const raw of lit.split(/\s+/)) {
      const token = raw.trim();
      if (!token || token.includes('${')) continue;
      if (ALLOW.has(token) || ALLOW_PREFIX.some((p) => p.test(token))) continue;
      if (!cssClasses.has(token)) {
        if (!missing.has(rel)) missing.set(rel, new Set());
        missing.get(rel).add(token);
      }
    }
    for (const m of lit.matchAll(PALETTE)) {
      if (!paletteLeft.has(rel)) paletteLeft.set(rel, new Set());
      paletteLeft.get(rel).add(m[1]);
    }
    for (const m of lit.matchAll(DARK_COLOR)) {
      if (!darkColorLeft.has(rel)) darkColorLeft.set(rel, new Set());
      darkColorLeft.get(rel).add(m[1]);
    }
  }
}

console.log('=== V3 类名存在性 ===');
if (!missing.size) console.log('OK：className 里每个 token 在 dist CSS 中都有规则');
else {
  for (const [f, set] of missing) console.log(`  ${f}: ${[...set].join(' ')}`);
}

console.log('\n=== V4 回潮检查 ===');
console.log(
  paletteLeft.size
    ? `仍有调色板类名：\n${[...paletteLeft].map(([f, s]) => `  ${f}: ${[...s].join(' ')}`).join('\n')}`
    : 'OK：src 里已无调色板类名'
);
console.log(
  darkColorLeft.size
    ? `仍有 dark: 颜色变体：\n${[...darkColorLeft].map(([f, s]) => `  ${f}: ${[...s].join(' ')}`).join('\n')}`
    : 'OK：src 里已无 dark: 颜色变体'
);

/* ---------- V5：HEAD 与工作区的颜色签名差分 ---------- */

const COLOR_UTILS = ['bg', 'text', 'border', 'divide', 'ring', 'from', 'via', 'to'];
function signature(lit) {
  const slots = new Map();
  for (const raw of lit.split(/\s+/)) {
    const token = raw.trim();
    if (!token || token.includes('${')) continue;
    const m = token.match(/^((?:[a-z-]+:)*)(bg|text|border|divide|ring|from|via|to)-(?![0-9])(.+)$/);
    if (!m) continue;
    const [, variant, util] = m;
    const slot = variant + util;
    if (!slots.has(slot)) slots.set(slot, []);
    slots.get(slot).push(token);
  }
  return slots;
}

const lost = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let oldSrc;
  try {
    oldSrc = execSync(`git show HEAD:${rel}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch {
    continue; // 新文件
  }
  const oldLits = extractLiterals(oldSrc);
  const newLits = extractLiterals(fs.readFileSync(file, 'utf8'));
  if (oldLits.length !== newLits.length) {
    lost.push(`${rel}: 字面量数量变了（${oldLits.length} → ${newLits.length}），需人工确认`);
    continue;
  }
  for (let i = 0; i < oldLits.length; i++) {
    const a = signature(oldLits[i]);
    const b = signature(newLits[i]);
    for (const [slot, tokens] of a) {
      if (!b.has(slot) && COLOR_UTILS.includes(slot)) {
        lost.push(`${rel} #${i} ${slot}: 旧「${tokens.join(' ')}」→ 新无该槽位`);
      }
    }
    for (const [slot] of a) {
      if (!b.has(slot)) continue;
      const av = a.get(slot).join(' ');
      const bv = b.get(slot).join(' ');
      if (av === bv) continue;
      // 同槽位 base 与 hover 解析成同值 → hover 失效
      const base = (arr) => arr.filter((t) => !/(?:^|:)hover:|group-hover:|active:/.test(t));
      const hov = (arr) => arr.filter((t) => /(?:^|:)hover:|group-hover:|active:/.test(t));
      if (base(b.get(slot)).length && hov(b.get(slot)).length) {
        const bs = new Set(base(b.get(slot)).map((t) => t.replace(/^(?:[a-z-]+:)*/, '')));
        const hs = new Set(hov(b.get(slot)).map((t) => t.replace(/^(?:[a-z-]+:)*/, '')));
        for (const h of hs) {
          for (const x of bs) {
            if (h === x) lost.push(`${rel} #${i} ${slot}: hover 与 base 解析成同值「${h}」，hover 会失效`);
          }
        }
      }
    }
  }
}

console.log('\n=== V5 颜色签名差分 ===');
if (!lost.length) console.log('OK：没有元素丢掉背景色/文字色，也没有 hover 撞值');
else lost.slice(0, 80).forEach((l) => console.log('  ' + l));
if (lost.length > 80) console.log(`  ...还有 ${lost.length - 80} 条`);
