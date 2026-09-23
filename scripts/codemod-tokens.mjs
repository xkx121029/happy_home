#!/usr/bin/env node
/**
 * 一次性 codemod：把硬编码的调色板类名（bg-gray-100 / dark:bg-gray-800 / text-blue-600 …）
 * 换成语义 token（bg-surface-2 / bg-surface / text-accent …）。
 *
 * 默认 dry-run，只打印报告；加 --apply 才写盘。用完即删。
 *
 * 作用域刻意收得很紧：只重写 className 属性值内部的字符串字面量。
 * 因为作用域被限定在这里，alert() 文案、注释、CustomCSS.jsx 里的 CSS 文本
 * 天然碰不到，不需要额外黑名单。
 *
 * 用法：
 *   node scripts/codemod-tokens.mjs                     # dry-run 全量
 *   node scripts/codemod-tokens.mjs --diff              # 附带逐行 diff
 *   node scripts/codemod-tokens.mjs --only=src/components/ui/Button.jsx
 *   node scripts/codemod-tokens.mjs --apply --only=a.jsx,b.jsx
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const SHOW_DIFF = argv.includes('--diff');
const ONLY_ARG = argv.find((a) => a.startsWith('--only='));
const ONLY = ONLY_ARG
  ? new Set(
      ONLY_ARG.slice('--only='.length)
        .split(',')
        .map((s) => s.trim().replace(/\\/g, '/'))
        .filter(Boolean)
    )
  : null;

/**
 * 主题定义自身的文件不能被改写，否则 token 真源会被抹掉。
 * （CustomCSS.jsx 不在这里：它虽然含 CSS 文本，但那些文本不在 className 属性里，
 *   而本脚本的作用域只到 className 内部，天然碰不到。）
 */
const EXCLUDE = new Set(['src/theme/palettes.js', 'src/theme/apply.js']);

/* ------------------------------------------------------------------ *
 * 文本扫描：只在 className 内动手
 * ------------------------------------------------------------------ */

/** src[i] 是引号，返回配对引号的下标；找不到返回 -1。 */
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

/** src[i] 是 '{'，返回配对 '}' 的下标；找不到返回 -1。 */
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

/** src[i] 是反引号，返回配对反引号的下标；找不到返回 -1。 */
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

/** 找出所有 className 属性值表达式的内容区间。 */
function scanClassNames(src) {
  const ranges = [];
  const re = /className\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) {
    const before = src[m.index - 1];
    if (before && /[A-Za-z0-9_$.\-]/.test(before)) continue; // 是 xxxclassName，跳过
    let i = re.lastIndex;
    if (src[i] === '"' || src[i] === "'") {
      const end = findStringEnd(src, i);
      if (end === -1) continue;
      // 纯字符串形态：整段内容就是一个字面量
      ranges.push({ start: i + 1, end, plain: true });
      re.lastIndex = end + 1;
    } else if (src[i] === '{') {
      const end = findBalanced(src, i);
      if (end === -1) continue;
      ranges.push({ start: i + 1, end, plain: false });
      re.lastIndex = end + 1;
    }
  }
  return ranges;
}

/**
 * 在 [start, end) 内找出所有字符串字面量的**内容**区间。
 * 模板串里 ${} 之外的段各算一段；${} 内部递归扫描，
 * 因为 `base ${on ? 'bg-blue-500' : 'bg-gray-100'}` 这种写法很常见。
 */
function scanLiterals(src, start, end) {
  const out = [];
  let i = start;
  while (i < end) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const e = findStringEnd(src, i);
      if (e === -1 || e > end) break;
      out.push([i + 1, e]);
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
          if (j > segStart) out.push([segStart, j]);
          const e = findBalanced(src, j + 1);
          if (e === -1) return out;
          out.push(...scanLiterals(src, j + 2, e));
          j = e + 1;
          segStart = j;
          continue;
        }
        j++;
      }
      if (j > segStart) out.push([segStart, j]);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 映射表
 * ------------------------------------------------------------------ */

