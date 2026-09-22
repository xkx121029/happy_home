import { cn } from '../../lib/cn';

/**
 * 状态徽标。
 *
 * 替换 Posts / Categories / Tags / Comments 四个页面各写一遍的 getStatusBadge ——
 * 它们对同一个后端状态用的颜色和文案都不完全一致。
 *
 * 配色刻意降饱和：亮绿亮红那套在密集列表里非常刺眼，也最像模板生成的东西。
 */
const TONES = {
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
  accent: 'bg-accent/12 text-accent',
};

export default function StatusBadge({ tone = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}