import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * 应用内弹窗与轻提示。
 *
 * 项目里有三套并存实现（本文件、hooks/useModal.js、components/Notification.jsx），
 * 行为层暂时保留不动（收尾阶段再合并），但**视觉与动效统一到这里** ——
 * 所有用 useModal 或其他方式渲染本组件的页面都会一起变，
 * 不需要逐页改动。
 *
 * 动效遵循两条硬规则：
 *   1. 只允许自下而上的入场：遮罩淡入 + 面板 translateY(8px) → 0。
 *      不用缩放入场（元素不会从天而降），更不能用横向滑入。
 *   2. 用 CSS transition 而不是 keyframes，这样快速连点关闭时动画能被中断、
 *      从当前位置平滑过渡，不会从头重放而显得卡顿。
 * 时长 180ms：弹窗属于偶发交互，可以比按压反馈长一点，但仍远低于 300ms 上限。
 */

const TONES = {
  info: { icon: Info, wrap: 'bg-info/12', icon_: 'text-info' },
  success: { icon: CheckCircle, wrap: 'bg-success/12', icon_: 'text-success' },
  warning: { icon: AlertTriangle, wrap: 'bg-warning/14', icon_: 'text-warning' },
  error: { icon: AlertCircle, wrap: 'bg-danger/12', icon_: 'text-danger' },
  confirm: { icon: AlertCircle, wrap: 'bg-accent/12', icon_: 'text-accent' },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  showCancel = true,
}) {
  // 打开时锁定背景滚动，关闭后恢复
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Esc 关闭：弹窗必须能被键盘关掉
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tone = TONES[type] || TONES.info;
  const Icon = tone.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || '提示'}
    >
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        style={{
          animation: 'none',
          opacity: 1,
          transition: 'opacity 180ms var(--ease-entry)',
        }}
      />
      {/* 面板保持 transform-origin: center —— 弹窗不锚定在任何触发元素上 */}
      <div
        className="relative bg-surface rounded-lg shadow-lg w-full max-w-md p-6 border border-line"
        style={{
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 180ms var(--ease-entry), transform 180ms var(--ease-entry)',
          animation: 'happyhome-dialog-in 180ms var(--ease-entry)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-100"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={cn('w-11 h-11 rounded-full grid place-items-center mx-auto mb-4', tone.wrap)}>
          <Icon className={cn('w-5 h-5', tone.icon_)} />
        </div>

        {title && (
          <h3 className="text-base font-semibold text-fg text-center mb-2">{title}</h3>
        )}

        <p className="text-sm text-muted text-center mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-line text-sm font-medium text-fg hover:bg-surface-2 transition-colors duration-100 active:scale-[0.97]"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={cn(
              'flex-1 h-9 rounded-lg text-sm font-medium transition-colors duration-100 active:scale-[0.97]',
              type === 'error'
                ? 'bg-danger text-danger-fg hover:opacity-90'
                : 'bg-accent text-accent-fg hover:bg-accent-700'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 轻提示。
 *
 * 从底部区域内自下而上出现（translateY(10px) → 0 + 淡入），
 * 而不是原来从右侧横向滑入 —— 横向滑动是被明确禁止的动效形式。
 * 位置也从右上角移到底部居中：底部更靠近用户的视线落点，
 * 且不会遮挡顶部的操作按钮。
 */
export function Toast({ isOpen, message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!isOpen || duration <= 0) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const tone = TONES[type] || TONES.info;
  const Icon = tone.icon;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface border border-line shadow-lg min-w-[240px] pointer-events-auto"
        style={{ animation: 'happyhome-toast-in 180ms var(--ease-entry)' }}
        role="status"
      >
        <Icon className={cn('w-4 h-4 shrink-0', tone.icon_)} />
        <span className="text-sm text-fg flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-fg transition-colors duration-100"
          aria-label="关闭提示"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}