const UTIL_RE =
  /^(ring-offset|ring|border|divide|placeholder|outline|decoration|shadow|accent|caret|fill|stroke|from|via|to|bg|text)-/;

/** 调色板家族归并：这些冷灰一律当暖灰处理。 */
const NEUTRAL_FAMILY = new Set(['gray', 'slate', 'zinc', 'neutral', 'stone']);
const ACCENT_FAMILY = new Set(['blue', 'primary']);
const SUCCESS_FAMILY = new Set(['green', 'emerald', 'teal', 'lime']);
const WARNING_FAMILY = new Set(['yellow', 'amber', 'orange']);
const DANGER_FAMILY = new Set(['red', 'rose']);
const INFO_FAMILY = new Set(['purple', 'violet', 'indigo', 'cyan', 'sky', 'fuchsia', 'pink']);

/** 中性色：utility → { light, dark } → 语义后缀 */
const NEUTRAL = {
  bg: {
    light: {
      white: 'surface',
      'gray-50': 'bg',
      'gray-100': 'surface-2',
      'gray-200': 'surface-2',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'muted',
      'gray-600': 'surface-2',
      'gray-700': 'surface-2',
      'gray-800': 'surface-2',
      'gray-900': 'bg',
      'gray-950': 'bg',
    },
    dark: {
      white: 'surface',
      'gray-50': 'bg',
      'gray-100': 'surface-2',
      'gray-200': 'surface-2',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'line',
      'gray-600': 'line',
      'gray-700': 'surface-2',
      'gray-800': 'surface',
      'gray-900': 'bg',
      'gray-950': 'bg',
    },
  },
  text: {
    light: {
      'gray-50': 'line',
      'gray-100': 'line',
      'gray-200': 'line',
      'gray-300': 'line',
      'gray-400': 'muted',
      'gray-500': 'muted',
      'gray-600': 'muted',
      'gray-700': 'fg',
      'gray-800': 'fg',
      'gray-900': 'fg',
      'gray-950': 'fg',
    },
    dark: {
      white: 'fg',
      'gray-50': 'fg',
      'gray-100': 'fg',
      'gray-200': 'fg',
      'gray-300': 'fg',
      'gray-400': 'muted',
      'gray-500': 'muted',
      'gray-600': 'line',
      'gray-700': 'line',
      'gray-800': 'line',
      'gray-900': 'line',
      'gray-950': 'line',
    },
  },
  border: {
    light: {
      'gray-50': 'line',
      'gray-100': 'line',
      'gray-200': 'line',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'line',
      'gray-600': 'line',
      'gray-700': 'line',
      'gray-800': 'line',
      'gray-900': 'line',
    },
    dark: {
      'gray-50': 'line',
      'gray-100': 'line',
      'gray-200': 'line',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'line',
      'gray-600': 'line',
      'gray-700': 'line',
      'gray-800': 'line',
      'gray-900': 'line',
    },
  },
  divide: {
    light: {
      'gray-50': 'line',
      'gray-100': 'line',
      'gray-200': 'line',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'line',
      'gray-600': 'line',
      'gray-700': 'line',
      'gray-800': 'line',
      'gray-900': 'line',
    },
    dark: {
      'gray-50': 'line',
      'gray-100': 'line',
      'gray-200': 'line',
      'gray-300': 'line',
      'gray-400': 'line',
      'gray-500': 'line',
      'gray-600': 'line',
      'gray-700': 'line',
      'gray-800': 'line',
      'gray-900': 'line',
    },
  },
  ring: {
    light: { 'gray-100': 'line', 'gray-200': 'line', 'gray-300': 'line', 'gray-400': 'line' },
    dark: { 'gray-100': 'line', 'gray-200': 'line', 'gray-300': 'line', 'gray-400': 'line' },
  },
  placeholder: {
    light: { 'gray-300': 'muted', 'gray-400': 'muted', 'gray-500': 'muted' },
    dark: { 'gray-300': 'muted', 'gray-400': 'muted', 'gray-500': 'muted' },
  },
};

