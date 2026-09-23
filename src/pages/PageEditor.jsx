import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';
import { useData } from '../contexts/DataContext';

export default function PageEditor() {
  const { pages, createPage, updatePage } = useData();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [pageId, setPageId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id && pages) {
      const fetchedPage = pages.find(p => p.id === parseInt(id) || p.id === id);
      if (fetchedPage) {
        setPageId(fetchedPage.id);
        setTitle(fetchedPage.title || '');
        setContent(fetchedPage.content || '');
        setSlug(fetchedPage.slug || '');
        setStatus(fetchedPage.status || 'draft');
      }
    }
  }, [id, pages]);

  useEffect(() => {
    if (!id) {
      setPageId(null);
      setTitle('');
      setContent('');
      setSlug('');
      setStatus('draft');
    }
  }, [id]);

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

  const handleSave = async () => {
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
    };
    
    try {
      if (pageId) {
        await updatePage(pageId, pageData);
      } else {
        await createPage(pageData);
      }
      navigate('/admin/pages');
    } catch (error) {
      console.error('保存页面失败:', error);
      alert('保存页面失败，请重试');
    }
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
            className="p-2 text-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-fg">
              {pageId ? '编辑页面' : '新建页面'}
            </h1>
            <p className="text-muted mt-1">创建和管理网站页面</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {status === 'published' ? '更新发布' : '保存草稿'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="输入页面标题..."
              className="w-full text-2xl font-bold text-fg border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
            />
            
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h3 className="font-semibold text-fg mb-4">页面设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-2">发布状态</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('draft')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors${status === 'draft' ? 'bg-warning text-warning-fg' : 'bg-surface-2 text-fg hover:bg-line'}`}
                  >
                    草稿
                  </button>
                  <button
                    onClick={() => setStatus('published')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors${status === 'published' ? 'bg-success text-success-fg' : 'bg-surface-2 text-fg hover:bg-line'}`}
                  >
                    发布
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-2">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted text-sm">/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="page-url"
                    className="flex-1 px-3 py-2 border border-line rounded-lg bg-surface  text-fg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-xs text-muted mt-2">
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
