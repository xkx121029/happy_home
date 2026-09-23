import { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
  Link, Image, Heading1, Heading2, Heading3, Quote, Code, Strikethrough, Minus, 
  Undo, Redo, Link2Off, Type, X, Terminal, FolderOpen
} from 'lucide-react';
import { useNotification } from './Notification';

const toolbarButtons = [
  { icon: Undo, command: 'undo', title: '撤销 (Ctrl+Z)' },
  { icon: Redo, command: 'redo', title: '重做 (Ctrl+Y)' },
  { type: 'divider' },
  { icon: Heading1, command: 'formatBlock', value: 'h1', title: '标题1' },
  { icon: Heading2, command: 'formatBlock', value: 'h2', title: '标题2' },
  { icon: Heading3, command: 'formatBlock', value: 'h3', title: '标题3' },
  { type: 'divider' },
  { icon: Type, command: 'formatBlock', value: 'p', title: '正文' },
  { icon: Bold, command: 'bold', title: '粗体 (Ctrl+B)' },
  { icon: Italic, command: 'italic', title: '斜体 (Ctrl+I)' },
  { icon: Underline, command: 'underline', title: '下划线 (Ctrl+U)' },
  { icon: Strikethrough, command: 'strikeThrough', title: '删除线' },
  { type: 'divider' },
  { icon: List, command: 'insertUnorderedList', title: '无序列表' },
  { icon: ListOrdered, command: 'insertOrderedList', title: '有序列表' },
  { type: 'divider' },
  { icon: AlignLeft, command: 'justifyLeft', title: '左对齐' },
  { icon: AlignCenter, command: 'justifyCenter', title: '居中对齐' },
  { icon: AlignRight, command: 'justifyRight', title: '右对齐' },
  { type: 'divider' },
  { icon: Minus, command: 'insertHorizontalRule', title: '分隔线' },
  { icon: Quote, command: 'formatBlock', value: 'blockquote', title: '引用' },
];

