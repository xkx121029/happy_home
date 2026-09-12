import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, Plus, Trash2, Edit, GripVertical, Save, X, ChevronDown,
  ChevronRight, ExternalLink, Globe, FileText, FolderOpen, Tag,
  Link as LinkIcon, Home, Eye, EyeOff, Settings, ArrowUp, ArrowDown
} from 'lucide-react';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';

export default function Menus() {
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  const { menus, posts, pages, categories, tags, createMenu, updateMenu, deleteMenu } = useData();
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState('custom');
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    const menusArray = menus || [];
    if (menusArray.length > 0 && !selectedMenu) {
      setSelectedMenu(menusArray[0]);
    }
  }, [menus, selectedMenu]);

  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu);
    setEditingItem(null);
  };

  const handleAddMenu = async () => {
    const newMenuData = {
      title: '新菜单',
      location: 'header',
      items: [],
    };
    try {
      const newMenu = await createMenu(newMenuData);
      setSelectedMenu(newMenu);
    } catch (e) {
      showToast('创建菜单功能暂未实现', 'warning');
    }
  };

  const handleDeleteMenu = async (menuId) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: '确定要删除这个菜单吗？',
    });
    if (confirmed) {
      try {
        await deleteMenu(menuId);
        showToast('菜单删除成功', 'success');
        if (selectedMenu?.id === menuId) {
          const otherMenu = menus.find(m => m.id !== menuId);
          setSelectedMenu(otherMenu || null);
        }
      } catch (e) {
        showToast('删除菜单功能暂未实现', 'warning');
      }
    }
  };

  const handleUpdateMenu = async (field, value) => {
    if (!selectedMenu) return;
    try {
      await updateMenu(selectedMenu.id, { [field]: value });
      setSelectedMenu({ ...selectedMenu, [field]: value });
    } catch (e) {
      showToast('更新菜单功能暂未实现', 'warning');
    }
  };

  const handleAddItem = (type, data) => {
    if (!selectedMenu) return;
    showToast('添加菜单项功能暂未实现', 'warning');
    setShowAddModal(false);
  };

  const handleEditItem = (item) => {
    setEditingItem({ ...item });
  };

  const handleSaveItem = () => {
    if (!selectedMenu || !editingItem) return;
    showToast('编辑菜单项功能暂未实现', 'warning');
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!selectedMenu) return;
    const confirmed = await confirm({
      title: '确认删除',
      message: '确定要删除这个菜单项吗？',
    });
    if (confirmed) {
      showToast('删除菜单项功能暂未实现', 'warning');
    }
  };

  const handleToggleItem = (itemId) => {
    showToast('切换菜单项功能暂未实现', 'warning');
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    showToast('拖拽排序功能暂未实现', 'warning');
    setDraggedItem(null);
  };

  const handleMoveItem = (itemId, direction) => {
    showToast('移动菜单项功能暂未实现', 'warning');
  };

  const renderAddModal = () => {
    const [customTitle, setCustomTitle] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [selectedId, setSelectedId] = useState('');

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">添加菜单项</h3>
            <button onClick={() => { setShowAddModal(false); setAddItemType('custom'); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">链接类型</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { type: 'custom', icon: LinkIcon, label: '自定义' },
                { type: 'post', icon: FileText, label: '文章' },
                { type: 'page', icon: FolderOpen, label: '页面' },
                { type: 'category', icon: FolderOpen, label: '分类' },
                { type: 'tag', icon: Tag, label: '标签' },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setAddItemType(item.type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    addItemType === item.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            {addItemType === 'custom' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="菜单项标题"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="/about 或 https://example.com"
                  />
                </div>
              </>
            )}

            {addItemType === 'post' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择文章</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">请选择文章</option>
                  {posts.filter(p => p.status === 'published').map(post => (
                    <option key={post.id} value={post.id}>{post.title}</option>
                  ))}
                </select>
              </div>
            )}

            {addItemType === 'page' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择页面</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">请选择页面</option>
                  {pages.filter(p => p.status === 'published').map(page => (
                    <option key={page.id} value={page.id}>{page.title}</option>
                  ))}
                </select>
              </div>
            )}

            {addItemType === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择分类</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">请选择分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}

            {addItemType === 'tag' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">选择标签</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">请选择标签</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowAddModal(false); setAddItemType('custom'); }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (addItemType === 'custom') {
                  handleAddItem('custom', { title: customTitle, url: customUrl });
                } else {
                  handleAddItem(addItemType, { id: selectedId });
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingItem) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">编辑菜单项</h3>
            <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
              <input
                type="text"
                value={editingItem.url}
                onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">打开方式</label>
              <select
                value={editingItem.target}
                onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="_self">当前窗口</option>
                <option value="_blank">新窗口</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSaveItem}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">菜单管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理网站导航菜单</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧菜单列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">菜单</h2>
            <button
              onClick={handleAddMenu}
              className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {(menus || []).map(menu => (
              <div
                key={menu.id}
                onClick={() => handleSelectMenu(menu)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedMenu?.id === menu.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Menu className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{menu.title}</div>
                    <div className="text-xs text-gray-400">
                      {menu.location === 'header' ? '头部导航' : '页脚导航'} · {(menu.items || []).length} 项
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu.id); }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧菜单编辑器 */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          {selectedMenu ? (
            <>
              {/* 菜单设置 */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedMenu.title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">菜单位置</span>
                      <select
                        value={selectedMenu.location}
                        onChange={(e) => handleUpdateMenu('location', e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="header">头部导航</option>
                        <option value="footer">页脚导航</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={selectedMenu.title}
                    onChange={(e) => handleUpdateMenu('title', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="菜单名称"
                  />
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加项目
                  </button>
                </div>
              </div>

              {/* 预览位置 */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>预览位置：</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    {selectedMenu.location === 'header' ? '头部导航' : '页脚导航'}
                  </span>
                </div>
              </div>

              {/* 菜单项列表 */}
              <div className="p-6">
                {(selectedMenu?.items || []).length === 0 ? (
                  <div className="text-center py-12">
                    <Menu className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">暂无菜单项</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      添加第一个菜单项
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedMenu?.items || [])
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((item, index) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, item)}
                          className={`flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 ${
                            draggedItem?.id === item.id ? 'opacity-50' : ''
                          } ${!item.enabled ? 'opacity-50' : ''}`}
                        >
                          <div className="cursor-move text-gray-400 hover:text-gray-600">
                            <GripVertical className="w-5 h-5" />
                          </div>

                          <button
                            onClick={() => handleMoveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4 text-gray-500" />
                          </button>

                          <button
                            onClick={() => handleMoveItem(item.id, 'down')}
                            disabled={index === (selectedMenu?.items || []).length - 1}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4 text-gray-500" />
                          </button>

                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{item.url}</span>
                              {item.target === '_blank' && (
                                <span className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">新窗口</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleItem(item.id)}
                            className={`p-1.5 rounded-lg ${
                              item.enabled
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Menu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">选择一个菜单进行编辑</p>
              <button
                onClick={handleAddMenu}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建新菜单
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && renderAddModal()}
      {editingItem && renderEditModal()}

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
