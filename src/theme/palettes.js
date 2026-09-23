/**
 * 主题数据。
 *
 * 一个主题由四个互相独立的维度组成，而不是一堆散落的色值：
 *
 *   中性色系（neutral）  决定背景、卡片面、正文、次要文字、描边 —— 也就是「纸张的颜色」
 *   强调色（accent）     唯一的功能色，按钮、链接、选中态都用它
 *   圆角（radius）       整体转角的锐利程度
 *   字体（font）         全站字体栈
 *
 * 这样拆的好处是组合爆炸：6 个中性色系 × 任意强调色 × 3 档圆角 × 4 种字体
 * 能生成几百种观感，而需要手工校对的色值只有 6 套中性色阶。
 *
 * 中性色一律用「空格分隔的 RGB 三元组」而不是 hex —— Tailwind 需要这个格式
 * 才能生成 bg-bg/80 这类带透明度的类。
 *
 * 配色刻意避开通用 SaaS 观感：没有纯白配 #3B82F6，没有紫蓝渐变，
 * 强调色一律取低饱和的土色 / 矿物色。高饱和色是 AI 生成界面最明显的特征。
 */

export const NEUTRALS = {
  paper: {
    label: '暖纸',
    hint: '米白偏暖，纸质感',
    light: {
      bg: '250 247 242',
      surface: '255 253 250',
      surface2: '244 239 232',
      fg: '28 24 20',
      muted: '118 108 98',
      border: '226 218 208',
    },
    dark: {
      bg: '22 19 15',
      surface: '30 26 21',
      surface2: '39 34 28',
      fg: '242 236 228',
      muted: '167 156 144',
      border: '51 44 36',
    },
  },

  linen: {
    label: '亚麻',
    hint: '中性灰米，克制',
    light: {
      bg: '247 246 243',
      surface: '253 252 250',
      surface2: '240 238 233',
      fg: '26 26 24',
      muted: '107 105 99',
      border: '224 221 214',
    },
    dark: {
      bg: '20 20 19',
      surface: '28 28 26',
      surface2: '37 37 34',
      fg: '240 239 235',
      muted: '162 160 153',
      border: '48 48 44',
    },
  },

  mist: {
    label: '雾青',
    hint: '冷调蓝灰，理性',
    light: {
      bg: '244 246 247',
      surface: '252 253 254',
      surface2: '235 239 241',
      fg: '22 27 30',
      muted: '95 107 113',
      border: '216 223 227',
    },
    dark: {
      bg: '17 21 23',
      surface: '24 29 32',
      surface2: '33 39 43',
      fg: '235 240 242',
      muted: '152 164 170',
      border: '44 52 57',
    },
  },

  sage: {
    label: '苔灰',
    hint: '微绿灰，自然',
    light: {
      bg: '245 247 243',
      surface: '252 254 251',
      surface2: '236 240 233',
      fg: '23 28 23',
      muted: '99 109 97',
      border: '217 224 213',
    },
    dark: {
      bg: '18 21 18',
      surface: '25 29 25',
      surface2: '34 39 33',
      fg: '236 241 235',
      muted: '156 166 152',
      border: '45 52 43',
    },
  },

  sand: {
    label: '沙岩',
    hint: '偏黄暖沙，复古',
    light: {
      bg: '250 246 236',
      surface: '255 252 245',
      surface2: '244 237 223',
      fg: '32 27 18',
      muted: '124 111 88',
      border: '230 219 197',
    },
    dark: {
      bg: '24 21 15',
      surface: '32 28 20',
      surface2: '41 36 26',
      fg: '244 238 226',
      muted: '172 160 138',
      border: '53 46 34',
    },
  },

  graphite: {
    label: '石墨',
    hint: '纯中性灰，编辑风',
    light: {
      bg: '249 249 249',
      surface: '255 255 255',
      surface2: '241 241 241',
      fg: '17 17 17',
      muted: '112 112 112',
      border: '226 226 226',
    },
    dark: {
      bg: '16 16 16',
      surface: '23 23 23',
      surface2: '32 32 32',
      fg: '245 245 245',
      muted: '158 158 158',
      border: '45 45 45',
    },
  },
};

/** 手工挑过的强调色。全部是矿物 / 土色系，没有一个是 Tailwind 默认色。 */
export const ACCENT_SWATCHES = [
  { hex: '#B4552C', label: '赭石' },
  { hex: '#A8574A', label: '赤陶' },
  { hex: '#8E3B46', label: '酒红' },
  { hex: '#8F6A1E', label: '古铜' },
  { hex: '#2F6B4F', label: '松绿' },
  { hex: '#3A6B66', label: '青瓷' },
  { hex: '#2E4A63', label: '藏青' },
  { hex: '#44548C', label: '靛蓝' },
  { hex: '#6B4A7A', label: '紫棠' },
  { hex: '#33322E', label: '石墨' },
];

