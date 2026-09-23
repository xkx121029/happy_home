import { cn } from '../../lib/cn';

/**
 * 页面标题区。
 *
 * 替换各页面顶部重复的
 * `<h1 className="text-2xl font-bold text-fg">` 加一行描述。
 * 标题用 22px / 600 字重：中文在 28px 以上加粗会显得笨重，
 * 而 600 比 700 更透气。
 */
export default function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-fg">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}