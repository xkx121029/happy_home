import {
  DEFAULT_THEME,
  FONT_STACKS,
  NEUTRALS,
  PRESET_THEMES,
  RADIUS_SCALES,
} from './palettes';

/**
 * 主题应用层：把「一个主题对象」变成「一组 CSS 变量」。
 *
 * 中性色系是手工校对好的固定值，强调色不是 —— 它要支持任意取色，
 * 所以这里负责从单个色值推导出整套色阶，并且保证推导结果真的能读。
 */

/** token 名 → CSS 变量名。中性色与强调色共用这张表。 */
const TOKEN_VARS = {
  bg: '--c-bg',
  surface: '--c-surface',
  surface2: '--c-surface-2',
  fg: '--c-fg',
  muted: '--c-muted',
  border: '--c-border',
  accent: '--c-accent',
  accentFg: '--c-accent-fg',
  accent50: '--c-accent-50',
  accent100: '--c-accent-100',
  accent200: '--c-accent-200',
  accent700: '--c-accent-700',
};

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

/** 强调色上的文字：深色文字给浅底强调色用，浅色文字给深底强调色用。 */
const TEXT_ON_LIGHT_ACCENT = [26, 23, 18];
const TEXT_ON_DARK_ACCENT = [255, 252, 249];

/** 正文与次要文字要求 4.5:1（WCAG AA 对普通字号的阈值）。 */
const MIN_CONTRAST = 4.5;

/** 亮色模式下浅色档向白混、暗色模式下向暗底混的比例。 */
const TINT_STRENGTH = {
  light: [0.93, 0.86, 0.7],
  dark: [0.86, 0.74, 0.54],
};

// ----------------------------------------------------------------- 颜色工具

export function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  const match = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let value = match[1];
  if (value.length === 3) {
    value = value.split('').map((char) => char + char).join('');
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function rgbToHex(rgb) {
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function normalizeHex(hex) {
  const rgb = parseHex(hex);
  return rgb ? rgbToHex(rgb) : null;
}

/** 把「250 247 242」这样的 token 值转成可直接给 CSS 用的颜色。 */
export function tokenToCss(token) {
  return `rgb(${token})`;
}

const toRgb = (token) => token.split(' ').map(Number);

function mix(from, to, ratio) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * ratio));
}

/** sRGB 空间里的 alpha 合成，用来还原 bg-accent/12 这类半透明底色的实际颜色。 */
function over(foreground, alpha, background) {
  return foreground.map((value, index) =>
    Math.round(value * alpha + background[index] * (1 - alpha))
  );
}

/** WCAG 相对亮度。 */
function luminance([r, g, b]) {
  const channel = (value) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** 两个颜色之间的 WCAG 对比度。 */
function contrastOf(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * 强调色上该用深色文字还是浅色文字。
 *
 * 这里直接比较两种方案的实际对比度，而不是拿亮度跟一个阈值比 ——
 * 阈值法在中间地带会选错：芥黄 #B0842A 的亮度只有 0.26，
 * 按「亮度 > 0.5 才用深字」会配白字，实际对比度 3.4:1（不合格），
 * 配深字则有 5.3:1。
 */
function readableOn(accentRgb) {
  return contrastOf(accentRgb, TEXT_ON_LIGHT_ACCENT) >=
    contrastOf(accentRgb, TEXT_ON_DARK_ACCENT)
    ? TEXT_ON_LIGHT_ACCENT
    : TEXT_ON_DARK_ACCENT;
}

/**
 * RGB → HSL。刻意不取整：取整会让 hex → hsl → hex 往返产生 ±1 的色偏，
 * 用户只要碰一下滑杆，颜色就会莫名其妙地飘一点。取整交给展示层去做。
 */
export function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness * 100];

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue;
  if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) hue = ((bn - rn) / delta + 2) / 6;
  else hue = ((rn - gn) / delta + 4) / 6;

  return [hue * 360, saturation * 100, lightness * 100];
}

export function hslToRgb(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  return [
    Math.round(channel(h + 1 / 3) * 255),
    Math.round(channel(h) * 255),
    Math.round(channel(h - 1 / 3) * 255),
  ];
}

export function hexToHsl(hex) {
  const rgb = parseHex(hex);
  return rgb ? rgbToHsl(rgb) : [0, 0, 0];
}

export function hslToHex(hue, saturation, lightness) {
  return rgbToHex(hslToRgb(hue, saturation, lightness));
}

// ------------------------------------------------------------- 强调色推导

/**
 * 某个 HSL 亮度对应的完整强调色阶，外加两个「检验用」的参考色。
 *
 * surface 与 badge 不参与输出，只是拿来算对比度：
 * bg-accent/12 这类半透明徽标的实际底色，是 12% 的强调色叠在中性面上，
 * 它比中性面本身更接近强调色，因此是最容易被忽略、也最容易不达标的一条。
 */
