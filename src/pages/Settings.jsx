import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon, Globe, Palette, Shield, Bell, Mail, Database,
  Layout, Type, Search, Eye, Lock, FileText, User, Server, Code,
  Cpu, Zap, Share2, MessageSquare, Image as ImageIcon,
  Save, RotateCcw, Trash2, X, Check, TestTube, RefreshCw,
  Download, Upload, Cloud, AlertTriangle, Info, CheckCircle,
  Clock, Filter, ExternalLink, Send
} from 'lucide-react';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { useData } from '../contexts/DataContext';
import { smtpAPI, notificationsAPI } from '../services/api';
import { CUSTOM_TABS, SETTINGS_DEFAULTS, SETTINGS_TABS, filterSettings } from '../config/settings';
import { ADMIN_PATHS } from '../routes/paths';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';

// 标签页与字段定义都来自 config/settings.js（唯一真源）。
// 原来表单和白名单各写一份，必然漂移 —— postUrlType 有表单但不在白名单里，
// 保存时被静默丢弃。现在两者由同一份定义派生。
const tabs = [...SETTINGS_TABS, ...CUSTOM_TABS];

const findTab = (id) => SETTINGS_TABS.find((tab) => tab.id === id);

export default function Settings() {
  const { posts, comments } = useData();
  const { settings, updateSettings } = useSiteSettings();
  const [notifications, setNotifications] = useState([]);
  const { confirm, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('settingsActiveTab');
    return saved || 'general';
  });
  const [formData, setFormData] = useState(() => filterSettings(settings));
  const [hasChanges, setHasChanges] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);

  // settings 是异步加载的，挂载那一刻还是空对象，
  // 而 formData 用 useState 初始化只会执行一次 —— 结果就是设置明明已经取到，
  // 表单里却始终是空的。这里在设置到达后回填一次；
  // 如果用户已经开始编辑（hasChanges）就不覆盖他的输入。
  useEffect(() => {
    if (hasChanges || !settings || Object.keys(settings).length === 0) return;
    const next = filterSettings(settings);
    setFormData(next);
  }, [settings, hasChanges]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      // 通知类端点的载荷字段是 notifications，不是统一的 data
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('加载通知失败:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadNotifications();
    }
  }, [activeTab]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(filterSettings(formData));
      setHasChanges(false);
      showToast('设置已保存！', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      showToast(error.message || '保存设置时发生错误', 'error');
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: '重置设置',
      message: '确定要把所有设置恢复为默认值吗？',
    });
    if (!confirmed) return;

    try {
      // 原来这里是 localStorage.clear()：它不只清设置，还会把登录令牌、
      // 主题选择、教程进度一起抹掉 —— 点一下「重置设置」就被登出了。
      // 现在只写回字段定义里的默认值。
      await updateSettings({ ...SETTINGS_DEFAULTS });
      setFormData({ ...SETTINGS_DEFAULTS });
      setHasChanges(false);
      showToast('设置已恢复默认值', 'success');
    } catch (error) {
      showToast(error.message || '重置失败', 'error');
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const testConfig = {
        host: formData.smtpHost,
        port: formData.smtpPort,
        user: formData.smtpUser,
        pass: formData.smtpPass,
        secure: formData.smtpSecure
      };
      const result = await smtpAPI.test(false, testConfig);
      setSmtpTestResult(result);
    } catch (error) {
      setSmtpTestResult({ success: false, message: error.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleExportData = () => {
    const data = {
      settings: formData,
      posts: posts,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功！', 'success');
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.settings) {
          setFormData(data.settings);
          setHasChanges(true);
          showToast('数据导入成功！请保存设置。', 'success');
        }
      } catch (error) {
        showToast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    const confirmed = await confirm({
      title: '清除所有数据',
      message: '警告：这将删除所有数据，包括文章、页面、用户、媒体文件和设置。此操作不可恢复！',
    });
    if (confirmed) {
      localStorage.clear();
      showToast('数据已清除！', 'success');
      window.location.reload();
    }
  };

  const renderSetting = (setting) => {
    const value = formData[setting.key] !== undefined ? formData[setting.key] : setting.defaultValue;

    switch (setting.type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <input
            type={setting.type}
            value={value || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder}
            rows={3}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || setting.defaultValue || ''}
            onChange={(e) => handleChange(setting.key, parseInt(e.target.value, 10))}
            min={setting.min}
            max={setting.max}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={value || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            placeholder={setting.placeholder}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value || setting.defaultValue || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {setting.options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={value || setting.defaultValue || '#3b82f6'}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-12 h-10 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={value || setting.defaultValue || '#3b82f6'}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'range':
        return (
          <div className="w-full max-w-md">
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={value || setting.defaultValue || 0}
                onChange={(e) => handleChange(setting.key, parseFloat(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step || 1}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium text-gray-700 dark:text-gray-300">
                {value || setting.defaultValue || 0}
              </span>
            </div>
          </div>
        );

      case 'toggle': {
        const toggleValue = value ?? setting.defaultValue ?? false;
        return (
          <button
            onClick={() => handleChange(setting.key, !toggleValue)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              toggleValue ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                toggleValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );
      }

      default:
        return null;
    }
  };

  const filteredLogs = (notifications || []).filter(log => {
    const matchesFilter = logFilter === 'all' || log.type === logFilter;
    const matchesSearch = !logSearch || 
      log.title?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.message?.toLowerCase().includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getLogTypeColor = (type) => {
    const colors = {
      error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      register_request: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      comment: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <>
      <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置中心</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理您网站的所有设置选项</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              hasChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1">
          <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors mb-1 last:mb-0 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            {activeTab !== 'backup' && activeTab !== 'logs' && (
              <div className="space-y-6">
                {findTab(activeTab)?.fields.map(setting => (
                  <div key={setting.key} className="flex items-start justify-between gap-6 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex-1 min-w-0">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {setting.label}
                      </label>
                      {setting.hint && (
                        <p className="text-xs text-muted mt-0.5">{setting.hint}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {renderSetting(setting)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'email' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    测试SMTP配置
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    点击下方按钮测试当前表单中的SMTP配置（无需先保存）。
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isTestingSmtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          测试连接
                        </>
                      )}
                    </button>
                    {smtpTestResult && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        smtpTestResult.success 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {smtpTestResult.success ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            {smtpTestResult.message}
                          </span>
                        ) : (
                          <span>{smtpTestResult.message}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(posts || []).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">文章</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{(comments || []).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">评论</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(notifications || []).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">通知</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">1</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">数据库</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Download className="w-6 h-6 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">导出数据</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      将所有网站数据导出为JSON文件，可用于备份或迁移。
                    </p>
                    <button
                      onClick={handleExportData}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      导出数据
                    </button>
                  </div>

                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Upload className="w-6 h-6 text-green-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">导入数据</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      从JSON文件导入数据，将覆盖当前设置。
                    </p>
                    <label className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      选择文件
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">危险区域</h3>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    以下操作将永久删除数据，请谨慎操作。
                  </p>
                  <button
                    onClick={handleClearAllData}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除所有数据
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索日志..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部类型</option>
                    <option value="error">错误</option>
                    <option value="warning">警告</option>
                    <option value="info">信息</option>
                    <option value="register_request">注册请求</option>
                    <option value="comment">评论</option>
                  </select>
                  <button
                    onClick={loadNotifications}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    刷新
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center">
                      <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">暂无日志记录</p>
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-lg border ${
                          log.is_read
                            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'
                            : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">{log.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getLogTypeColor(log.type)}`}>
                                {log.type}
                              </span>
                              {!log.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{log.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteNotification(log.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
    </div>
    </>
  );
}