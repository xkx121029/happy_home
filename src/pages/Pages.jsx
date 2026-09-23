import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';

export default function Pages() {
  const { confirm, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  // 原来靠 props 拿 pages / onDelete，现在页面自取 Context
  const { pages, deletePage } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return <span className="px-2 py-1 text-xs font-medium bg-success/12  text-success rounded-full">已发布</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-warning/14  text-warning rounded-full">草稿</span>;
  };

  const handleEditPage = (page) => {
    navigate(`/admin/pages/${page.id}/edit`);
  };

  const handleNewPage = () => {
    navigate('/admin/pages/new');
  };

  // 原来删除走 props.onDelete 回调，现在页面自取 Context 的 deletePage
  const handleDelete = async (page) => {
    const confirmed = await confirm({ title: '确认删除', message: `确定要删除《${page.title}》吗？` });
    if (!confirmed) return;
    try {
      await deletePage(page.id);
      showToast('页面已删除', 'success');
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const handlePreviewPage = (page) => {
    if (page.status === 'published') {
      // 已发布的页面跳转到前台
      window.open(`/page/${page.slug}`, '_blank');
    } else {
      // 草稿页面提示用户
      alert('该页面尚未发布，无法预览。请先发布页面。');
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">页面管理</h1>
          <p className="text-muted mt-1">管理您网站的所有页面</p>
        </div>
        <button
          onClick={handleNewPage}
          className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建页面
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜索页面..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredPages.map((page) => (
            <div key={page.id} className="border border-line rounded-xl p-4 hover:border-accent/40  hover:shadow-sm transition-all bg-surface">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-2  rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <h3 className="font-medium text-fg">{page.title}</h3>
                    <p className="text-sm text-muted">/{page.slug}</p>
                  </div>
                </div>
                {getStatusBadge(page.status)}
              </div>
              
              <p className="text-sm text-muted  line-clamp-2 mb-4">
                {page.content ? page.content.replace(/<[^>]*>/g, '').slice(0, 100) : ''}...
              </p>
              
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="text-xs text-muted">{page.updatedAt}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePreviewPage(page)}
                    className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
                    title={page.status === 'published' ? '预览页面' : '页面未发布，无法预览'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditPage(page)}
                    className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="p-2 text-muted hover:text-danger hover:bg-danger/12  rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPages.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted">没有找到匹配的页面</p>
          </div>
        )}
      </div>
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
    </>
  );
}
