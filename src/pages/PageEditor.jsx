import { useState } from 'react';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';

const statusOptions = [
  { id: 'draft', label: '草稿' },
  { id: 'published', label: '发布' },
];

export default function PageEditor({ page, onSave, onCancel }) {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [status, setStatus] = useState(page?.status || 'draft');
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const generateSlug = (titleStr) => {
    return titleStr
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!page) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = () => {
    const pageData = {
      id: page?.id || Date.now(),
      title,
      content,
      slug: slug || generateSlug(title),
      status,
      author: 'admin',
      createdAt: page?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    if (onSave) {
      onSave(pageData);
    }
    navigate('/admin/pages');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    navigate('/admin/pages');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {page ? '编辑页面' : '新建页面'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">创建和管理网站页面</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            {status === 'published' ? '更新' : '保存'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="输入页面标题..."
              className="w-full text-2xl font-bold text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
            />
            
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">页面设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">状态</label>
                <div className="flex gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setStatus(option.id)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === option.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="page-url"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  页面访问地址: http://localhost:3000/{slug || 'page-url'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <ContentPreview
          content={content}
          title={title}
          onClose={() => setShowPreview(false)}
          type="page"
        />
      )}
    </div>
  );
}