/** 语义色家族：按 shade 分档 → 语义后缀 */
const SEMANTIC = {
  accent: {
    bg: { low: 'accent/12', mid: 'accent', high: 'accent-700' },
    text: { low: 'accent', mid: 'accent', high: 'accent' },
    border: { low: 'accent/40', mid: 'accent', high: 'accent' },
    ring: { low: 'accent', mid: 'accent', high: 'accent' },
    from: { low: 'accent', mid: 'accent', high: 'accent' },
    to: { low: 'accent', mid: 'accent', high: 'accent' },
    via: { low: 'accent', mid: 'accent', high: 'accent' },
    fill: { low: 'accent', mid: 'accent', high: 'accent' },
    stroke: { low: 'accent', mid: 'accent', high: 'accent' },
  },
  success: {
    bg: { low: 'success/12', mid: 'success', high: 'success' },
    text: { low: 'success', mid: 'success', high: 'success' },
    border: { low: 'success/40', mid: 'success', high: 'success' },
    ring: { low: 'success', mid: 'success', high: 'success' },
  },
  warning: {
    bg: { low: 'warning/14', mid: 'warning', high: 'warning' },
    text: { low: 'warning', mid: 'warning', high: 'warning' },
    border: { low: 'warning/40', mid: 'warning', high: 'warning' },
    ring: { low: 'warning', mid: 'warning', high: 'warning' },
  },
  danger: {
    bg: { low: 'danger/12', mid: 'danger', high: 'danger' },
    text: { low: 'danger', mid: 'danger', high: 'danger' },
    border: { low: 'danger/40', mid: 'danger', high: 'danger' },
    ring: { low: 'danger', mid: 'danger', high: 'danger' },
  },
  info: {
    bg: { low: 'info/12', mid: 'info', high: 'info' },
    text: { low: 'info', mid: 'info', high: 'info' },
    border: { low: 'info/40', mid: 'info', high: 'info' },
    ring: { low: 'info', mid: 'info', high: 'info' },
  },
};

const HOVER_VARIANTS = new Set([
  'hover',
  'group-hover',
  'peer-hover',
  'active',
  'focus',
  'focus-visible',
  'focus-within',
]);

/** 按顶层冒号切变体前缀，方括号里的冒号不算。 */
function splitVariants(token) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of token) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (ch === ':' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts;
}

function shadeBucket(n) {
  if (n <= 200) return 'low';
  if (n <= 500) return 'mid';
  return 'high';
}

/**
 * 映射单个 token。返回 { out, warn }。
 * out === token 表示不改动。
 */
