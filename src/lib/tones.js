/**
 * 全站共用的色调词汇表。
 *
 * 在此之前，Dashboard / Help / Notifications / Users / UserEditor / PasswordStrength
 * 各自写了一份颜色映射对象：同一个「警告」在六处是六种不同的调色板类名，
 * 既不一致，也不跟随主题。这里只保留 StatusBadge 已经在用的那六个词，
 * 任何需要「带颜色的状态」的地方都从这里取。
 *
 * 用法上注意：这些字符串是**整段类名**，拼进 className 时前面必须留空格，
 * 否则会拼成 `w-10 h-10bg-blue-500` 这种无效类名 —— 之前全站有 8 处是这么写的。
 */

/** 淡色底 + 同色文字：徽标、状态标签、图标底。 */
export const TONE_CHIP = {
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
  accent: 'bg-accent/12 text-accent',
};

/** 实心底 + 反色文字：实心按钮、强调图标。 */
export const TONE_SOLID = {
  neutral: 'bg-fg text-bg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  danger: 'bg-danger text-danger-fg',
  info: 'bg-info text-info-fg',
  accent: 'bg-accent text-accent-fg',
};

/** 纯文字色，用于图标与强调文字。 */
export const TONE_TEXT = {
  neutral: 'text-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-accent',
};

export function toneChip(tone) {
  return TONE_CHIP[tone] || TONE_CHIP.neutral;
}

export function toneSolid(tone) {
  return TONE_SOLID[tone] || TONE_SOLID.neutral;
}

export function toneText(tone) {
  return TONE_TEXT[tone] || TONE_TEXT.neutral;
}
