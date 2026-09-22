import { cn } from '../../lib/cn';

/**
 * 卡片容器。
 *
 * 替换全站重复的 `bg-white rounded-xl shadow-sm border border-gray-100`。
 * 层次靠半透明阴影与极轻的分隔线表达，而不是深色实线边框 ——
 * 实线边框会让密集的列表页显得很吵。
 */
export function Card({ as: Tag = 'section', padding = 'md', interactive = false, className, children, ...rest }) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <Tag
      className={cn(
        'bg-surface border border-line rounded-lg shadow-sm',
        paddings[padding],
        interactive && 'transition-shadow duration-160 ease-entry hover:shadow-md',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-fg truncate">{title}</h2>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * 统计数字块。
 *
 * 刻意不用「彩色图标方块 + 大数字」的通用模板：数字本身用 28px 等宽字形承担
 * 视觉重量，标签弱化，靠排版层级而不是六种不同底色来区分。
 */
export function Stat({ label, value, hint, tone = 'default' }) {
  const toneClass = {
    default: 'text-fg',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }[tone] || 'text-fg';

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={cn('text-2xl font-semibold tabular-nums leading-none', toneClass)}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}
    </div>
  );
}

export default Card;