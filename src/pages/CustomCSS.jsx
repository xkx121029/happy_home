import { useState, useEffect } from 'react';
import {
  Code, Save, RotateCcw, Eye, EyeOff, AlertCircle, Check,
  Copy, Trash2, FileText, Terminal, Settings, PanelBottom
} from 'lucide-react';
import { useNotification } from '../components/Notification';
import { useSiteSettings } from '../state/SiteSettingsContext';
import Modal from '../components/Modal';

const cssSnippets = [
  { label: '自定义字体大小', code: `/* 自定义字体大小 */
body {
  font-size: 18px;
  line-height: 1.8;
}` },
  { label: '自定义链接颜色', code: `/* 自定义链接颜色 */
a {
  color: #3b82f6;
  text-decoration: none;
}

a:hover {
  color: #2563eb;
  text-decoration: underline;
}` },
  { label: '自定义标题样式', code: `/* 自定义标题样式 */
h1, h2, h3 {
  font-weight: 600;
  color: #1f2937;
}

h1 {
  font-size: 2.5rem;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 0.5rem;
}` },
  { label: '自定义代码块', code: `/* 自定义代码块样式 */
pre {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', 'Consolas', monospace;
}` },
  { label: '自定义卡片样式', code: `/* 自定义卡片样式 */
.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}` },
  { label: '自定义按钮样式', code: `/* 自定义按钮样式 */
.btn {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}` },
  { label: '图片圆角阴影', code: `/* 图片圆角阴影 */
img {
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}` },
  { label: '滚动条样式', code: `/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}` },
];

const jsSnippets = [
  { label: '页面加载动画', code: `// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});` },
  { label: '返回顶部按钮', code: `// 返回顶部按钮
window.onscroll = function() {
  if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
    document.getElementById('backToTop').style.display = 'block';
  } else {
    document.getElementById('backToTop').style.display = 'none';
  }
};` },
  { label: '控制台日志', code: `// 自定义控制台样式
console.log('%c HappyHome ', 'background: #3b82f6; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');` },
];

