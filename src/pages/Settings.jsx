import { useState, useMemo, useEffect } from 'react';
import {
  Settings as SettingsIcon, Globe, Palette, Shield, Bell, Mail, Database,
  Layout, Type, Search, Eye, Lock, FileText, User, Server, Code,
  Cpu, Zap, Share2, MessageSquare, Image as ImageIcon,
  Save, RotateCcw, Trash2, X, Check, TestTube, RefreshCw,
  Download, Upload, Cloud, AlertTriangle, Info, CheckCircle,
  Clock, Filter, ExternalLink, Send
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { smtpAPI, notificationsAPI } from '../services/api';
import { filterSettings } from '../utils/allowedSettings';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';

const tabs = [
  { id: 'general', label: '常规设置', icon: SettingsIcon },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'content', label: '内容', icon: FileText },
  { id: 'users', label: '用户', icon: User },
  { id: 'security', label: '安全', icon: Shield },
  { id: 'notifications', label: '通知', icon: Bell },
  { id: 'media', label: '媒体', icon: ImageIcon },
  { id: 'email', label: '邮件', icon: Mail },
  { id: 'performance', label: '性能', icon: Zap },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'integrations', label: '集成', icon: Share2 },
  { id: 'customCode', label: '自定义代码', icon: Code },
  { id: 'backup', label: '备份恢复', icon: Database },
  { id: 'logs', label: '日志中心', icon: Server },
];

