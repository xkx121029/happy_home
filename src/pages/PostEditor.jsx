import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Eye, Calendar, Tag, Pin, Clock, History, RotateCcw, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { sanitizeHtml } from '../lib/sanitize';
import { toDateTimeInputValue, formatDateTime } from '../lib/format';
import { revisionsAPI } from '../services/api';

export default function PostEditor() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  const { settings } = useSiteSettings();
  const timeZone = settings?.timezone;
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
          // 库里存的是 UTC，输入框要的是站点时区的墙上时间
          setPublishDate(toDateTimeInputValue(fetchedPost.publishDate, timeZone));
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

  // 快照由后端在 PUT 里写（只在正文真的变了时记），前端不需要做任何事。
  // 这里原本留了一个空的 createRevisionIfNeeded 并在两处调用，是误导 —— 删掉。

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

  const loadRevisions = async (targetPostId) => {
    try {
      const response = await revisionsAPI.listForPost(targetPostId);
      setRevisions(response.data || []);
    } catch (err) {
      setRevisions([]);
      showToast(err.message || '加载修订记录失败', 'error');
    }
  };

  /**
   * 回滚。
   *
   * 原来只改本地 state 再弹一句「暂未实现」—— 页面看着变了，库里一点没动，
   * 刷新就还原。现在打真实端点：后端会先把当前版本留档，再覆盖回去，
   * 所以「点错了」也能再滚回来。
   */
  const handleRestoreRevision = async (revision) => {
    const confirmed = await confirm({
      title: '确认恢复',
      message: `将把标题与正文回滚到 ${formatDateTime(revision.createdAt, timeZone)} 的版本。当前内容会先自动留一份快照，可以再回滚回来。`,
      confirmText: '恢复',
    });
    if (!confirmed) return;

    try {
      const response = await revisionsAPI.restore(revision.id);
      const restored = response.data;
      if (restored) {
        setTitle(restored.title || '');
        setContent(restored.content || '');
        setExcerpt(restored.excerpt || '');
      }
      setSelectedRevision(null);
      setShowRevisions(false);
      if (postId) await loadRevisions(postId);
      showToast('已恢复到该版本', 'success');
    } catch (err) {
      showToast(err.message || '恢复失败', 'error');
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
            className="p-2 text-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-fg">
              {postId ? '编辑文章' : '新建文章'}
            </h1>
            <p className="text-muted mt-1">创建精彩内容，分享您的故事</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {postId && (
            <button
              onClick={() => {
                setShowRevisions(true);
                if (postId) loadRevisions(postId);
              }}
              className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              修订
            </button>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPublished ? '更新发布' : '发布'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              className="w-full text-2xl font-bold text-fg border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
            />
            
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h3 className="font-semibold text-fg mb-4">文章设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-2">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">选择分类</option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name || cat}>{cat.name || cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-2">标签</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-accent/12  text-accent rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-accent">
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="输入标签后按回车添加"
                    className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-sm bg-surface  text-fg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h3 className="font-semibold text-fg mb-4">摘要</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要，将显示在文章列表中..."
              rows={4}
              className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h3 className="font-semibold text-fg mb-4">发布信息</h3>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <span>创建日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <span>更新日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span>作者: admin</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <span>置顶文章</span>
                <button
                  onClick={() => setIsSticky(!isSticky)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors${
                    isSticky ? 'bg-accent' : 'bg-surface-2'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform${
                      isSticky ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="pt-2 border-t border-line">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium${
                  publishType === 'scheduled' ? 'bg-info/12  text-info' :
                  isPublished ? 'bg-success/12  text-success' : 'bg-warning/14  text-warning'
                }`}>
                  {publishType === 'scheduled' ? '定时发布' : isPublished ? '已发布' : '草稿'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h3 className="font-semibold text-fg mb-4">发布选项</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="publishNow"
                  name="publishType"
                  checked={publishType === 'now'}
                  onChange={() => setPublishType('now')}
                  className="w-4 h-4 text-accent"
                />
                <label htmlFor="publishNow" className="text-sm text-fg">
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
                  className="w-4 h-4 text-accent"
                />
                <label htmlFor="publishScheduled" className="text-sm text-fg">
                  定时发布
                </label>
              </div>
              {publishType === 'scheduled' && (
                <div className="pl-7">
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="text-xl font-bold text-fg">修订历史</h2>
              <button
                onClick={() => {
                  setShowRevisions(false);
                  setSelectedRevision(null);
                }}
                className="p-2 text-muted hover:text-fg  hover:bg-surface-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex h-[calc(80vh-140px)]">
              <div className="w-1/3 border-r border-line overflow-y-auto">
                {revisions.length > 0 ? (
                  <div className="divide-y divide-line">
                    {revisions.map((revision) => (
                      <button
                        key={revision.id}
                        onClick={() => setSelectedRevision(revision)}
                        className={`w-full p-4 text-left hover:bg-surface-2 transition-colors${
                          selectedRevision?.id === revision.id ? 'bg-accent/12' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-fg truncate">
                          {revision.title.substring(0, 30)}{revision.title.length > 30 ? '...' : ''}
                        </div>
                        <div className="text-xs text-muted mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(revision.createdAt).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted">
                    暂无修订记录
                  </div>
                )}
              </div>
              <div className="w-2/3 p-6 overflow-y-auto">
                {selectedRevision ? (
                  <div>
                    <h3 className="text-lg font-bold text-fg mb-4">
                      {selectedRevision.title}
                    </h3>
                    <div className="text-sm text-muted mb-4 flex items-center gap-2">
                      <span>修订时间: {new Date(selectedRevision.createdAt).toLocaleString()}</span>
                      <span>|</span>
                      <span>作者: {selectedRevision.author}</span>
                    </div>
                    <div className="rich-text max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedRevision.content) }} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-line">
                      <button
                        onClick={() => handleRestoreRevision(selectedRevision)}
                        className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        恢复到该版本
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted">
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
