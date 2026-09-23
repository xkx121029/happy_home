import { cn } from '../../lib/cn';

/**
 * 按钮。
 *
 * 替换全站手写的蓝色按钮 —— 原来每处都是
 * `className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700 ..."`，
 * 各页面的内边距、圆角、禁用态、加载态还都不一致。
 *
 * 交互细节：按下时 scale(0.97)。这是让界面「有回应」最便宜也最有效的一招 ——
 * 用户按下按钮到松开之间必须有反馈，否则会怀疑是不是没点到。
 * 缩放幅度取 0.97 而不是更小：再小就会有「弹跳感」，与后台工具的定位不符。
 */

const VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-700',
  secondary: 'bg-surface-2 text-fg hover:bg-line',
  outline: 'border border-line text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-danger-fg hover:opacity-90',
  link: 'text-accent hover:opacity-80 underline-offset-4 hover:underline',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className,
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap',
        'transition-[transform,background-color,color,opacity] duration-100 ease-entry',
        'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      ) : (
        IconLeft && <IconLeft className="w-4 h-4 shrink-0" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}