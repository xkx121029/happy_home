import { cn } from '../lib/cn';
import { themeVars } from '../theme/apply';

/**
 * 主题预览。
 *
 * 预览内容不是一张示意图，而是用主题真实 token 渲染出来的迷你站点 ——
 * 同一份 themeVars 计算结果既喂给这里，也喂给全站样式表，
 * 所以「预览里看到的」和「保存后得到的」不可能出现偏差。
 *
 * 原实现用的是三张 Unsplash 风景照当作主题缩略图。那既不反映配色，
 * 也和实际效果毫无关系 —— 换主题只是换了一张照片而已。
 *
 * 变量通过 style 挂在最外层元素上，靠 CSS 自定义属性的继承性向下传递，
 * 因此内部可以直接写 bg-surface / text-muted / rounded-lg 这些工具类，
 * 它们会解析成这个预览自己的值，不会影响页面其它部分。
 */
export default function ThemePreview({
  theme,
  mode = 'light',
  siteName = 'HappyHome',
  framed = true,
  className,
}) {
  return (
    <div
      style={themeVars(theme, mode)}
      className={cn(
        'bg-bg text-fg font-sans select-none',
        framed && 'rounded-lg border border-line overflow-hidden',
        className
      )}
    >
      <div className="px-4 pt-3.5 pb-4">
        {/* 站点头部 */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-accent" />
            <span className="text-[13px] font-semibold tracking-tight truncate">{siteName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-muted">文章</span>
            <span className="text-[11px] text-muted">归档</span>
            <span className="text-[11px] text-muted">关于</span>
          </div>
        </div>

        {/* 标题与正文 */}
        <h3 className="mt-4 text-[17px] font-semibold leading-snug">把内容做薄，把阅读做厚</h3>
        <p className="mt-1.5 text-[11px] text-muted leading-relaxed">
          正文样例，用来确认行高、次要文字与背景的实际对比度。
        </p>

        {/* 按钮：主按钮吃强调色，次按钮只靠描边 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-accent text-accent-fg text-[11px] font-medium">
            开始阅读
          </span>
          <span className="px-2.5 py-1 rounded-lg border border-line text-[11px]">订阅更新</span>
        </div>

        {/* 卡片与标签 */}
        <div className="mt-4 rounded-lg border border-line bg-surface p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium">卡片标题</span>
            <span className="px-1.5 py-0.5 rounded bg-accent-50 text-accent text-[10px]">标签</span>
          </div>
          <div className="mt-2 space-y-1.5">
            <span className="block h-1.5 w-full rounded-full bg-surface-2" />
            <span className="block h-1.5 w-3/5 rounded-full bg-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
