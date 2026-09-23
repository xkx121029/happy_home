import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, FolderOpen, ChevronRight, X } from 'lucide-react';
import { useNotification } from '../components/Notification';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';

export default function Categories() {
  const { success, warning, error } = useNotification();
  // 原来靠 props 拿 categories 与保存/删除回调，现在页面自取 Context
  const { categories, createCategory, updateCategory, deleteCategory } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: null,
  });

  const filteredCategories = categories.filter((cat) => {
    return cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // 构建层级结构
  const rootCategories = filteredCategories.filter(cat => cat.parent === null);
  
  const getChildren = (parentId) => {
    return filteredCategories.filter(cat => cat.parent === parentId);
  };

  const getParentName = (parentId) => {
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : '-';
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent: category.parent,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parent: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', parent: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 自动生成 slug
    if (name === 'name' && !editingCategory) {
      const slug = value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // 原来保存走 props.onSave 回调，现在页面自取 Context 的语义化方法
  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updateCategory(data.id, data);
        success('分类更新成功');
      } else {
        await createCategory(data);
        success('分类创建成功');
      }
    } catch (err) {
      error(err.message || '保存分类失败');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      warning('请输入分类名称');
      return;
    }
    
    if (!formData.slug.trim()) {
      warning('请输入分类slug');
      return;
    }

    // 检查 slug 是否重复
    const existingSlug = categories.find(cat => cat.slug === formData.slug && cat.id !== editingCategory?.id);
    if (existingSlug) {
      warning('该slug已存在，请使用不同的slug');
      return;
    }

    if (editingCategory) {
      handleSave({ ...editingCategory, ...formData });
    } else {
      handleSave(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (category) => {
    if (category.count > 0) {
      warning(`该分类下有 ${category.count} 篇文章，无法删除`);
      return;
    }
    
    const children = categories.filter(cat => cat.parent === category.id);
    if (children.length > 0) {
      warning('该分类下有子分类，请先删除子分类');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: `确定要删除分类"${category.name}"吗？`,
      // 原来删除走 props.onDelete 回调，现在页面自取 Context 的 deleteCategory
      onConfirm: async () => {
        try {
          await deleteCategory(category.id);
          success('分类删除成功');
        } catch (err) {
          error(err.message || '删除分类失败');
        }
      }
    });
  };

  const renderCategoryRow = (category, level = 0) => {
    const children = getChildren(category.id);
    
    return (
      <tr key={category.id} className="hover:bg-surface-2">
        <td className="px-4 py-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}
            <FolderOpen className="w-5 h-5 text-accent flex-shrink-0" />
            <div>
              <span className="font-medium text-fg">{category.name}</span>
              {level > 0 && (
                <span className="ml-2 text-xs text-muted">(子分类)</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-muted font-mono">{category.slug}</td>
        <td className="px-4 py-4 text-sm text-muted max-w-xs truncate">{category.description || '-'}</td>
        <td className="px-4 py-4 text-sm text-muted">
          {category.parent ? getParentName(category.parent) : '-'}
        </td>
        <td className="px-4 py-4">
          <span className="px-2 py-1 text-xs font-medium bg-accent/12  text-accent rounded-full">
            {category.count} 篇
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenModal(category)}
              className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="p-2 text-muted hover:text-danger hover:bg-danger/12  rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderTree = (parentId = null, level = 0) => {
    const items = parentId === null 
      ? filteredCategories.filter(cat => cat.parent === null)
      : filteredCategories.filter(cat => cat.parent === parentId);
    
    return items.map(category => (
      <React.Fragment key={category.id}>
        {renderCategoryRow(category, level)}
        {renderTree(category.id, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">分类管理</h1>
          <p className="text-muted mt-1">管理您网站的文章分类</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建分类
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜索分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">描述</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">父分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">文章数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted  uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {renderTree()}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-line mx-auto mb-4" />
            <p className="text-muted">没有找到匹配的分类</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <h2 className="text-lg font-semibold text-fg">
                {editingCategory ? '编辑分类' : '新建分类'}
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
                  placeholder="输入分类名称"
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
                  placeholder="category-slug"
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted">URL友好的标识符</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  描述
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="输入分类描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  父分类
                </label>
                <select
                  name="parent"
                  value={formData.parent || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">无（作为一级分类）</option>
                  {categories
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  }
                </select>
                <p className="mt-1 text-xs text-muted">选择上级分类创建子分类</p>
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
                  {editingCategory ? '保存修改' : '创建分类'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    
    <Modal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      title={confirmModal.title}
      message={confirmModal.message}
      type="confirm"
      onConfirm={confirmModal.onConfirm}
    />
    </>
  );
}
