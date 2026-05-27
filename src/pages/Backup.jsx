import { useState } from 'react';
import {
  Database, Download, Upload, Trash2, RotateCcw, Clock,
  FileJson, FileText, Archive, Check, X, AlertTriangle,
  FolderOpen, Copy, ChevronDown, ChevronRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Backup() {
  const { backups, posts, pages, comments } = useData();
  const [activeTab, setActiveTab] = useState('backups');
  const [selectedBackups, setSelectedBackups] = useState([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const handleCreateFullBackup = () => {
    alert('备份功能暂未实现');
  };

  const handleCreateCustomBackup = (type) => {
    alert('自定义备份功能暂未实现');
  };

  const handleRestore = (id) => {
    alert('恢复功能暂未实现');
    setShowRestoreConfirm(null);
  };

  const handleDelete = (id) => {
    alert('删除备份功能暂未实现');
    setShowDeleteConfirm(null);
  };

  const handleDownload = (id) => {
    alert('下载备份功能暂未实现');
  };

  const handleExport = (type) => {
    alert('导出功能暂未实现');
  };

  const handleExportMarkdown = (postId) => {
    alert('导出 Markdown 功能暂未实现');
  };

  const handleImport = async (e) => {
    alert('导入功能暂未实现');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSelectBackup = (id) => {
    setSelectedBackups(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedBackups.length === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedBackups.length} 个备份吗？`)) {
      alert('批量删除备份功能暂未实现');
      setSelectedBackups([]);
    }
  };

  const getBackupTypeLabel = (type) => {
    const labels = {
      full: '完整备份',
      posts: '文章备份',
      pages: '页面备份',
      users: '用户备份',
      settings: '设置备份',
      comments: '评论备份',
    };
    return labels[type] || type;
  };

  const getBackupTypeColor = (type) => {
    const colors = {
      full: 'bg-purple-100 text-purple-700',
      posts: 'bg-blue-100 text-blue-700',
      pages: 'bg-green-100 text-green-700',
      users: 'bg-orange-100 text-orange-700',
      settings: 'bg-gray-100 text-gray-700',
      comments: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据备份与导出</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理网站数据备份、导出和导入</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'backups', label: '备份管理', icon: Archive },
            { id: 'export', label: '数据导出', icon: Download },
            { id: 'import', label: '数据导入', icon: Upload },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backup Management Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速备份</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleCreateFullBackup}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <Archive className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">完整备份</div>
                  <div className="text-xs opacity-80">备份所有数据</div>
                </div>
              </button>

              <button
                onClick={() => handleCreateCustomBackup('posts')}
                className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <FileText className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">文章备份</div>
                  <div className="text-xs opacity-80">仅备份文章</div>
                </div>
              </button>

              <button
                onClick={() => handleCreateCustomBackup('pages')}
                className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                <FolderOpen className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">页面备份</div>
                  <div className="text-xs opacity-80">仅备份页面</div>
                </div>
              </button>

              <button
                onClick={() => handleCreateCustomBackup('comments')}
                className="flex items-center gap-3 p-4 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
              >
                <FileJson className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">评论备份</div>
                  <div className="text-xs opacity-80">仅备份评论</div>
                </div>
              </button>
            </div>
          </div>

          {/* Backup List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                备份列表 ({(backups || []).length})
              </h2>
              {selectedBackups.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selectedBackups.length})
                </button>
              )}
            </div>

            {(backups || []).length === 0 ? (
              <div className="p-12 text-center">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">暂无备份记录</p>
                <p className="text-sm text-gray-400 mt-1">点击上方按钮创建第一个备份</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {(backups || []).map(backup => (
                  <div
                    key={backup.id}
                    className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedBackups.includes(backup.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBackups.includes(backup.id)}
                      onChange={() => toggleSelectBackup(backup.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {backup.name}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getBackupTypeColor(backup.type)}`}>
                          {getBackupTypeLabel(backup.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(backup.createdAt)}
                        </span>
                        <span>{formatSize(backup.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(backup.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowRestoreConfirm(backup.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="恢复"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(backup.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">导出数据</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleExport('full')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Archive className="w-6 h-6 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出所有数据</div>
                  <div className="text-xs text-gray-500">JSON 格式</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('posts')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-6 h-6 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出文章</div>
                  <div className="text-xs text-gray-500">JSON 格式</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pages')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FolderOpen className="w-6 h-6 text-green-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出页面</div>
                  <div className="text-xs text-gray-500">JSON 格式</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('comments')}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileJson className="w-6 h-6 text-pink-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">导出评论</div>
                  <div className="text-xs text-gray-500">JSON 格式</div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Posts as Markdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">导出文章为 Markdown</h2>
              <p className="text-sm text-gray-500 mt-1">将文章内容导出为 Markdown 格式，方便在其他平台使用</p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {(posts || []).map(post => (
                <div key={post.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {post.createdAt} · {post.category}
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportMarkdown(post.id)}
                    className="ml-4 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    导出
                  </button>
                </div>
              ))}
            </div>

            {(posts || []).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                暂无文章可导出
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">导入数据</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              从 JSON 文件导入数据。支持导入文章、页面、分类、标签、菜单和评论。
            </p>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                选择或拖拽 JSON 文件到此处
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                选择文件
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {importResult && (
              <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                importResult.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {importResult.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                {importResult.message}
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">导入提示</h3>
                  <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• 导入将合并现有数据，不会覆盖已有内容</li>
                    <li>• 请确保导入的 JSON 文件格式正确</li>
                    <li>• 建议在导入前创建完整备份</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认恢复备份</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              确定要恢复此备份吗？当前数据将被备份覆盖。此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleRestore(showRestoreConfirm)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认删除备份</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              确定要删除此备份吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