export default function RichTextEditor({ value, onChange, placeholder = '开始编写内容...' }) {
  const { warning } = useNotification();
  const editorRef = useRef(null);
  const isFirstRender = useRef(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('');

  useEffect(() => {
    if (editorRef.current && isFirstRender.current && value) {
      editorRef.current.innerHTML = value;
      isFirstRender.current = false;
    }
  }, [value]);

  const executeCommand = (command, cmdValue = null) => {
    // 只打开弹窗的命令，不需要触发内容更新
    if (command === 'createLink') {
      setShowLinkModal(true);
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        setLinkText(selectedText);
      }
      return; // 不触发内容更新
    } else if (command === 'insertImage') {
      setShowImageModal(true);
      return; // 不触发内容更新
    } else if (command === 'insertCodeBlock') {
      setShowCodeModal(true);
      return; // 不触发内容更新
    } else if (command === 'removeLink') {
      document.execCommand('unlink', false, null);
    } else {
      document.execCommand(command, false, cmdValue);
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl) {
      warning('请输入链接地址');
      return;
    }
    
    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    const selection = window.getSelection();
    let linkTextToUse = linkText.trim() || finalUrl;
    
    // 创建链接元素
    const anchor = document.createElement('a');
    anchor.href = finalUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = linkTextToUse;
    anchor.style.color = '#3b82f6';
    anchor.style.textDecoration = 'underline';
    
    // 聚焦编辑器
    editorRef.current.focus();
    
    // 检查是否有选中文本
    if (selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(anchor);
      // 将光标移到链接后面
      range.collapse(false);
    } else {
      // 没有选中文本，直接插入链接
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // 在末尾插入链接
      editorRef.current.appendChild(anchor);
      editorRef.current.appendChild(document.createElement('br'));
    }
    
    // 关闭弹窗并重置状态
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    
    // 通知内容更新
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = () => {
    if (!imageUrl) {
      warning('请输入图片地址');
      return;
    }
    
    let finalUrl = imageUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    const img = document.createElement('img');
    img.src = finalUrl;
    img.alt = imageAlt.trim() || '图片';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1rem 0';
    img.style.borderRadius = '0.5rem';
    
    // 聚焦编辑器
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.collapse(false);
    } else {
      // 没有选区，在末尾插入
      editorRef.current.appendChild(img);
      editorRef.current.appendChild(document.createElement('br'));
    }
    
    // 关闭弹窗并重置状态
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    
    // 通知内容更新
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertCodeBlock = () => {
    if (codeContent && codeContent.trim()) {
      const pre = document.createElement('pre');
      pre.style.cssText = `
        background-color: #1e293b;
        color: #e2e8f0;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 1rem 0;
      `;
      
      const code = document.createElement('code');
      if (codeLanguage) {
        code.className = `language-${codeLanguage}`;
      }
      code.textContent = codeContent;
      
      pre.appendChild(code);
      
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(pre);
        range.collapse(false);
      } else {
        editorRef.current.appendChild(pre);
        editorRef.current.appendChild(document.createElement('br'));
      }
      
      setShowCodeModal(false);
      setCodeContent('');
      setCodeLanguage('');
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      } else if (e.key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      } else if (e.key === 'k') {
        e.preventDefault();
        executeCommand('createLink');
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const html = e.dataTransfer.getData('text/html');
    
    if (html) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const img = temp.querySelector('img');
      if (img && img.src) {
        const newImg = document.createElement('img');
        newImg.src = img.src;
        newImg.alt = img.alt || '图片';
        newImg.style.maxWidth = '100%';
        newImg.style.height = 'auto';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(newImg);
        }
        
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
        return;
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-surface">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-bg  border-b border-line">
        {toolbarButtons.map((btn, index) => (
          btn.type === 'divider' ? (
            <div key={`divider-${index}`} className="w-px h-6 bg-line mx-1" />
          ) : (
            <button
              key={`btn-${index}`}
              type="button"
              onClick={() => executeCommand(btn.command, btn.value)}
              className="p-2 text-muted  hover:text-fg hover:bg-surface-2 rounded transition-colors"
              title={btn.title}
            >
              {(() => {
                const Icon = btn.icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </button>
          )
        ))}
        
        {/* 链接按钮组 */}
        <div className="w-px h-6 bg-line mx-1" />
        <button
          type="button"
          onClick={() => executeCommand('createLink')}
          className="p-2 text-muted  hover:text-accent hover:bg-surface-2 rounded transition-colors"
          title="插入链接 (Ctrl+K)"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('removeLink')}
          className="p-2 text-muted  hover:text-danger hover:bg-surface-2 rounded transition-colors"
          title="移除链接"
        >
          <Link2Off className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertImage')}
          className="p-2 text-muted  hover:text-info hover:bg-surface-2 rounded transition-colors"
          title="插入图片"
        >
          <Image className="w-4 h-4" />
        </button>
        
        {/* 代码块按钮 */}
        <div className="w-px h-6 bg-line mx-1" />
        <button
          type="button"
          onClick={() => executeCommand('insertCodeBlock')}
          className="p-2 text-muted  hover:text-success hover:bg-surface-2 rounded transition-colors"
          title="插入代码块"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>

      {/* 编辑器内容区 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="min-h-[400px] p-4 focus:outline-none text-fg bg-surface"
        data-placeholder={placeholder}
      />

      {/* 链接弹窗 */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-fg">插入链接</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-muted hover:text-fg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1">链接文本</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="输入链接显示文本"
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1">链接地址</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2 border border-line text-fg rounded-lg hover:bg-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleInsertLink}
                  disabled={!linkUrl}
                  className="flex-1 px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  插入链接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片弹窗 */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-fg">插入图片</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-muted hover:text-fg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1">图片地址</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1">图片描述（可选）</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="图片描述文字"
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 px-4 py-2 border border-line text-fg rounded-lg hover:bg-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleInsertImage}
                  disabled={!imageUrl}
                  className="flex-1 px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  插入图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 代码块弹窗 */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-fg">插入代码块</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-muted hover:text-fg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1">编程语言（可选）</label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">自动检测</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1">代码内容</label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="在这里输入代码..."
                  rows={10}
                  className="w-full px-3 py-2 border border-line rounded-lg bg-bg text-line font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="flex-1 px-4 py-2 border border-line text-fg rounded-lg hover:bg-surface-2"
                >
                  取消
                </button>
                <button
                  onClick={handleInsertCodeBlock}
                  className="flex-1 px-4 py-2 bg-success text-success-fg rounded-lg hover:bg-success"
                >
                  插入代码
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