function mapToken(token) {
  if (!token || token.includes('[')) return { out: token, warn: null };

  const parts = splitVariants(token);
  const base = parts.pop();
  const variants = parts;
  const isDark = variants.includes('dark');
  const isHover = variants.some((v) => HOVER_VARIANTS.has(v));

  const um = base.match(UTIL_RE);
  if (!um) return { out: token, warn: null };

  let util = um[1];
  let rest = base.slice(um[0].length);

  // 方向性边框：border-t-gray-200 → border + gray-200
  if (util === 'border') {
    const dm = rest.match(/^([trblxy])-(.+)$/);
    if (dm) rest = dm[2];
  }

  const cm = rest.match(
    /^(?:(white|black|transparent|current|inherit)|(gray|slate|zinc|neutral|stone|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red|rose|pink|purple|violet|indigo|fuchsia|primary)(?:-(\d{2,3}))?)(?:\/(\d{1,3}))?$/
  );
  if (!cm) return { out: token, warn: null };

  const palRaw = cm[1] || cm[2];
  const shade = cm[3] ? Number(cm[3]) : null;
  const opacity = cm[4] || null;
  const pal = shade === null ? palRaw : `${palRaw}-${shade}`;

  // 透明/继承/黑色：不动，黑色留作遮罩特例
  if (palRaw === 'transparent' || palRaw === 'current' || palRaw === 'inherit') {
    return { out: token, warn: null };
  }

  const keepVariants = variants.filter((v) => v !== 'dark');
  const prefix = keepVariants.length ? `${keepVariants.join(':')}:` : '';
  /** 供 transformLiteral 做「同槽位冲突」判定用 */
  const meta = { variants: keepVariants, util, palRaw };

  // 极低透明度的黑是「轻微压暗」的填充，跟随主题反色才对；
  // 高透明度的黑是弹窗遮罩，两种主题下都该是黑的，保持原样。
  if (palRaw === 'black') {
    if (util === 'bg' && opacity && Number(opacity) <= 20) {
      return { out: `${prefix}bg-fg/${opacity}`, warn: null, ...meta };
    }
    return { out: token, warn: `未处理 ${token}（黑色遮罩/描边，需人工确认）`, ...meta };
  }

  const family =
    palRaw === 'white' || NEUTRAL_FAMILY.has(palRaw)
      ? 'neutral'
      : ACCENT_FAMILY.has(palRaw)
      ? 'accent'
      : SUCCESS_FAMILY.has(palRaw)
        ? 'success'
        : WARNING_FAMILY.has(palRaw)
          ? 'warning'
          : DANGER_FAMILY.has(palRaw)
            ? 'danger'
            : INFO_FAMILY.has(palRaw)
              ? 'info'
              : null;
  if (!family) return { out: token, warn: null };

  // ---- 中性色 ----
  if (family === 'neutral') {
    const key = palRaw === 'white' ? 'white' : `gray-${shade}`;

    // 暗色下低透明度的白，语义是「轻微提亮」，和浅色下的 bg-black/5 是同一件事
    if (isDark && util === 'bg' && palRaw === 'white' && opacity && Number(opacity) <= 25) {
      return { out: `${prefix}bg-fg/${opacity}`, warn: null, ...meta };
    }

    // hover 档必须避开元素自身底色，否则会和自身背景撞成同值、hover 直接失效。
    // 具体换到哪个 token 取决于这个元素自己的底，所以这里只登记，稍后统一解析。
    if (isHover && util === 'bg') {
      if (palRaw === 'white') {
        return { out: `${prefix}bg-surface${opacity ? `/${opacity}` : ''}`, warn: null, ...meta };
      }
      return { out: null, warn: null, deferred: prefix, ...meta };
    }

    // 裸的深色底（没有 dark: 前缀的 gray-700/800/900）通常是「反色」元素 ——
    // 深色按钮、tooltip。它该跟随主题反转，而不是当成浅色面板，
    // 所以也要看同一串里有没有 text-white 才能定，先登记。
    if (!isDark && util === 'bg' && shade !== null && shade >= 700) {
      return { out: null, warn: null, deferDarkBg: shade, ...meta };
    }

    if (shade !== null && shade >= 800 && util === 'bg' && opacity && Number(opacity) >= 30) {
      return { out: token, warn: `疑似遮罩层 ${token}，未自动替换`, ...meta };
    }

    const table = NEUTRAL[util];
    if (!table) return { out: token, warn: `中性色工具类未覆盖：${token}`, ...meta };
    const map = isDark ? table.dark : table.light;
    const suffix = map[key];
    if (!suffix) return { out: token, warn: `中性色映射缺失：${token}`, ...meta };
    return { out: `${prefix}${util}-${suffix}${opacity ? `/${opacity}` : ''}`, warn: null, ...meta };
  }

  // ---- 语义色 ----
  if (shade === null) return { out: token, warn: `无档位的语义色：${token}`, ...meta };
  const byUtil = SEMANTIC[family][util];
  if (!byUtil) return { out: token, warn: `语义色工具类未覆盖：${token}`, ...meta };
  const suffix = byUtil[shadeBucket(shade)];
  // 实心强调色按钮的 hover 要再深一档，不能用 accent/12 那种浅底；
  // 而 hover:bg-blue-50 本来就是浅底，走下面的分档映射。
  if (isHover && family === 'accent' && util === 'bg' && shade >= 400) {
    return { out: `${prefix}bg-accent-700`, warn: null, ...meta };
  }
  if (suffix.includes('/')) {
    return { out: `${prefix}${util}-${suffix}`, warn: null, ...meta };
  }
  return {
    out: `${prefix}${util}-${suffix}${opacity ? `/${opacity}` : ''}`,
    warn: null,
    ...meta,
  };
}

