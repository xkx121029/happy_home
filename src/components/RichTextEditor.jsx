import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Image, Heading1, Heading2, Quote, Code, Strikethrough, Minus, Undo, Redo } from 'lucide-react';

const toolbarButtons = [
  { icon: Undo, command: 'undo', title: '撤销' },
  { icon: Redo, command: 'redo', title: '重做' },
  { type: 'divider' },
  { icon: Heading1, command: 'formatBlock', value: 'h1', title: '标题1' },
  { icon: Heading2, command: 'formatBlock', value: 'h2', title: '标题2' },
  { type: 'divider' },
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
  { icon: Code, command: 'formatBlock', value: 'pre', title: '代码块' },
  { type: 'divider' },
  { icon: Link, command: 'createLink', title: '插入链接' },
  { icon: Image, command: 'insertImage', title: '插入图片' },
];

export default function RichTextEditor({ value, onChange, placeholder = '开始编写内容...' }) {
  const editorRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (editorRef.current && isFirstRender.current && value) {
      editorRef.current.innerHTML = value;
      isFirstRender.current = false;
    }
  }, [value]);

  const executeCommand = (command, value = null) => {
    if (command === 'createLink') {
      const url = prompt('请输入链接地址：');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertImage') {
      const url = prompt('请输入图片地址：');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
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
      }
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        {toolbarButtons.map((btn, index) => (
          btn.type === 'divider' ? (
            <div key={index} className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
          ) : (
            <button
              key={index}
              type="button"
              onClick={() => executeCommand(btn.command, btn.value)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={btn.title}
            >
              {(() => {
                const Icon = btn.icon;
                return <Icon className="w-4 h-4" />;
              })()}
            </button>
          )
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[400px] p-4 focus:outline-none text-gray-900 dark:text-gray-100 dark:bg-gray-800"
        data-placeholder={placeholder}
      />
    </div>
  );
}
