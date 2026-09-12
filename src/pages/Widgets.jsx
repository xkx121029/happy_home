import { useState } from 'react';
import { Layout, Plus, Trash2, GripVertical, X, Settings, Eye, EyeOff, FileText, Folder, Tag, Search, MessageSquare, Globe, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const widgetTypes = [
  { type: 'recent_posts', name: '最新文章', icon: FileText, description: '显示最新发布的文章列表' },
  { type: 'categories', name: '分类目录', icon: Folder, description: '显示文章分类列表' },
  { type: 'tags', name: '标签云', icon: Tag, description: '显示文章标签云' },
  { type: 'search', name: '搜索', icon: Search, description: '显示搜索框' },
  { type: 'recent_comments', name: '最新评论', icon: MessageSquare, description: '显示最新评论' },
  { type: 'meta', name: '网站信息', icon: Globe, description: '显示网站信息和登录链接' },
];

export default function Widgets() {
  const { widgets, widgetsAPI } = useData();
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configValues, setConfigValues] = useState({});
  const [draggedWidget, setDraggedWidget] = useState(null);

  const sidebarWidgets = widgets
    .filter(w => w.location === 'sidebar')
    .sort((a, b) => a.order - b.order);

  const footerWidgets = widgets
    .filter(w => w.location === 'footer')
    .sort((a, b) => a.order - b.order);

  const getWidgetInfo = (type) => widgetTypes.find(w => w.type === type);

  const handleAddWidget = (type, location) => {
    const widgetInfo = getWidgetInfo(type);
    const newWidget = widgetsAPI.create({
      name: widgetInfo.name,
      type,
      location,
      enabled: true,
      config: {},
    });
    setSelectedWidget(newWidget);
    setConfigValues({});
    setShowConfigModal(true);
  };

  const handleDeleteWidget = (id) => {
    if (window.confirm('确定要删除这个小工具吗？')) {
      widgetsAPI.delete(id);
      if (selectedWidget?.id === id) {
        setSelectedWidget(null);
      }
    }
  };

  const handleToggleEnabled = (id) => {
    widgetsAPI.toggleEnabled(id);
  };

  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setConfigValues(widget.config || {});
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    if (selectedWidget) {
      widgetsAPI.update(selectedWidget.id, { config: configValues });
      setShowConfigModal(false);
      setSelectedWidget(null);
    }
  };

  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidget, location) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget.id === targetWidget.id) return;
    if (draggedWidget.location !== location) return;

    const locationWidgets = widgets.filter(w => w.location === location).sort((a, b) => a.order - b.order);
    const draggedIndex = locationWidgets.findIndex(w => w.id === draggedWidget.id);
    const targetIndex = locationWidgets.findIndex(w => w.id === targetWidget.id);

    locationWidgets.splice(draggedIndex, 1);
    locationWidgets.splice(targetIndex, 0, draggedWidget);

    const orderedIds = locationWidgets.map(w => w.id);
    widgetsAPI.reorder(location, orderedIds);
    setDraggedWidget(null);
  };

  const handleMoveWidget = (widgetId, direction, location) => {
    const locationWidgets = widgets.filter(w => w.location === location).sort((a, b) => a.order - b.order);
    const index = locationWidgets.findIndex(w => w.id === widgetId);
    if (direction === 'up' && index > 0) {
      [locationWidgets[index - 1], locationWidgets[index]] = [locationWidgets[index], locationWidgets[index - 1]];
    } else if (direction === 'down' && index < locationWidgets.length - 1) {
      [locationWidgets[index], locationWidgets[index + 1]] = [locationWidgets[index + 1], locationWidgets[index]];
    } else {
      return;
    }
    const orderedIds = locationWidgets.map(w => w.id);
    widgetsAPI.reorder(location, orderedIds);
  };

  const renderWidgetItem = (widget) => {
    const widgetInfo = getWidgetInfo(widget.type);
    const Icon = widgetInfo?.icon || Layout;

    return (
      <div
        key={widget.id}
        draggable
        onDragStart={(e) => handleDragStart(e, widget)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, widget, widget.location)}
        className={`flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 ${
          draggedWidget?.id === widget.id ? 'opacity-50' : ''
        } ${!widget.enabled ? 'opacity-50' : ''}`}
      >
        <div className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="w-5 h-5" />
        </div>

        <button
          onClick={() => handleMoveWidget(widget.id, 'up', widget.location)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
        >
          <ArrowUp className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={() => handleMoveWidget(widget.id, 'down', widget.location)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
        >
          <ArrowDown className="w-4 h-4 text-gray-500" />
        </button>

        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>

        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{widget.name}</div>
          <div className="text-xs text-gray-500">{widgetInfo?.description}</div>
        </div>

        <button
          onClick={() => handleToggleEnabled(widget.id)}
          className={`p-1.5 rounded-lg ${
            widget.enabled
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300'
          }`}
        >
          {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => handleEditWidget(widget)}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <Settings className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={() => handleDeleteWidget(widget.id)}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderConfigModal = () => {
    if (!selectedWidget) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">配置小工具</h3>
            <button onClick={() => setShowConfigModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
              <input
                type="text"
                value={selectedWidget.name}
                onChange={(e) => setSelectedWidget({ ...selectedWidget, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {selectedWidget.type === 'recent_posts' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">显示数量</label>
                <select
                  value={configValues.count || 5}
                  onChange={(e) => setConfigValues({ ...configValues, count: Number(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={3}>3 篇</option>
                  <option value={5}>5 篇</option>
                  <option value={10}>10 篇</option>
                </select>
              </div>
            )}

            {selectedWidget.type === 'categories' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">显示数量</label>
                <select
                  value={configValues.count || 10}
                  onChange={(e) => setConfigValues({ ...configValues, count: Number(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={5}>5 个</option>
                  <option value={10}>10 个</option>
                  <option value={20}>20 个</option>
                </select>
              </div>
            )}

            {selectedWidget.type === 'tags' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">显示数量</label>
                <select
                  value={configValues.count || 20}
                  onChange={(e) => setConfigValues({ ...configValues, count: Number(e.target.value) || 20 })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={10}>10 个</option>
                  <option value={20}>20 个</option>
                  <option value={30}>30 个</option>
                </select>
              </div>
            )}

            {selectedWidget.type === 'recent_comments' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">显示数量</label>
                <select
                  value={configValues.count || 5}
                  onChange={(e) => setConfigValues({ ...configValues, count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={3}>3 条</option>
                  <option value={5}>5 条</option>
                  <option value={10}>10 条</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfigModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">小工具管理</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">管理网站侧边栏和页脚的小工具</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：小工具类型列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">可用小工具</h2>
          <div className="space-y-3">
            {widgetTypes.map(widgetType => {
              const Icon = widgetType.icon;
              return (
                <div
                  key={widgetType.type}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{widgetType.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{widgetType.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddWidget(widgetType.type, 'sidebar')}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      添加到侧边栏
                    </button>
                    <button
                      onClick={() => handleAddWidget(widgetType.type, 'footer')}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      添加到页脚
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：已启用的小工具 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 侧边栏小工具 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  侧边栏小工具
                </h2>
                <span className="text-sm text-gray-500">{sidebarWidgets.length} 个小工具</span>
              </div>
            </div>
            <div className="p-4">
              {sidebarWidgets.length === 0 ? (
                <div className="text-center py-8">
                  <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">暂无侧边栏小工具</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">从左侧选择小工具类型添加</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sidebarWidgets.map(widget => renderWidgetItem(widget))}
                </div>
              )}
            </div>
          </div>

          {/* 页脚小工具 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  页脚小工具
                </h2>
                <span className="text-sm text-gray-500">{footerWidgets.length} 个小工具</span>
              </div>
            </div>
            <div className="p-4">
              {footerWidgets.length === 0 ? (
                <div className="text-center py-8">
                  <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">暂无页脚小工具</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">从左侧选择小工具类型添加</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {footerWidgets.map(widget => renderWidgetItem(widget))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfigModal && renderConfigModal()}
    </div>
  );
}