/** 处理一段字符串字面量内容。 */
function transformLiteral(text, warns) {
  const pieces = text.split(/(\s+)/).filter((s) => s !== '');
  const slots = pieces.map((p) => (/\s/.test(p) ? { ws: p } : { token: p }));

  for (const s of slots) {
    if (!s.token) continue;
    const r = mapToken(s.token);
    if (r.warn) warns.push(r.warn);
    s.out = r.out;
    s.variants = r.variants;
    s.util = r.util;
    if (r.deferred !== undefined) s.deferred = r.deferred;
    if (r.deferDarkBg !== undefined) s.deferDarkBg = r.deferDarkBg;
  }

  // 同一个槽位（变体前缀 + 工具类）同时出现浅色与 dark: 两个 token 时，
  // 两者的映射结果可能不同 —— 例如 text-gray-600 与 dark:text-gray-300。
  // 不猜：保留浅色那个（浅色是设计基准），丢掉 dark: 的，并报告。
  const byKey = new Map();
  for (const s of slots) {
    // 只对真正命中映射表的 token 做冲突判定；普通工具类（flex / w-4）没有 util，跳过
    if (!s.token || !s.out || !s.util) continue;
    if (s.deferred !== undefined || s.deferDarkBg !== undefined) continue;
    const key = `${(s.variants || []).join(':')}|${s.util}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(s);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const light = group.find((s) => !s.token.startsWith('dark:') && !s.token.includes(':dark:'));
    if (!light) continue;
    for (const s of group) {
      if (s === light || s.out === light.out) continue;
      warns.push(`浅/暗同槽位映射不一致，已保留浅色「${light.out}」并丢弃「${s.token}」`);
      s.out = '';
      s.dropped = true;
    }
  }

  // 中性 hover 底参照元素自身底色解析：
  //   元素是 bg-surface-2 时用 line/60（再深一档，保证能看出变化）
  //   其余情况用 surface-2（等价于原来的 gray-100 hover）
  const ownBg = slots.find(
    (s) => s.out && /^bg-(bg|surface|surface-2|line|muted|fg)$/.test(s.out)
  )?.out;

  // 裸深色底 + text-white = 反色元素，交给 bg-fg / text-bg 处理
  const hasWhiteText = /(^|\s)(?:[a-z-]+:)*text-white(?:\/\d{1,3})?(?=\s|$)/.test(text);
  const inverted = hasWhiteText && slots.some((s) => s.deferDarkBg !== undefined);

  for (const s of slots) {
    if (s.deferred !== undefined) {
      s.out = `${s.deferred}${ownBg === 'bg-surface-2' ? 'bg-line' : 'bg-surface-2'}`;
    } else if (s.deferDarkBg !== undefined) {
      s.out = inverted ? 'bg-fg' : s.deferDarkBg >= 900 ? 'bg-bg' : 'bg-surface-2';
    }
  }

  // hover 的文字色若和元素自身文字色撞成同值，hover 就完全看不见了，往上抬一档。
  const TEXT_STEP = { 'text-line': 'text-muted', 'text-muted': 'text-fg', 'text-accent': 'text-accent-700' };
  const baseText = slots.find((s) => s.out && /^text-(fg|muted|line|accent)$/.test(s.out))?.out;
  if (baseText) {
    for (const s of slots) {
      if (!s.out || !(s.variants || []).some((v) => HOVER_VARIANTS.has(v))) continue;
      const m = s.out.match(/^((?:[a-z-]+:)*)(text-(?:fg|muted|line|accent))$/);
      if (!m || m[2] !== baseText) continue;
      if (TEXT_STEP[m[2]]) s.out = `${m[1]}${TEXT_STEP[m[2]]}`;
    }
  }

  const literal = slots.map((s) => (s.dropped ? '' : (s.out ?? s.ws ?? s.token))).join('');

  // text-white 只在同一串里存在**唯一一个实心语义底**时才转对应前景色。
  // 底是 tint（bg-accent/12）时不算 —— 那种底上本来就该用深色字。
  const bgFamilies = new Set();
  const bgRe = /(?:^|\s)(?:[a-z-]+:)*bg-(accent|success|warning|danger|info)(?:-700)?(?:\/(\d{1,3}))?(?=\s|$)/g;
  let bm;
  while ((bm = bgRe.exec(literal))) {
    if (!bm[2] || Number(bm[2]) >= 50) bgFamilies.add(bm[1]);
  }
  const solidFamily = bgFamilies.size === 1 ? [...bgFamilies][0] : null;
  const fgTarget = solidFamily ? `text-${solidFamily}-fg` : inverted ? 'text-bg' : null;

  let result = literal;
  result = result.replace(
    /(^|\s)((?:[a-z-]+:)*)text-white(\/\d{1,3})?(?=\s|$)/g,
    (full, lead, prefix, op) => {
      if (fgTarget) return `${lead}${prefix}${fgTarget}${op || ''}`;
      warns.push(`独立出现的 text-white（${full.trim()}）未替换，需人工确认`);
      return full;
    }
  );

  // 去重：同一串里映射后完全相同的 token 只留一个。
  // bg-white dark:bg-gray-800 会被折叠成一个 bg-surface，这一步是必须的。
  const toks = result.split(/(\s+)/).filter((s) => s !== '');
  const seen = new Set();
  const kept = [];
  for (const t of toks) {
    if (/\s/.test(t)) {
      kept.push(t);
      continue;
    }
    if (seen.has(t)) {
      if (kept.length && /\s/.test(kept[kept.length - 1])) kept.pop();
      continue;
    }
    seen.add(t);
    kept.push(t);
  }
  return kept.join('').replace(/\s+$/, '');
}

/* ------------------------------------------------------------------ *
 * 主流程
 * ------------------------------------------------------------------ */

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(jsx|tsx|js|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function relOf(abs) {
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

const files = walk(SRC).filter((f) => {
  const rel = relOf(f);
  if (EXCLUDE.has(rel)) return false;
  if (ONLY && !ONLY.has(rel)) return false;
  return true;
});

const allWarns = new Map();
const changedFiles = [];
let totalTokens = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ranges = scanClassNames(src);
  if (!ranges.length) continue;

  const warns = [];
  const edits = [];
  for (const { start, end, plain } of ranges) {
    const literalRanges = plain ? [[start, end]] : scanLiterals(src, start, end);
    for (const [ls, le] of literalRanges) {
      const original = src.slice(ls, le);
      if (!/[a-z]/.test(original)) continue;
      const next = transformLiteral(original, warns);
      if (next !== original) edits.push({ ls, le, original, next });
    }
  }

  for (const w of warns) {
    allWarns.set(w, (allWarns.get(w) || 0) + 1);
  }

  if (!edits.length) continue;

  let out = '';
  let cursor = 0;
  for (const e of edits) {
    out += src.slice(cursor, e.ls) + e.next;
    cursor = e.le;
  }
  out += src.slice(cursor);

  totalTokens += edits.length;
  changedFiles.push({ file, rel: relOf(file), edits, before: src, after: out });

  if (SHOW_DIFF) {
    console.log(`\n=== ${relOf(file)} ===`);
    for (const e of edits) {
      console.log(`- ${e.original.trim().replace(/\s+/g, ' ')}`);
      console.log(`+ ${e.next.trim().replace(/\s+/g, ' ')}`);
    }
  }

  if (APPLY) fs.writeFileSync(file, out, 'utf8');
}

console.log(`\n模式：${APPLY ? 'APPLY（已写盘）' : 'dry-run'}`);
console.log(`扫描文件 ${files.length} 个，命中 ${changedFiles.length} 个，改写字面量 ${totalTokens} 处`);

if (allWarns.size) {
  console.log('\n需要人工确认：');
  for (const [w, n] of [...allWarns.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  [${n}] ${w}`);
  }
}

if (!SHOW_DIFF) {
  console.log('\n命中文件：');
  for (const f of changedFiles) console.log(`  ${f.rel}  (${f.edits.length})`);
}
