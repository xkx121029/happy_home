import { cn } from '../../lib/cn';
import { toneChip } from '../../lib/tones';

/**
 * 状态徽标。
 *
 * 替换 Posts / Categories / Tags / Comments 四个页面各写一遍的 getStatusBadge ——
 * 它们对同一个后端状态用的颜色和文案都不完全一致。
 *
 * 配色刻意降饱和：亮绿亮红那套在密集列表里非常刺眼，也最像模板生成的东西。
 * 色调定义统一放在 lib/tones.js，避免这里再抄一份。
 */
export default function StatusBadge({ tone = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        toneChip(tone),
        className
      )}
    >
      {children}
    </span>
  );
}