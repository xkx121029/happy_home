import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Pin, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { useData } from '../contexts/DataContext';

export default function Posts() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  // 原来靠 props 拿 posts / onDelete，现在页面自取 Context
  const { posts, updatePost, deletePost, categories } = useData();
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  // 根据设置获取文章链接
  // 原来生成的是 /post/xxx，而前台路由注册的是 /posts/:id，
  // 路径对不上，管理员点"查看文章"必然落到 404。
  //
  // 这里原本还会读 settings.postUrlType 来切换「用 ID 还是用标题别名」，
  // 但 posts 表没有 slug 列，两个分支算出来是同一个地址 —— 那个设置从来
  // 没有产生过任何差别，已从设置里移除。
  const getPostUrl = (post) => `/posts/${post.id}`;

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const filteredPosts = sortedPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">已发布</span>;
    }
    if (status === 'future') {
      return <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">定时发布</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">草稿</span>;
  };

  const handleToggleSticky = async (post, e) => {
    e.stopPropagation();
    // 原来调用 postsAPI.update —— 但 postsAPI 是从 DataContext 解构出来的，
    // 而 Context 从未提供该成员，拿到的是 undefined，一点击就抛 TypeError。
    // 改用 Context 的语义化方法，顺带让本地状态同步更新。
    try {
      await updatePost(post.id, { sticky: !post.sticky });
      showToast(post.sticky ? '已取消置顶' : '已置顶', 'success');
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleCancelScheduled = async (post, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: '确认取消',
      message: '确定要取消定时发布吗？',
    });
    if (confirmed) {
      try {
        await updatePost(post.id, { status: 'draft', publishDate: null });
        showToast('已取消定时发布', 'success');
      } catch (err) {
        showToast(err.message || '操作失败', 'error');
      }
    }
  };

  const handleEditPost = (post) => {
    navigate(`/admin/posts/${post.id}/edit`);
  };

  const handleNewPost = () => {
    navigate('/admin/posts/new');
  };

  // 原来删除走 props.onDelete 回调，现在页面自取 Context 的 deletePost
  const handleDelete = async (post) => {
    const confirmed = await confirm({ title: '确认删除', message: `确定要删除《${post.title}》吗？` });
    if (!confirmed) return;
    try {
      await deletePost(post.id);
      showToast('文章已删除', 'success');
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  return (
    <>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">文章管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理您网站的所有文章内容</p>
        </div>
        <button
          onClick={handleNewPost}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建文章
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="all">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                  <option value="future">定时发布</option>
                </select>
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">全部分类</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name || cat}>{cat.name || cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">置顶</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">作者</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">发布日期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => handleToggleSticky(post, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.sticky
                          ? 'text-blue-500 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                          : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={post.sticky ? '取消置顶' : '置顶'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {post.sticky && <Pin className="w-4 h-4 text-blue-500" />}
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{post.excerpt}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{post.author}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(post.status, post.publishDate)}
                      {post.status === 'future' && post.publishDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.publishDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{post.createdAt}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'future' && (
                        <button
                          onClick={(e) => handleCancelScheduled(post, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="取消定时发布"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => window.open(getPostUrl(post), '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        title="预览文章"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">没有找到匹配的文章</p>
          </div>
        )}
      </div>

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