function accentScaleAt(hue, saturation, lightness, neutral, mode) {
  const accent = hslToRgb(hue, saturation, lightness);
  const surface = toRgb(neutral[mode].surface);
  const tintBase = mode === 'light' ? WHITE : toRgb(neutral.dark.bg);
  const [s50, s100, s200] = TINT_STRENGTH[mode];

  return {
    accent,
    accentFg: readableOn(accent),
    accent50: mix(accent, tintBase, s50),
    accent100: mix(accent, tintBase, s100),
    accent200: mix(accent, tintBase, s200),
    accent700: mode === 'light' ? mix(accent, BLACK, 0.22) : mix(accent, WHITE, 0.28),
    surface,
    badge: over(accent, 0.12, surface),
  };
}

/**
 * 强调色在这套设计里承担的每一处「当文字用」的组合都要达标。
 *
 * 少检一条就会漏。这几条不是假想的 —— 它们对应代码里真实存在的写法：
 *   accent / accentFg   按钮底色 + 按钮文字（Button primary）
 *   accent / surface    链接、卡片强调数字、状态徽标文字
 *   accent / accent50   侧边栏选中项（Sidebar 的 bg-accent-50 text-accent）
 *   accent / accent100  评论与顶栏头像（bg-accent-100 text-accent）
 *   accent / badge      半透明徽标（StatusBadge 的 bg-accent/12 text-accent）
 */
function accentScalePasses(scale) {
  return (
    contrastOf(scale.accent, scale.accentFg) >= MIN_CONTRAST &&
    contrastOf(scale.accent, scale.surface) >= MIN_CONTRAST &&
    contrastOf(scale.accent, scale.accent50) >= MIN_CONTRAST &&
    contrastOf(scale.accent, scale.accent100) >= MIN_CONTRAST &&
    contrastOf(scale.accent, scale.badge) >= MIN_CONTRAST
  );
}

/**
 * 把强调色调到「当文字用也读得清」的亮度。
 *
 * 强调色不只是按钮底色 —— 它还大量作为文字色出现。所以它必须与所在
 * 中性面拉开 4.5:1：亮色模式下太浅的强调色要压暗，暗色模式下太深的要提亮。
 *
 * 不这么做的后果是具体的：芥黄 #B0842A 在白底上只有 3.3:1，
 * 松绿 #2F6B4F 在暖炭底上只有 2.7:1 —— 都不合格。
 *
 * 搜索时逐档调整 HSL 亮度，取第一个全部达标的档位；优先朝该模式的
 * 直觉方向调（亮色压暗、暗色提亮）。找不到就退回「最接近达标」的那个，
 * 保证任何输入都有确定输出。
 *
 * 代价是用户取的颜色未必就是最终渲染的颜色。这是必然的取舍：
 * 否则「浅黄按钮 + 白底黄字」这类组合总有一处读不清。
 */
function fitAccent(base, neutral, mode) {
  const [hue, saturation, lightness] = rgbToHsl(base);
  const preferLighter = mode === 'dark';

  let best = null;
  let bestScore = -1;

  for (let step = 0; step <= 90; step += 1) {
    const offsets = step === 0 ? [0] : preferLighter ? [step, -step] : [-step, step];

    for (const offset of offsets) {
      const candidate = lightness + offset;
      if (candidate < 4 || candidate > 96) continue;

      const scale = accentScaleAt(hue, saturation, candidate, neutral, mode);
      if (accentScalePasses(scale)) return scale;

      // 无法达标时留下「最接近达标」的档位兜底
      const score = Math.min(
        contrastOf(scale.accent, scale.accentFg),
        contrastOf(scale.accent, scale.accent100)
      );
      if (score > bestScore) {
        bestScore = score;
        best = scale;
      }
    }
  }

  return best || accentScaleAt(hue, saturation, lightness, neutral, mode);
}

const ACCENT_TOKENS = ['accent', 'accentFg', 'accent50', 'accent100', 'accent200', 'accent700'];

/**
 * 从单个强调色推导整套色阶。
 *
 * 传入整套中性色阶而不是单个背景色：强调色在两个模式下都要跟「卡片面」
 * 对齐对比度（卡片面才是强调色文字实际落上去的地方），而两个模式的
 * 卡片面不一样 —— 亮色下比底色更亮，暗色下比底色更亮但整体是暗的。
 */
export function buildAccentScale(hex, neutral) {
  const base = parseHex(hex) || parseHex(DEFAULT_THEME.accent);

  const pick = (scale) => {
    const out = {};
    for (const key of ACCENT_TOKENS) out[key] = scale[key];
    return out;
  };

  return {
    light: pick(fitAccent(base, neutral, 'light')),
    dark: pick(fitAccent(base, neutral, 'dark')),
  };
}

// --------------------------------------------------------------- 主题解析

function pick(map, key, fallbackKey) {
  return map[key] ? key : fallbackKey;
}

