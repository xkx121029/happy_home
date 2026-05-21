import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';
import { useData } from '../contexts/DataContext';

export default function PageEditor({ onSave }) {
  const { pagesAPI } = useData();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [pageId, setPageId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const fetchedPage = pagesAPI.getById(parseInt(id));
      if (fetchedPage) {
        setPageId(fetchedPage.id);
        setTitle(fetchedPage.title || '');
        setContent(fetchedPage.content || '');
        setSlug(fetchedPage.slug || '');
        setStatus(fetchedPage.status || 'draft');
      }
    }
  }, [id, pagesAPI]);

  const generateSlug = (titleStr) => {
    return titleStr
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!pageId) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入页面标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入页面内容');
      return;
    }
    
    const pageData = {
      title,
      content,
      slug: slug || generateSlug(title),
      status,
      author: 'admin',
    };
    
    if (onSave) {
      onSave({ ...pageData, id: pageId });
    }
    navigate('/admin/pages');
  };

  const handleCancel = () => {
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
              {pageId ? '编辑页面' : '新建页面'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">创建和管理网站页面</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {status === 'published' ? '更新发布' : '保存草稿'}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">发布状态</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('draft')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'draft' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    草稿
                  </button>
                  <button
                    onClick={() => setStatus('published')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'published' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    发布
                  </button>
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
                  页面访问地址: /{slug || 'page-url'}
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
