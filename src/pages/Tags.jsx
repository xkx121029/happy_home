import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Tag, X, Grid, Layers } from 'lucide-react';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';

export default function Tags() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  // 原来靠 props 拿 tags 与保存/删除回调，现在页面自取 Context
  const { tags, createTag, updateTag, deleteTag } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  const filteredTags = tags.filter((tag) => {
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           tag.slug.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 计算标签云字体大小
  const getTagCloudStyle = (count) => {
    const maxCount = Math.max(...tags.map(t => t.count), 1);
    const minSize = 12;
    const maxSize = 32;
    const scale = count / maxCount;
    const fontSize = minSize + (maxSize - minSize) * scale;
    return { fontSize: `${fontSize}px` };
  };

  const handleOpenModal = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        slug: tag.slug,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        slug: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', slug: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 自动生成 slug
    if (name === 'name' && !editingTag) {
      const slug = value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // 原来保存/删除走 props 回调，现在页面自取 Context 的语义化方法
  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updateTag(data.id, data);
        showToast('标签更新成功', 'success');
      } else {
        await createTag(data);
        showToast('标签创建成功', 'success');
      }
    } catch (err) {
      showToast(err.message || '保存失败', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      await alert('请输入标签名称', 'warning');
      return;
    }
    
    if (!formData.slug.trim()) {
      await alert('请输入标签slug', 'warning');
      return;
    }

    // 检查 slug 是否重复
    const existingSlug = tags.find(t => t.slug === formData.slug && t.id !== editingTag?.id);
    if (existingSlug) {
      await alert('该slug已存在，请使用不同的slug', 'warning');
      return;
    }

    if (editingTag) {
      await handleSave({ ...editingTag, ...formData });
    } else {
      await handleSave(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = async (tag) => {
    if (tag.count > 0) {
      await alert(`该标签下有 ${tag.count} 篇文章，无法删除`, 'warning');
      return;
    }
    
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除标签"${tag.name}"吗？`,
    });
    if (confirmed) {
      try {
        await deleteTag(tag.id);
        showToast('标签删除成功', 'success');
      } catch (err) {
        showToast(err.message || '删除失败', 'error');
      }
    }
  };

  return (
    <>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">标签管理</h1>
          <p className="text-muted mt-1">管理您网站的文章标签</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-2 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors${viewMode === 'list' ? 'bg-surface  text-accent' : 'text-muted hover:text-fg'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cloud')}
              className={`p-2 rounded-md transition-colors${viewMode === 'cloud' ? 'bg-surface  text-accent' : 'text-muted hover:text-fg'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建标签
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">文章数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">创建时间</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted  uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-surface-2">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-info" />
                        <span className="font-medium text-fg">{tag.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted font-mono">{tag.slug}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-info/12  text-info rounded-full">
                        {tag.count} 篇
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">{tag.createdAt}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(tag)}
                          className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag)}
                          className="p-2 text-muted hover:text-danger hover:bg-danger/12  rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTags.length === 0 && (
              <div className="py-12 text-center">
                <Tag className="w-12 h-12 text-line mx-auto mb-4" />
                <p className="text-muted">没有找到匹配的标签</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="group relative"
                >
                  <span
                    style={getTagCloudStyle(tag.count)}
                    className="inline-block px-4 py-2 bg-surface-2 text-fg rounded-full cursor-pointer hover:bg-accent/12  hover:text-accent transition-colors"
                    onClick={() => handleOpenModal(tag)}
                  >
                    {tag.name}
                    <span className="ml-1 text-xs opacity-60">({tag.count})</span>
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-fg text-bg text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {tag.slug}
                  </div>
                </div>
              ))}
            </div>

            {filteredTags.length === 0 && (
              <div className="py-12 text-center">
                <Layers className="w-12 h-12 text-line mx-auto mb-4" />
                <p className="text-muted">没有找到匹配的标签</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <h2 className="text-lg font-semibold text-fg">
                {editingTag ? '编辑标签' : '新建标签'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-muted hover:text-fg  rounded-lg hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  名称 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="输入标签名称"
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="tag-slug"
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted">URL友好的标识符</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-muted  hover:bg-surface-2 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
                >
                  {editingTag ? '保存修改' : '创建标签'}
                </button>
              </div>
            </form>
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
