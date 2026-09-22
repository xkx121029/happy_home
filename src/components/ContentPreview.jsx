import { X, ExternalLink } from 'lucide-react';
import { sanitizeHtml } from '../lib/sanitize';

export default function ContentPreview({ content, title, onClose, type = 'article' }) {
  // 这里原先直接把内容塞进 dangerouslySetInnerHTML，没有任何净化。
  // 预览的是编辑器里正在写的内容，同样可能是从别处粘贴进来的 HTML。
  const safeContent = sanitizeHtml(content);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">内容预览</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {type === 'article' && (
            <article className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{title || '无标题'}</h1>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            </article>
          )}

          {type === 'page' && (
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{title || '无标题'}</h1>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            这是内容预览，实际发布后可能会有所不同
          </p>
        </div>
      </div>
    </div>
  );
}