/**
 * 圆角档位。
 *
 * 每一档都要把 sm 到 3xl 全部给定 —— 只要漏掉一个键，
 * Tailwind 的 rounded-2xl 就会回落到内置值，出现「大部分圆角变了、
 * 少数几个没变」的割裂感。
 */
export const RADIUS_SCALES = {
  sharp: {
    label: '紧凑',
    hint: '硬朗，信息密度高',
    vars: { sm: '4px', r: '6px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '14px' },
  },
  default: {
    label: '标准',
    hint: '纸感的默认尺度',
    vars: { sm: '8px', r: '10px', md: '10px', lg: '12px', xl: '14px', '2xl': '18px', '3xl': '24px' },
  },
  soft: {
    label: '圆润',
    hint: '转角更柔和',
    vars: { sm: '10px', r: '12px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '30px' },
  },
};

/**
 * 字体栈。
 *
 * 只列系统已装或中文有真字形的字体，不引入任何网络字体 ——
 * 中文 webfont 动辄几 MB，为了一款字体拖慢首屏不值得。
 */
export const FONT_STACKS = {
  system: {
    label: '系统默认',
    hint: '黑体，零网络请求',
    stack:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif",
  },
  serif: {
    label: '宋体衬线',
    hint: '阅读感强，适合长文',
    stack:
      "'Songti SC', 'SimSun', 'Noto Serif CJK SC', 'Source Han Serif SC', ui-serif, Georgia, serif",
  },
  hei: {
    label: '现代黑体',
    hint: '中宫开阔，界面感',
    stack:
      "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-sans-serif, system-ui, sans-serif",
  },
  mono: {
    label: '等宽',
    hint: '代码与终端气质',
    stack: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Microsoft YaHei', monospace",
  },
};

/** 默认主题，也是「暖纸 + 墨」的原始设定。 */
export const DEFAULT_THEME = {
  presetId: 'paper-ochre',
  neutral: 'paper',
  accent: '#B4552C',
  radius: 'default',
  font: 'system',
};

/**
 * 预设主题。
 *
 * 每一套都是「中性色系 + 强调色 + 圆角 + 字体」的具体组合，
 * 而不是换一张预览图 —— 卡片里的预览就是用这些 token 真渲染出来的。
 */
export const PRESET_THEMES = [
  {
    id: 'paper-ochre',
    name: '暖纸 · 赭石',
    note: '默认。暖白纸底配单一赭石',
    neutral: 'paper',
    accent: '#B4552C',
    radius: 'default',
    font: 'system',
  },
  {
    id: 'linen-ink',
    name: '亚麻 · 墨',
    note: '近黑白，出版与编辑气质',
    neutral: 'linen',
    accent: '#33322E',
    radius: 'default',
    font: 'system',
  },
  {
    id: 'mist-navy',
    name: '雾青 · 藏青',
    note: '冷调，理性克制',
    neutral: 'mist',
    accent: '#2E4A63',
    radius: 'default',
    font: 'system',
  },
  {
    id: 'sage-pine',
    name: '苔灰 · 松绿',
    note: '自然绿意，不刺眼',
    neutral: 'sage',
    accent: '#2F6B4F',
    radius: 'default',
    font: 'system',
  },
  {
    id: 'sand-saffron',
    name: '沙岩 · 古铜',
    note: '复古暖调，手作感',
    neutral: 'sand',
    accent: '#8F6A1E',
    radius: 'default',
    font: 'system',
  },
  {
    id: 'graphite-flat',
    name: '石墨 · 硬边',
    note: '纯中性灰，锐利紧凑',
    neutral: 'graphite',
    accent: '#33322E',
    radius: 'sharp',
    font: 'system',
  },
  {
    id: 'paper-wine',
    name: '暖纸 · 酒红',
    note: '杂志感，衬线标题',
    neutral: 'paper',
    accent: '#8E3B46',
    radius: 'default',
    font: 'serif',
  },
  {
    id: 'linen-plum',
    name: '亚麻 · 紫棠',
    note: '低饱和紫，柔和',
    neutral: 'linen',
    accent: '#6B4A7A',
    radius: 'soft',
    font: 'system',
  },
  {
    id: 'mist-celadon',
    name: '雾青 · 青瓷',
    note: '清爽，青绿釉色',
    neutral: 'mist',
    accent: '#3A6B66',
    radius: 'default',
    font: 'hei',
  },
  {
    id: 'sand-clay',
    name: '沙岩 · 赤陶',
    note: '暖沙配陶土红',
    neutral: 'sand',
    accent: '#A8574A',
    radius: 'soft',
    font: 'serif',
  },
  {
    id: 'graphite-indigo',
    name: '石墨 · 靛蓝',
    note: '冷峻但不落俗套',
    neutral: 'graphite',
    accent: '#44548C',
    radius: 'sharp',
    font: 'system',
  },
  {
    id: 'sage-terracotta',
    name: '苔灰 · 赤陶',
    note: '绿灰配陶土，泥土气',
    neutral: 'sage',
    accent: '#A8574A',
    radius: 'default',
    font: 'hei',
  },
];