/**
 * 把任意来源的设置对象规整成一个合法的主题。
 *
 * 要兼容两种历史数据，否则老站升级后主题会直接消失：
 *   1. 旧主题页存的是 { name, colors: { primary, ... }, font: 'Inter', layout }，
 *      其中只有 colors.primary 真正起过作用。
 *   2. 更早的版本把强调色存在顶层的 primaryColor 键上。
 */
export function resolveTheme(settings) {
  const raw = settings?.theme;

  if (raw && typeof raw === 'object') {
    const accent = parseHex(raw.accent);
    if (NEUTRALS[raw.neutral] && accent) {
      return {
        presetId: raw.presetId || 'custom',
        neutral: raw.neutral,
        accent: rgbToHex(accent),
        radius: pick(RADIUS_SCALES, raw.radius, DEFAULT_THEME.radius),
        font: pick(FONT_STACKS, raw.font, DEFAULT_THEME.font),
      };
    }

    const legacyAccent = raw.colors?.primary;
    if (parseHex(legacyAccent)) {
      return { ...DEFAULT_THEME, presetId: 'custom', accent: normalizeHex(legacyAccent) };
    }
  }

  if (parseHex(settings?.primaryColor)) {
    return { ...DEFAULT_THEME, presetId: 'custom', accent: normalizeHex(settings.primaryColor) };
  }

  return { ...DEFAULT_THEME };
}

/** 当前主题与哪套预设完全一致；不一致则返回 'custom'。 */
export function matchPresetId(theme) {
  const hit = PRESET_THEMES.find(
    (preset) =>
      preset.neutral === theme.neutral &&
      preset.accent.toUpperCase() === theme.accent.toUpperCase() &&
      preset.radius === theme.radius &&
      preset.font === theme.font
  );
  return hit ? hit.id : 'custom';
}

export function isSameTheme(a, b) {
  return (
    a.neutral === b.neutral &&
    a.accent.toUpperCase() === b.accent.toUpperCase() &&
    a.radius === b.radius &&
    a.font === b.font
  );
}

// ------------------------------------------------------------- 变量与样式

/**
 * 色阶推导要逐档试算，一次大约几十次对比度计算。
 * 主题页的预设网格会同时渲染十几个主题，拖动取色滑杆时每帧都要重算一遍，
 * 所以这里缓存结果 —— 键里已经包含了影响结果的全部维度。
 */
const varsCache = new Map();

/**
 * 生成一个主题在指定模式下的全部 CSS 变量。
 *
 * 返回值既可以直接当 React 的 style 对象用（做局部预览），
 * 也可以序列化成样式表（做全站应用）—— 两条路径共用同一份计算，
 * 预览与实际效果不可能不一致。
 */
export function themeVars(theme, mode = 'light') {
  const key = [theme.neutral, theme.accent, theme.radius, theme.font, mode].join('|');
  const cached = varsCache.get(key);
  if (cached) return cached;

  const neutral = NEUTRALS[theme.neutral] || NEUTRALS[DEFAULT_THEME.neutral];
  const radius = RADIUS_SCALES[theme.radius] || RADIUS_SCALES[DEFAULT_THEME.radius];
  const font = FONT_STACKS[theme.font] || FONT_STACKS[DEFAULT_THEME.font];
  const accent = buildAccentScale(theme.accent, neutral);

  const tokens = { ...neutral[mode], ...accent[mode] };
  const vars = {};

  for (const [token, value] of Object.entries(tokens)) {
    const name = TOKEN_VARS[token];
    if (name) vars[name] = Array.isArray(value) ? value.join(' ') : value;
  }

  vars['--r-sm'] = radius.vars.sm;
  vars['--r'] = radius.vars.r;
  vars['--r-md'] = radius.vars.md;
  vars['--r-lg'] = radius.vars.lg;
  vars['--r-xl'] = radius.vars.xl;
  vars['--r-2xl'] = radius.vars['2xl'];
  vars['--r-3xl'] = radius.vars['3xl'];
  vars['--font-sans'] = font.stack;

  if (varsCache.size > 200) varsCache.clear();
  varsCache.set(key, vars);
  return vars;
}

function cssRule(selector, vars) {
  const body = Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  return `${selector}{${body}}`;
}

/**
 * 全站主题样式表。
 *
 * 为什么不用 documentElement.style.setProperty：内联样式优先级高于样式表，
 * 一旦把亮色的 --c-accent 写成内联属性，tokens.css 里 html[data-theme='dark']
 * 那一整块暗色覆盖就永久失效 —— 切到暗色时强调色不会跟着变。
 * 生成两条规则交给层叠去决定，明暗切换才能继续按原有顺序工作。
 */
export function globalThemeCss(theme) {
  return (
    cssRule(':root', themeVars(theme, 'light')) +
    cssRule("html[data-theme='dark']", themeVars(theme, 'dark'))
  );
}