export default function CustomCSS() {
  const { success, error } = useNotification();
  const { settings, updateSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState('css');
  const [customCSS, setCustomCSS] = useState('');
  const [customJS, setCustomJS] = useState('');
  const [customHead, setCustomHead] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [cssError, setCssError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // 原来这里读写的是 localStorage（happyhome_custom_css / _js / _head），
  // 而设置页的「自定义代码」写的是数据库 —— 两套互不通气，改哪边都只生效一半，
  // 换台电脑还会丢。现在统一以数据库里的 settings 为唯一真源。
  useEffect(() => {
    setCustomCSS(settings?.customCSS || '');
    setCustomJS(settings?.customJS || '');
    setCustomHead(settings?.headCode || '');
    setCustomFooter(settings?.footerCode || '');
  }, [settings?.customCSS, settings?.customJS, settings?.headCode, settings?.footerCode]);

  const handleCSSChange = (value) => {
    setCustomCSS(value);
    setHasChanges(true);
    validateCSS(value);
  };

  const handleJSChange = (value) => {
    setCustomJS(value);
    setHasChanges(true);
  };

  const handleHeadChange = (value) => {
    setCustomHead(value);
    setHasChanges(true);
  };

  const handleFooterChange = (value) => {
    setCustomFooter(value);
    setHasChanges(true);
  };

  const validateCSS = (css) => {
    if (!css.trim()) {
      setCssError('');
      return true;
    }

    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      setCssError('CSS 语法错误：大括号不匹配');
      return false;
    }

    const openParens = (css.match(/\(/g) || []).length;
    const closeParens = (css.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      setCssError('CSS 语法错误：括号不匹配');
      return false;
    }

    setCssError('');
    return true;
  };

  const handleSave = async () => {
    // 原来保存前完全不校验，写坏一个括号也不提示，前台整段样式静默失效
    if (!validateCSS(customCSS)) {
      error('自定义 CSS 有大括号或括号不匹配，请先修正');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        customCSS,
        customJS,
        headCode: customHead,
        footerCode: customFooter,
      });
      setHasChanges(false);
      setSaved(true);
      success('自定义代码已保存，前台立即生效');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfirmModal({
      isOpen: true,
      title: '确认清空',
      message: '确定要清空所有自定义代码吗？',
      onConfirm: async () => {
        try {
          await updateSettings({ customCSS: '', customJS: '', headCode: '', footerCode: '' });
          setCustomCSS('');
          setCustomJS('');
          setCustomHead('');
          setCustomFooter('');
          setHasChanges(false);
          success('已清空所有自定义代码');
        } catch (err) {
          error(err.message || '清空失败');
        }
      }
    });
  };

  const handleInsertSnippet = (snippet) => {
    if (activeTab === 'css') {
      setCustomCSS(prev => prev + '\n\n' + snippet.code);
    } else if (activeTab === 'js') {
      setCustomJS(prev => prev + '\n\n' + snippet.code);
    }
    setHasChanges(true);
  };

  const tabs = [
    { id: 'css', label: '自定义 CSS', icon: Code },
    { id: 'js', label: '自定义 JS', icon: Terminal },
    { id: 'head', label: 'Head 代码', icon: Settings },
    { id: 'footer', label: '页脚代码', icon: PanelBottom },
  ];

  const currentSnippets = activeTab === 'css' ? cssSnippets : activeTab === 'js' ? jsSnippets : [];

  const editorValue = {
    css: customCSS,
    js: customJS,
    head: customHead,
    footer: customFooter,
  }[activeTab] ?? '';

  const editorPlaceholder = {
    css: '/* 在这里输入自定义 CSS 代码 */\n\n例如：\nbody {\n  font-family: "Microsoft YaHei", sans-serif;\n}',
    js: '// 在这里输入自定义 JavaScript 代码\n\n例如：\ndocument.addEventListener("DOMContentLoaded", function() {\n  console.log("页面加载完成");\n});',
    head: '<!-- 在这里输入要添加到 <head> 的代码 -->\n\n例如：\n<link rel="stylesheet" href="external.css">\n<script src="external.js"></script>',
    footer: '<!-- 在这里输入要添加到 </body> 之前的代码 -->\n\n例如：\n<script src="statistics.js"></script>',
  }[activeTab] || '';

  const handleEditorChange = (value) => {
    if (activeTab === 'css') handleCSSChange(value);
    else if (activeTab === 'js') handleJSChange(value);
    else if (activeTab === 'head') handleHeadChange(value);
    else handleFooterChange(value);
  };

  return (
    <>
      <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">自定义样式</h1>
          <p className="text-muted mt-1">添加自定义 CSS、JavaScript 和 Head 代码</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-muted  hover:bg-surface-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-muted  hover:bg-surface-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2${
              hasChanges && !saving
                ? 'bg-accent text-accent-fg hover:bg-accent-700'
                : 'bg-surface-2 text-muted cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中…' : saved ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-line">
        <nav className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-fg hover:border-line'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`grid gap-6${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
          {/* Snippets Panel */}
          {currentSnippets.length > 0 && (
            <div className="p-4 border-b border-line">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted" />
                <span className="text-sm font-medium text-fg">
                  常用代码片段
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSnippets.map((snippet) => (
                  <button
                    key={snippet.label}
                    onClick={() => handleInsertSnippet(snippet)}
                    className="px-3 py-1.5 text-xs bg-surface-2 text-muted  rounded-lg hover:bg-line transition-colors flex items-center gap-1"
                  >
                    <Code className="w-3 h-3" />
                    {snippet.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="relative">
            <textarea
              value={editorValue}
              onChange={(e) => handleEditorChange(e.target.value)}
              placeholder={editorPlaceholder}
              className={`w-full h-96 p-4 font-mono text-sm bg-surface-2 text-fg border border-line rounded-lg resize-none focus:outline-none${
                activeTab === 'css' ? 'font-mono' : ''
              }`}
              spellCheck={false}
            />

            {/* CSS Error */}
            {activeTab === 'css' && cssError && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-danger/90 text-danger-fg rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {cssError}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-bg  border-t border-line flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>编码: UTF-8</span>
              {activeTab === 'css' && (
                <span className={cssError ? 'text-danger' : 'text-success'}>
                  {cssError || '语法正确'}
                </span>
              )}
            </div>
            <div className="text-xs text-muted">
              {(activeTab === 'css' ? customCSS : activeTab === 'js' ? customJS : customHead).length} 字符
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
            <div className="p-4 border-b border-line flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted" />
              <span className="text-sm font-medium text-fg">预览</span>
            </div>
            <div className="p-4 bg-bg">
              <div className="bg-surface p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-fg mb-2">
                  样式预览
                </h3>
                <p className="text-muted  mb-4">
                  这里的文本将应用您的自定义 CSS 样式。
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700">
                    按钮
                  </button>
                  <a href="#" className="px-4 py-2 text-accent hover:text-accent">
                    链接
                  </a>
                </div>
                <pre className="mt-4 p-3 bg-surface-2 border border-line text-fg rounded-lg text-sm overflow-x-auto">
                  <code>{"code { color: #333; }"}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="mt-6 bg-warning/14  border border-warning/40  rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-medium text-warning mb-1">
              使用提示
            </h3>
            <ul className="text-sm text-warning space-y-1">
              <li>• 自定义 CSS 会应用于前台页面的所有页面</li>
              <li>• 自定义 JS 会添加到页面底部 </li>
              <li>• Head 代码会添加到 &lt;head&gt; 标签内，可用于引入外部样式或脚本</li>
              <li>• 请谨慎使用，确保代码语法正确</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <Modal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      title={confirmModal.title}
      message={confirmModal.message}
      type="confirm"
      onConfirm={confirmModal.onConfirm}
    />
    </>
  );
}