const settingCategories = {
  general: [
    { key: 'siteName', label: '网站名称', type: 'text', placeholder: '我的网站' },
    { key: 'siteDescription', label: '网站描述', type: 'textarea', placeholder: '这是一个很棒的网站' },
    { key: 'siteUrl', label: '网站URL', type: 'url', placeholder: 'https://example.com' },
    { key: 'tagline', label: '网站标语', type: 'text', placeholder: '简单而强大' },
    { key: 'adminEmail', label: '管理员邮箱', type: 'email', placeholder: 'admin@example.com' },
    { key: 'timezone', label: '时区', type: 'select', options: [
      { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
      { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
      { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
    ]},
    { key: 'language', label: '语言', type: 'select', options: [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'zh-TW', label: '繁体中文' },
      { value: 'en-US', label: 'English (US)' },
      { value: 'ja-JP', label: '日本語' },
    ]},
  ],
  appearance: [
    { key: 'theme', label: '主题', type: 'select', options: [
      { value: 'default', label: '默认主题' },
      { value: 'dark', label: '深色主题' },
      { value: 'light', label: '浅色主题' },
      { value: 'ocean', label: '海洋蓝' },
      { value: 'forest', label: '森林绿' },
    ]},
    { key: 'primaryColor', label: '主色调', type: 'color', defaultValue: '#3b82f6' },
    { key: 'secondaryColor', label: '次要色', type: 'color', defaultValue: '#8b5cf6' },
    { key: 'accentColor', label: '强调色', type: 'color', defaultValue: '#ec4899' },
    { key: 'fontFamily', label: '字体', type: 'select', options: [
      { value: 'system', label: '系统默认' },
      { value: 'serif', label: '宋体/Serif' },
      { value: 'sans-serif', label: '黑体/Sans-serif' },
    ]},
    { key: 'fontSize', label: '字体大小', type: 'range', min: 12, max: 24, defaultValue: 16 },
    { key: 'layout', label: '布局', type: 'select', options: [
      { value: 'wide', label: '宽屏' },
      { value: 'boxed', label: '盒装' },
      { value: 'full', label: '全宽' },
    ]},
    { key: 'sidebarPosition', label: '侧边栏位置', type: 'select', options: [
      { value: 'left', label: '左侧' },
      { value: 'right', label: '右侧' },
    ]},
  ],
  content: [
    { key: 'postsPerPage', label: '每页文章数', type: 'number', min: 5, max: 100, defaultValue: 10 },
    { key: 'excerptLength', label: '摘要长度', type: 'number', min: 50, max: 500, defaultValue: 150 },
    { key: 'postUrlType', label: '文章链接格式', type: 'select', options: [
      { value: 'slug', label: '标题别名（如 /post/my-first-post）' },
      { value: 'id', label: '文章ID（如 /post/123456）' },
    ]},
    { key: 'enableComments', label: '启用评论', type: 'toggle', defaultValue: true },
    { key: 'commentsModeration', label: '评论审核', type: 'toggle', defaultValue: true },
    { key: 'enableRevisions', label: '启用文章修订', type: 'toggle', defaultValue: true },
    { key: 'revisionLimit', label: '保留修订数量', type: 'number', min: 0, max: 100, defaultValue: 25 },
  ],
  users: [
    { key: 'registrationEnabled', label: '开放注册', type: 'toggle', defaultValue: false },
    { key: 'defaultRole', label: '新用户默认角色', type: 'select', options: [
      { value: 'subscriber', label: '订阅者' },
      { value: 'author', label: '作者' },
      { value: 'editor', label: '编辑' },
    ]},
    { key: 'emailVerification', label: '邮箱验证', type: 'toggle', defaultValue: true },
    { key: 'enableAvatars', label: '启用头像', type: 'toggle', defaultValue: true },
  ],
  security: [
    { key: 'twoFactorAuth', label: '两步验证', type: 'toggle', defaultValue: false },
    { key: 'loginLimit', label: '登录限制', type: 'select', options: [
      { value: 'none', label: '无限制' },
      { value: '5', label: '5次/分钟' },
      { value: '10', label: '10次/分钟' },
    ]},
    { key: 'sessionTimeout', label: '会话超时', type: 'select', options: [
      { value: '1', label: '1小时' },
      { value: '6', label: '6小时' },
      { value: '24', label: '24小时' },
      { value: '168', label: '7天' },
    ]},
    { key: 'enableSSL', label: '强制HTTPS', type: 'toggle', defaultValue: false },
  ],
  notifications: [
    { key: 'notifyNewComment', label: '新评论通知', type: 'toggle', defaultValue: true },
    { key: 'notifyNewUser', label: '新用户注册通知', type: 'toggle', defaultValue: true },
    { key: 'notifyPostApproval', label: '文章待审核通知', type: 'toggle', defaultValue: true },
    { key: 'notifyUpdates', label: '系统更新通知', type: 'toggle', defaultValue: true },
    { key: 'emailFromName', label: '发件人名称', type: 'text', placeholder: '网站名称' },
    { key: 'emailFromAddress', label: '发件人邮箱', type: 'email', placeholder: 'no-reply@example.com' },
  ],
  media: [
    { key: 'maxUploadSize', label: '最大上传大小', type: 'select', options: [
      { value: '2', label: '2 MB' },
      { value: '5', label: '5 MB' },
      { value: '10', label: '10 MB' },
      { value: '50', label: '50 MB' },
    ]},
    { key: 'autoResizeImages', label: '自动调整图片大小', type: 'toggle', defaultValue: true },
    { key: 'maxImageWidth', label: '图片最大宽度', type: 'number', min: 800, max: 4000, defaultValue: 1920 },
    { key: 'imageQuality', label: '图片质量', type: 'range', min: 50, max: 100, defaultValue: 85 },
    { key: 'generateThumbnails', label: '自动生成缩略图', type: 'toggle', defaultValue: true },
  ],
  email: [
    { key: 'smtpHost', label: 'SMTP 主机', type: 'text', placeholder: 'smtp.example.com' },
    { key: 'smtpPort', label: 'SMTP 端口', type: 'select', options: [
      { value: '25', label: '25' },
      { value: '587', label: '587 (推荐)' },
      { value: '465', label: '465 (SSL)' },
    ]},
    { key: 'smtpUser', label: 'SMTP 用户名', type: 'text', placeholder: 'user@example.com' },
    { key: 'smtpPass', label: 'SMTP 密码', type: 'password', placeholder: '输入密码' },
    { key: 'smtpSecure', label: '启用SSL/TLS', type: 'toggle', defaultValue: false },
    { key: 'smtpFrom', label: '发件人地址', type: 'email', placeholder: 'no-reply@yourdomain.com' },
  ],
  performance: [
    { key: 'enableCaching', label: '启用缓存', type: 'toggle', defaultValue: true },
    { key: 'cacheDuration', label: '缓存时长', type: 'select', options: [
      { value: '3600', label: '1小时' },
      { value: '21600', label: '6小时' },
      { value: '86400', label: '24小时' },
    ]},
    { key: 'minifyHTML', label: '压缩HTML', type: 'toggle', defaultValue: true },
    { key: 'minifyCSS', label: '压缩CSS', type: 'toggle', defaultValue: true },
    { key: 'minifyJS', label: '压缩JS', type: 'toggle', defaultValue: true },
    { key: 'lazyLoadImages', label: '图片懒加载', type: 'toggle', defaultValue: true },
  ],
  seo: [
    { key: 'metaTitle', label: 'Meta 标题', type: 'text', placeholder: '网站标题' },
    { key: 'metaDescription', label: 'Meta 描述', type: 'textarea', placeholder: '网站描述' },
    { key: 'metaKeywords', label: 'Meta 关键词', type: 'text', placeholder: '关键词1, 关键词2' },
    { key: 'canonicalUrl', label: '规范URL', type: 'url', placeholder: 'https://example.com' },
    { key: 'ogTitle', label: 'Open Graph 标题', type: 'text', placeholder: '分享标题' },
    { key: 'ogDescription', label: 'Open Graph 描述', type: 'textarea', placeholder: '分享描述' },
    { key: 'ogImage', label: 'Open Graph 图片', type: 'url', placeholder: 'https://example.com/image.jpg' },
    { key: 'twitterCard', label: 'Twitter 卡片类型', type: 'select', options: [
      { value: 'summary', label: '摘要' },
      { value: 'summary_large_image', label: '大图摘要' },
    ]},
    { key: 'twitterSite', label: 'Twitter 账号', type: 'text', placeholder: '@username' },
  ],
  integrations: [
    { key: 'googleAnalytics', label: 'Google Analytics ID', type: 'text', placeholder: 'UA-XXXXX-X 或 G-XXXXXXX' },
    { key: 'googleTagManager', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXXX' },
    { key: 'hotjar', label: 'Hotjar ID', type: 'text', placeholder: '123456' },
    { key: 'matomo', label: 'Matomo URL', type: 'url', placeholder: 'https://analytics.example.com' },
  ],
  customCode: [
    { key: 'customCSS', label: '自定义 CSS', type: 'code', language: 'css', placeholder: '/* 在此添加自定义CSS */\n.my-class {\n  color: red;\n}' },
    { key: 'customJS', label: '自定义 JavaScript', type: 'code', language: 'javascript', placeholder: '// 在此添加自定义JavaScript\nconsole.log("Hello!");' },
    { key: 'headCode', label: '头部代码 (<head>)', type: 'code', language: 'html', placeholder: '<!-- 在此添加头部代码 -->' },
    { key: 'footerCode', label: '底部代码 (</body>)', type: 'code', language: 'html', placeholder: '<!-- 在此添加底部代码 -->' },
  ],
};

export default function Settings() {
  const { settings, updateSettings, posts, comments } = useData();
  const [notifications, setNotifications] = useState([]);
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('settingsActiveTab');
    return saved || 'general';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(() => filterSettings(settings));
  const [hasChanges, setHasChanges] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [customCSS, setCustomCSS] = useState(formData.customCSS || '');
  const [customJS, setCustomJS] = useState(formData.customJS || '');
  const [headCode, setHeadCode] = useState(formData.headCode || '');
  const [footerCode, setFooterCode] = useState(formData.footerCode || '');
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data || []);
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
      const settingsToSave = {
        ...filterSettings(formData),
        customCSS,
        customJS,
        headCode,
        footerCode,
      };
      await updateSettings(settingsToSave);
      setHasChanges(false);
      showToast('设置已保存！', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      showToast('保存设置时发生错误', 'error');
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: '重置设置',
      message: '确定要重置所有设置吗？这将恢复默认设置。',
    });
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
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

      case 'toggle':
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

      case 'code':
        const codeValue = setting.key === 'customCSS' ? customCSS : 
                         setting.key === 'customJS' ? customJS :
                         setting.key === 'headCode' ? headCode : footerCode;
        const setCodeValue = setting.key === 'customCSS' ? setCustomCSS :
                            setting.key === 'customJS' ? setCustomJS :
                            setting.key === 'headCode' ? setHeadCode : setFooterCode;
        return (
          <textarea
            value={codeValue || ''}
            onChange={(e) => {
              setCodeValue(e.target.value);
              setHasChanges(true);
            }}
            placeholder={setting.placeholder}
            rows={10}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
        );

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
                {settingCategories[activeTab]?.map(setting => (
                  <div key={setting.key} className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex-1 pr-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {setting.label}
                      </label>
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
  );
}