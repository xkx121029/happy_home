import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Eye, Calendar, Tag, Pin, Clock, History, RotateCcw, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';
import { sanitizeHtml } from '../lib/sanitize';

export default function PostEditor() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  const { id } = useParams();
  // 原来保存走 props.onSave 回调，现在页面自取 Context 的语义化方法
  const { posts, getPost, categories, createPost, updatePost } = useData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [postId, setPostId] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [publishType, setPublishType] = useState('now');
  const [publishDate, setPublishDate] = useState('');
  const [showRevisions, setShowRevisions] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const postIdNum = parseInt(id, 10);
      
      const fetchedPost = posts.find(p => {
        const postId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
        return postId === postIdNum;
      });
      
      if (fetchedPost) {
        setPostId(fetchedPost.id);
        setTitle(fetchedPost.title || '');
        setContent(fetchedPost.content || '');
        setExcerpt(fetchedPost.excerpt || '');
        setCategory(fetchedPost.category || categories[0]);
        setTags(fetchedPost.tags || []);
        setIsPublished(fetchedPost.status === 'published');
        setIsSticky(fetchedPost.sticky || false);
        if (fetchedPost.status === 'future') {
          setPublishType('scheduled');
          setPublishDate(fetchedPost.publishDate || '');
        }
      } else {
        // 本地列表里找不到这篇文章：可能是文章还没加载完，或者链接指向了不存在的 id。
        // 原来这里只打一行 console.log 就结束了，用户看到的是一个空白编辑器，
        // 完全不知道发生了什么。实际上面的 useEffect 会在 posts 加载完后重试。
      }
    }
  }, [id, posts]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const createRevisionIfNeeded = () => {
    // 修订功能暂未实现
  };

  // 原来保存走 props.onSave 回调，现在页面自取 Context，成功后再跳转列表
  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updatePost(data.id, data);
      } else {
        await createPost(data);
      }
      showToast('文章已保存', 'success');
      navigate('/admin/posts');
    } catch (err) {
      showToast(err.message || '保存失败', 'error');
    }
  };

  const handleSaveDraft = async () => {
    createRevisionIfNeeded();
    const postData = {
      title: title || '无标题',
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').slice(0, 100) + '...',
      status: 'draft',
      publishDate: null,
      category,
      tags,
      sticky: isSticky,
      author: 'admin',
    };

    await handleSave({ ...postData, id: postId });
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      await alert('请输入文章标题', 'warning');
      return;
    }
    if (!content.trim()) {
      await alert('请输入文章内容', 'warning');
      return;
    }
    if (publishType === 'scheduled' && !publishDate) {
      await alert('请选择定时发布时间', 'warning');
      return;
    }

    createRevisionIfNeeded();
    const postData = {
      title,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').slice(0, 100) + '...',
      status: publishType === 'scheduled' ? 'future' : 'published',
      publishDate: publishType === 'scheduled' ? publishDate : null,
      category,
      tags,
      sticky: isSticky,
      author: 'admin',
    };

    await handleSave({ ...postData, id: postId });
  };

  const handleRestoreRevision = async (revision) => {
    const confirmed = await confirm({
      title: '确认恢复',
      message: '确定要恢复到该修订版本吗？',
    });
    if (confirmed) {
      setTitle(revision.title);
      setContent(revision.content);
      setExcerpt(revision.excerpt);
      setSelectedRevision(null);
      setShowRevisions(false);
      showToast('修订功能暂未实现', 'warning');
    }
  };

  const handleCancelClick = () => {
    navigate('/admin/posts');
  };

  return (
    <>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancelClick}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {postId ? '编辑文章' : '新建文章'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">创建精彩内容，分享您的故事</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {postId && (
            <button
              onClick={() => setShowRevisions(true)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              修订
            </button>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPublished ? '更新发布' : '发布'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              className="w-full text-2xl font-bold text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
            />
            
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">文章设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name || cat}>{cat.name || cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100">
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="输入标签后按回车添加"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">摘要</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要，将显示在文章列表中..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">发布信息</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>创建日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>更新日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span>作者: admin</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>置顶文章</span>
                <button
                  onClick={() => setIsSticky(!isSticky)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSticky ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSticky ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  publishType === 'scheduled' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                  isPublished ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {publishType === 'scheduled' ? '定时发布' : isPublished ? '已发布' : '草稿'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">发布选项</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="publishNow"
                  name="publishType"
                  checked={publishType === 'now'}
                  onChange={() => setPublishType('now')}
                  className="w-4 h-4 text-blue-500"
                />
                <label htmlFor="publishNow" className="text-sm text-gray-700 dark:text-gray-300">
                  立即发布
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="publishScheduled"
                  name="publishType"
                  checked={publishType === 'scheduled'}
                  onChange={() => setPublishType('scheduled')}
                  className="w-4 h-4 text-blue-500"
                />
                <label htmlFor="publishScheduled" className="text-sm text-gray-700 dark:text-gray-300">
                  定时发布
                </label>
              </div>
              {publishType === 'scheduled' && (
                <div className="pl-7">
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <ContentPreview
          content={content}
          title={title}
          onClose={() => setShowPreview(false)}
          type="article"
        />
      )}

      {showRevisions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">修订历史</h2>
              <button
                onClick={() => {
                  setShowRevisions(false);
                  setSelectedRevision(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex h-[calc(80vh-140px)]">
              <div className="w-1/3 border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
                {revisions.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {revisions.map((revision) => (
                      <button
                        key={revision.id}
                        onClick={() => setSelectedRevision(revision)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedRevision?.id === revision.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {revision.title.substring(0, 30)}{revision.title.length > 30 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(revision.createdAt).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    暂无修订记录
                  </div>
                )}
              </div>
              <div className="w-2/3 p-6 overflow-y-auto">
                {selectedRevision ? (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      {selectedRevision.title}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                      <span>修订时间: {new Date(selectedRevision.createdAt).toLocaleString()}</span>
                      <span>|</span>
                      <span>作者: {selectedRevision.author}</span>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedRevision.content) }} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleRestoreRevision(selectedRevision)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        恢复到该版本
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    选择一个修订版本查看详情
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.showCancel}
      />

      <Toast
        isOpen={isToastOpen}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={closeToast}
        duration={toastConfig.duration}
      />
    </div>
    </>
  );
}
