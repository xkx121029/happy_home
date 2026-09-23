/** @type {import('tailwindcss').Config} */

// 设计方向：「暖纸 + 墨」。
// 刻意避开通用 SaaS 观感 —— 纯白底 + bg-gray-50 + shadow-sm + rounded-xl +
// 紫蓝渐变是 AI 生成界面最典型的组合。这里换成暖白纸质基底与单一赭石强调色。
//
// 两套色板并存，各司其职：
//   1. 语义 token（bg / surface / fg / muted / accent / success ...）
//      由 CSS 变量驱动，明暗模式自动切换，新代码一律用它，不必再写 dark: 前缀。
//   2. 覆盖 Tailwind 内置的 gray / primary（静态暖色阶）
//      全站已有数百处 bg-gray-50 / text-gray-600 / bg-primary-500 无需改一行 JSX
//      就变成新配色。这是把「换肤」从改 60 个文件降为改 1 个配置的关键。

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // 从 class 改为属性选择器：作用域挂在 <html> 上，
  // Portal 到 body 的弹窗/提示也能正确跟随主题。
  // （原来 class 挂在布局 div 上，Toast 与 Modal 脱离作用域，暗色下必然失真。）
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ---- 语义 token（CSS 变量，明暗自动切换）----
        // 必须用「空格分隔三元组 + <alpha-value>」，否则 bg-accent/10 这类
        // 透明度修饰符会失效。
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          fg: 'rgb(var(--c-accent-fg) / <alpha-value>)',
          50: 'rgb(var(--c-accent-50) / <alpha-value>)',
          100: 'rgb(var(--c-accent-100) / <alpha-value>)',
          200: 'rgb(var(--c-accent-200) / <alpha-value>)',
          600: 'rgb(var(--c-accent) / <alpha-value>)',
          700: 'rgb(var(--c-accent-700) / <alpha-value>)',
        },
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',

        // ---- 覆盖内置 gray 为暖灰阶（全站现有写法立刻变暖）----
        gray: {
          50: '#FAF7F3',
          100: '#F4EFE8',
          200: '#E8E0D6',
          300: '#D5C9BB',
          400: '#B3A598',
          500: '#8E8073',
          600: '#6E6156',
          700: '#554A41',
          800: '#332C25',
          900: '#1F1A15',
          950: '#16120E',
        },

        // ---- 覆盖 primary 为赭石阶 ----
        primary: {
          50: '#FDF4EF',
          100: '#FAE6DA',
          200: '#F3C9B1',
          300: '#E9A483',
          400: '#DB7C52',
          500: '#C96234',
          600: '#B4552C',
          700: '#94411F',
          800: '#77361D',
          900: '#612E1B',
        },

        // 暗色阶保留，但换成暖炭而不是原来的蓝黑(slate)
        dark: {
          50: '#F7F3EE',
          100: '#EDE6DD',
          200: '#DCD1C4',
          300: '#BEB0A0',
          400: '#9A8B7C',
          500: '#7A6B5D',
          600: '#5C5045',
          700: '#403830',
          800: '#2A241D',
          900: '#1A1512',
        },
      },

      fontFamily: {
        // 指向 CSS 变量而不是写死字体栈，主题页才能整体换字体。
        // 变量本身在 tokens.css 里给了默认值，所以不设主题时行为与原来完全一致。
        sans: ['var(--font-sans)'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // 正文基准 15px：中文密集后台一屏能多放约 8% 内容
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.55' }],
        base: ['15px', { lineHeight: '1.55' }],
        md: ['15px', { lineHeight: '1.55' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['22px', { lineHeight: '1.35' }],
        '2xl': ['28px', { lineHeight: '1.3' }],
        '3xl': ['36px', { lineHeight: '1.25' }],
      },

      borderRadius: {
        // 「纸」的意象对应偏小的圆角，刻意不做 rounded-2xl 的气泡感。
        // 全部指向变量，主题页可以整体切换锐利 / 标准 / 圆润。
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
        '3xl': 'var(--r-3xl)',
      },

      boxShadow: {
        // 用半透明阴影而非实线边框来区分层次
        sm: '0 1px 2px rgb(24 20 16 / 0.06)',
        DEFAULT: '0 1px 2px rgb(24 20 16 / 0.06), 0 1px 3px rgb(24 20 16 / 0.04)',
        md: '0 4px 12px -2px rgb(24 20 16 / 0.10), 0 2px 4px -2px rgb(24 20 16 / 0.06)',
        lg: '0 16px 40px -12px rgb(24 20 16 / 0.18)',
        none: 'none',
      },

      transitionTimingFunction: {
        // 强 ease-out：UI 入场唯一使用的曲线。
        // 内置的 ease-out 太弱，缺少「刻意感」；ease-in 一律禁用 —— 它起步慢，
        // 在用户最关注的瞬间延迟反馈，会让人觉得界面迟钝。
        entry: 'cubic-bezier(0.23, 1, 0.32, 1)',
        exit: 'cubic-bezier(0.77, 0, 0.175, 1)',
      },

      transitionDuration: {
        // 交互反馈时长的分档，硬上限 300ms
        press: '120ms',
        tip: '140ms',
        dialog: '180ms',
        section: '220ms',
      },
    },
  },
  plugins: [],
}