import { cn } from '../../lib/cn';

/**
 * 表单原语：Input / Textarea / Select / Checkbox / Switch / Field。
 *
 * 全站有 100+ 处手写的
 * className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ..."，
 * 各页面的边框色、焦点环、禁用态都有细微差别。统一到这里。
 *
 * 颜色全部走语义 token（bg-surface / text-fg / border-line / ring-accent），
 * 因此不需要 dark: 前缀 —— 明暗两套值由 CSS 变量切换。
 */

const FIELD_BASE = cn(
  'w-full bg-surface text-fg placeholder:text-muted/70',
  'border border-line rounded-lg',
  'transition-colors duration-100 ease-entry',
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
  'disabled:opacity-60 disabled:cursor-not-allowed',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger'
);

export function Input({ className, size = 'md', ...rest }) {
  return (
    <input
      className={cn(
        FIELD_BASE,
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm',
        className
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, rows = 4, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={cn(FIELD_BASE, 'px-3 py-2 text-sm resize-y leading-relaxed', className)}
      {...rest}
    />
  );
}

export function Select({ className, size = 'md', children, ...rest }) {
  return (
    <select
      className={cn(
        FIELD_BASE,
        'appearance-none pr-8',
        size === 'sm' ? 'h-8 pl-2.5 text-xs' : 'h-9 pl-3 text-sm',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, label, id, ...rest }) {
  const input = (
    <input
      id={id}
      type="checkbox"
      className={cn(
        'w-4 h-4 rounded border-line text-accent',
        'focus:ring-2 focus:ring-accent focus:ring-offset-0',
        className
      )}
      {...rest}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer">
      {input}
      {label}
    </label>
  );
}

/**
 * 开关。
 *
 * 滑块位移属于「状态指示」而不是入场动效，保留是合理的 ——
 * 用户需要一个连续可读的当前位置。轨道染色用 100ms 过渡，
 * 手快连点也不会显得拖沓。
 */
export function Switch({ checked, onChange, disabled = false, id, label }) {
  const control = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full',
        'transition-colors duration-100 ease-entry',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-accent' : 'bg-line'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm',
          'transition-transform duration-100 ease-entry',
          checked ? 'translate-x-[1.15rem]' : 'translate-x-[0.15rem]'
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <label htmlFor={id} className="inline-flex items-center gap-2.5 text-sm text-fg cursor-pointer">
      {control}
      {label}
    </label>
  );
}

/**
 * 表单字段容器：标签 + 说明 + 错误提示，并自动串好无障碍属性。
 * 原来各页面重复写着 label htmlFor 加一段红色错误文案。
 */
export function Field({ label, htmlFor, description, error, required, children, className }) {
  const describedBy = [
    description ? htmlFor + '-desc' : null,
    error ? htmlFor + '-err' : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {description && (
        <p id={htmlFor + '-desc'} className="text-xs text-muted">
          {description}
        </p>
      )}
      {typeof children === 'function'
        ? children({ id: htmlFor, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })
        : children}
      {error && (
        <p id={htmlFor + '-err'} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}