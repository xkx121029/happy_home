import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon, Globe, Palette, Shield, Bell, Mail, Database,
  Layout, Type, Search, Eye, Lock, FileText, User, Server, Code,
  Cpu, Zap, Share2, MessageSquare, Image as ImageIcon, CreditCard,
  Save, RotateCcw, Trash2, Filter, X, Check, ChevronDown, ExternalLink,
  TestTube, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { smtpAPI } from '../services/api';
import { filterSettings } from '../utils/allowedSettings';
import Modal, { Toast } from '../components/Modal';
import { useModal, useToast } from '../hooks/useModal';

const settingCategories = [
  {
    id: 'general',
    label: '常规设置',
    icon: SettingsIcon,
    description: '网站基本信息',
    settings: [
      { key: 'siteName', label: '网站名称', type: 'text', placeholder: '我的网站', category: 'basic' },
      { key: 'siteDescription', label: '网站描述', type: 'textarea', placeholder: '这是一个很棒的网站', category: 'basic' },
      { key: 'siteUrl', label: '网站URL', type: 'url', placeholder: 'https://example.com', category: 'basic' },
      { key: 'tagline', label: '网站标语', type: 'text', placeholder: '简单而强大', category: 'basic' },
      { key: 'adminEmail', label: '管理员邮箱', type: 'email', placeholder: 'admin@example.com', category: 'contact' },
      { key: 'timezone', label: '时区', type: 'select', options: [
        { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
        { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
        { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8)' },
      ], category: 'basic' },
      { key: 'language', label: '语言', type: 'select', options: [
        { value: 'zh-CN', label: '简体中文' },
        { value: 'zh-TW', label: '繁体中文' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'ja-JP', label: '日本語' },
      ], category: 'basic' },
      { key: 'dateFormat', label: '日期格式', type: 'select', options: [
        { value: 'Y-m-d', label: 'YYYY-MM-DD' },
        { value: 'd/m/Y', label: 'DD/MM/YYYY' },
        { value: 'm/d/Y', label: 'MM/DD/YYYY' },
        { value: 'Y年m月d日', label: 'YYYY年MM月DD日' },
      ], category: 'basic' },
      { key: 'timeFormat', label: '时间格式', type: 'select', options: [
        { value: '24h', label: '24小时制' },
        { value: '12h', label: '12小时制' },
      ], category: 'basic' },
    ]
  },
  {
    id: 'appearance',
    label: '外观',
    icon: Palette,
    description: '网站外观和主题',
    settings: [
      { key: 'theme', label: '主题', type: 'select', options: [
        { value: 'default', label: '默认主题' },
        { value: 'dark', label: '深色主题' },
        { value: 'light', label: '浅色主题' },
        { value: 'ocean', label: '海洋蓝' },
        { value: 'forest', label: '森林绿' },
        { value: 'sunset', label: '日落橙' },
      ], category: 'theme' },
      { key: 'primaryColor', label: '主色调', type: 'color', defaultValue: '#3b82f6', category: 'colors' },
      { key: 'secondaryColor', label: '次要色', type: 'color', defaultValue: '#8b5cf6', category: 'colors' },
      { key: 'accentColor', label: '强调色', type: 'color', defaultValue: '#ec4899', category: 'colors' },
      { key: 'backgroundColor', label: '背景色', type: 'color', defaultValue: '#f9fafb', category: 'colors' },
      { key: 'textColor', label: '文本色', type: 'color', defaultValue: '#1f2937', category: 'colors' },
      { key: 'fontFamily', label: '字体', type: 'select', options: [
        { value: 'system', label: '系统默认' },
        { value: 'serif', label: '宋体/Serif' },
        { value: 'sans-serif', label: '黑体/Sans-serif' },
        { value: 'monospace', label: '等宽字体' },
      ], category: 'typography' },
      { key: 'fontSize', label: '字体大小', type: 'range', min: 12, max: 24, defaultValue: 16, category: 'typography' },
      { key: 'lineHeight', label: '行高', type: 'range', min: 1, max: 2.5, step: 0.1, defaultValue: 1.6, category: 'typography' },
      { key: 'layout', label: '布局', type: 'select', options: [
        { value: 'wide', label: '宽屏' },
        { value: 'boxed', label: '盒装' },
        { value: 'full', label: '全宽' },
      ], category: 'layout' },
      { key: 'sidebarPosition', label: '侧边栏位置', type: 'select', options: [
        { value: 'left', label: '左侧' },
        { value: 'right', label: '右侧' },
      ], category: 'layout' },
    ]
  },
  {
    id: 'content',
    label: '内容',
    icon: FileText,
    description: '文章和页面设置',
    settings: [
      { key: 'postsPerPage', label: '每页文章数', type: 'number', min: 5, max: 100, defaultValue: 10, category: 'posts' },
      { key: 'postsPerFeed', label: 'Feed文章数', type: 'number', min: 10, max: 50, defaultValue: 20, category: 'posts' },
      { key: 'excerptLength', label: '摘要长度', type: 'number', min: 50, max: 500, defaultValue: 150, category: 'posts' },
      { key: 'enableComments', label: '启用评论', type: 'toggle', defaultValue: true, category: 'discussion' },
      { key: 'commentsModeration', label: '评论审核', type: 'toggle', defaultValue: true, category: 'discussion' },
      { key: 'allowGuestComments', label: '允许访客评论', type: 'toggle', defaultValue: false, category: 'discussion' },
      { key: 'requireNameEmail', label: '评论必填姓名邮箱', type: 'toggle', defaultValue: true, category: 'discussion' },
      { key: 'autoApproval', label: '自动通过老用户评论', type: 'toggle', defaultValue: true, category: 'discussion' },
      { key: 'enableRevisions', label: '启用文章修订', type: 'toggle', defaultValue: true, category: 'posts' },
      { key: 'revisionLimit', label: '保留修订数量', type: 'number', min: 0, max: 100, defaultValue: 25, category: 'posts' },
      { key: 'defaultPostStatus', label: '默认文章状态', type: 'select', options: [
        { value: 'draft', label: '草稿' },
        { value: 'pending', label: '待审核' },
        { value: 'published', label: '已发布' },
      ], category: 'posts' },
      { key: 'enablePingbacks', label: '启用Pingback', type: 'toggle', defaultValue: true, category: 'discussion' },
    ]
  },
  {
    id: 'users',
    label: '用户',
    icon: User,
    description: '用户注册和权限',
    settings: [
      { key: 'registrationEnabled', label: '开放注册', type: 'toggle', defaultValue: false, category: 'registration' },
      { key: 'defaultRole', label: '新用户默认角色', type: 'select', options: [
        { value: 'subscriber', label: '订阅者' },
        { value: 'author', label: '作者' },
        { value: 'editor', label: '编辑' },
      ], category: 'registration' },
      { key: 'emailVerification', label: '邮箱验证', type: 'toggle', defaultValue: true, category: 'registration' },
      { key: 'moderateNewUsers', label: '新用户审核', type: 'toggle', defaultValue: false, category: 'registration' },
      { key: 'enableAvatars', label: '启用头像', type: 'toggle', defaultValue: true, category: 'profile' },
      { key: 'avatarType', label: '头像类型', type: 'select', options: [
        { value: 'gravatar', label: 'Gravatar' },
        { value: 'local', label: '本地上传' },
      ], category: 'profile' },
      { key: 'enableProfileFields', label: '启用个人资料字段', type: 'toggle', defaultValue: true, category: 'profile' },
      { key: 'enableUserBio', label: '启用用户简介', type: 'toggle', defaultValue: true, category: 'profile' },
    ]
  },
  {
    id: 'security',
    label: '安全',
    icon: Shield,
    description: '安全和隐私',
    settings: [
      { key: 'showQuickLoginButton', label: '显示快速登录按钮', type: 'toggle', defaultValue: true, category: 'security' },
      { key: 'twoFactorAuth', label: '两步验证', type: 'toggle', defaultValue: false, category: 'security' },
      { key: 'loginLimit', label: '登录限制', type: 'select', options: [
        { value: 'none', label: '无限制' },
        { value: '5', label: '5次/分钟' },
        { value: '10', label: '10次/分钟' },
        { value: '20', label: '20次/分钟' },
      ], category: 'security' },
      { key: 'sessionTimeout', label: '会话超时', type: 'select', options: [
        { value: '1', label: '1小时' },
        { value: '6', label: '6小时' },
        { value: '24', label: '24小时' },
        { value: '168', label: '7天' },
      ], category: 'security' },
      { key: 'enableSSL', label: '强制HTTPS', type: 'toggle', defaultValue: false, category: 'security' },
      { key: 'allowFileEdits', label: '允许在线编辑文件', type: 'toggle', defaultValue: false, category: 'security' },
      { key: 'enableDebug', label: '启用调试模式', type: 'toggle', defaultValue: false, category: 'advanced' },
      { key: 'errorReporting', label: '错误报告', type: 'toggle', defaultValue: true, category: 'advanced' },
    ]
  },
  {
    id: 'notifications',
    label: '通知',
    icon: Bell,
    description: '邮件和推送通知',
    settings: [
      { key: 'notifyNewComment', label: '新评论通知', type: 'toggle', defaultValue: true, category: 'email' },
      { key: 'notifyNewUser', label: '新用户注册通知', type: 'toggle', defaultValue: true, category: 'email' },
      { key: 'notifyPostApproval', label: '文章待审核通知', type: 'toggle', defaultValue: true, category: 'email' },
      { key: 'notifyUpdates', label: '系统更新通知', type: 'toggle', defaultValue: true, category: 'email' },
      { key: 'notifySecurity', label: '安全警告通知', type: 'toggle', defaultValue: true, category: 'email' },
      { key: 'emailFormat', label: '邮件格式', type: 'select', options: [
        { value: 'html', label: 'HTML' },
        { value: 'plain', label: '纯文本' },
      ], category: 'email' },
      { key: 'emailFromName', label: '发件人名称', type: 'text', placeholder: '网站名称', category: 'email' },
      { key: 'emailFromAddress', label: '发件人邮箱', type: 'email', placeholder: 'no-reply@example.com', category: 'email' },
    ]
  },
  {
    id: 'media',
    label: '媒体',
    icon: ImageIcon,
    description: '媒体文件设置',
    settings: [
      { key: 'maxUploadSize', label: '最大上传大小', type: 'select', options: [
        { value: '2', label: '2 MB' },
        { value: '5', label: '5 MB' },
        { value: '10', label: '10 MB' },
        { value: '50', label: '50 MB' },
        { value: '100', label: '100 MB' },
      ], category: 'upload' },
      { key: 'allowedFileTypes', label: '允许的文件类型', type: 'checkbox', options: [
        { value: 'images', label: '图片', checked: true },
        { value: 'documents', label: '文档', checked: true },
        { value: 'videos', label: '视频', checked: false },
        { value: 'audio', label: '音频', checked: false },
      ], category: 'upload' },
      { key: 'autoResizeImages', label: '自动调整图片大小', type: 'toggle', defaultValue: true, category: 'image' },
      { key: 'maxImageWidth', label: '图片最大宽度', type: 'number', min: 800, max: 4000, defaultValue: 1920, category: 'image' },
      { key: 'maxImageHeight', label: '图片最大高度', type: 'number', min: 600, max: 3000, defaultValue: 1080, category: 'image' },
      { key: 'imageQuality', label: '图片质量', type: 'range', min: 50, max: 100, defaultValue: 85, category: 'image' },
      { key: 'generateThumbnails', label: '自动生成缩略图', type: 'toggle', defaultValue: true, category: 'image' },
    ]
  },
  {
    id: 'email',
    label: '邮件',
    icon: Mail,
    description: 'SMTP邮件服务',
    settings: [
      { key: 'smtpHost', label: 'SMTP 主机', type: 'text', placeholder: 'smtp.example.com', category: 'smtp' },
      { key: 'smtpPort', label: 'SMTP 端口', type: 'select', options: [
        { value: '25', label: '25' },
        { value: '587', label: '587 (推荐)' },
        { value: '465', label: '465 (SSL)' },
      ], category: 'smtp' },
      { key: 'smtpUser', label: 'SMTP 用户名', type: 'text', placeholder: 'user@example.com', category: 'smtp' },
      { key: 'smtpPass', label: 'SMTP 密码', type: 'password', placeholder: '输入密码', category: 'smtp' },
      { key: 'smtpSecure', label: '启用SSL/TLS', type: 'toggle', defaultValue: false, category: 'smtp' },
      { key: 'smtpFrom', label: '发件人地址', type: 'email', placeholder: 'no-reply@yourdomain.com', category: 'smtp' },
    ]
  },
  {
    id: 'performance',
    label: '性能',
    icon: Zap,
    description: '缓存和优化',
    settings: [
      { key: 'enableCaching', label: '启用缓存', type: 'toggle', defaultValue: true, category: 'cache' },
      { key: 'cacheDuration', label: '缓存时长', type: 'select', options: [
        { value: '3600', label: '1小时' },
        { value: '21600', label: '6小时' },
        { value: '86400', label: '24小时' },
        { value: '604800', label: '7天' },
      ], category: 'cache' },
      { key: 'minifyHTML', label: '压缩HTML', type: 'toggle', defaultValue: true, category: 'optimization' },
      { key: 'minifyCSS', label: '压缩CSS', type: 'toggle', defaultValue: true, category: 'optimization' },
      { key: 'minifyJS', label: '压缩JS', type: 'toggle', defaultValue: true, category: 'optimization' },
      { key: 'lazyLoadImages', label: '图片懒加载', type: 'toggle', defaultValue: true, category: 'optimization' },
      { key: 'enableGzip', label: '启用Gzip压缩', type: 'toggle', defaultValue: true, category: 'optimization' },
    ]
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: Search,
    description: '搜索引擎优化',
    settings: [
      { key: 'metaTitle', label: 'Meta 标题', type: 'text', placeholder: '网站标题', category: 'meta' },
      { key: 'metaDescription', label: 'Meta 描述', type: 'textarea', placeholder: '网站描述', category: 'meta' },
      { key: 'metaKeywords', label: 'Meta 关键词', type: 'text', placeholder: '关键词1, 关键词2', category: 'meta' },
      { key: 'canonicalUrl', label: '规范URL', type: 'url', placeholder: 'https://example.com', category: 'meta' },
      { key: 'twitterCard', label: 'Twitter 卡片类型', type: 'select', options: [
        { value: 'summary', label: '摘要' },
        { value: 'summary_large_image', label: '大图摘要' },
      ], category: 'social' },
      { key: 'twitterSite', label: 'Twitter 账号', type: 'text', placeholder: '@username', category: 'social' },
      { key: 'twitterCreator', label: 'Twitter 创建者', type: 'text', placeholder: '@username', category: 'social' },
      { key: 'ogTitle', label: 'Open Graph 标题', type: 'text', placeholder: '分享标题', category: 'social' },
      { key: 'ogDescription', label: 'Open Graph 描述', type: 'textarea', placeholder: '分享描述', category: 'social' },
      { key: 'ogType', label: 'Open Graph 类型', type: 'select', options: [
        { value: 'website', label: '网站' },
        { value: 'article', label: '文章' },
        { value: 'product', label: '产品' },
      ], category: 'social' },
      { key: 'ogImage', label: 'Open Graph 图片', type: 'url', placeholder: 'https://example.com/image.jpg', category: 'social' },
    ]
  },
  {
    id: 'integrations',
    label: '集成',
    icon: Share2,
    description: '第三方服务集成',
    settings: [
      { key: 'googleAnalytics', label: 'Google Analytics ID', type: 'text', placeholder: 'UA-XXXXX-X', category: 'tracking' },
      { key: 'googleTagManager', label: 'Google Tag Manager ID', type: 'text', placeholder: 'GTM-XXXXX', category: 'tracking' },
      { key: 'hotjar', label: 'Hotjar ID', type: 'text', placeholder: '123456', category: 'tracking' },
      { key: 'matomo', label: 'Matomo URL', type: 'url', placeholder: 'https://analytics.example.com', category: 'tracking' },
    ]
  },
  {
    id: 'backup',
    label: '备份',
    icon: Database,
    description: '数据备份设置',
    settings: [
      { key: 'enableBackup', label: '启用自动备份', type: 'toggle', defaultValue: true, category: 'backup' },
      { key: 'backupSchedule', label: '备份频率', type: 'select', options: [
        { value: 'daily', label: '每天' },
        { value: 'weekly', label: '每周' },
        { value: 'monthly', label: '每月' },
      ], category: 'backup' },
      { key: 'backupRetention', label: '备份保留', type: 'select', options: [
        { value: '7', label: '7天' },
        { value: '30', label: '30天' },
        { value: '90', label: '90天' },
        { value: '365', label: '一年' },
      ], category: 'backup' },
    ]
  },
];

export default function Settings({ settings, posts, pages, categories, tags, onSave }) {
  const { clearAllData } = useData();
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('settingsActiveTab');
    return saved || 'general';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(() => {
    const filteredSettings = filterSettings(settings);
    if (!filteredSettings.theme) {
      filteredSettings.theme = {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#8b5cf6',
          background: '#ffffff',
          text: '#1f2937',
        },
        font: 'system',
        layout: 'wide',
      };
    }
    return filteredSettings;
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);

  const activeCategory = settingCategories.find(cat => cat.id === activeTab);

  const filteredSettings = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeCategory?.settings || [];
    }
    const query = searchQuery.toLowerCase();
    return settingCategories.flatMap(cat => 
      cat.settings.filter(setting => 
        setting.label.toLowerCase().includes(query) ||
        setting.key.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, activeCategory, activeTab]);

  const groupedSettings = useMemo(() => {
    const groups = {};
    filteredSettings.forEach(setting => {
      const category = setting.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(setting);
    });
    return groups;
  }, [filteredSettings]);

  const categoryLabels = {
    basic: '基本信息',
    contact: '联系方式',
    theme: '主题',
    colors: '颜色',
    typography: '排版',
    layout: '布局',
    posts: '文章',
    discussion: '讨论',
    registration: '注册',
    profile: '个人资料',
    password: '密码',
    security: '安全',
    advanced: '高级',
    email: '邮件',
    upload: '上传',
    image: '图片',
    smtp: 'SMTP',
    cache: '缓存',
    optimization: '优化',
    meta: 'Meta标签',
    social: '社交',
    tracking: '跟踪',
    services: '服务',
    accounts: '账号',
    general: '常规',
    google: 'Google',
    backup: '备份',
    other: '其他',
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleChange = (key, value) => {
    setFormData(prevFormData => ({ ...prevFormData, [key]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parentKey, key, value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [parentKey]: {
        ...prevFormData[parentKey],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      const settingsToSave = filterSettings(formData);
      await onSave(settingsToSave);
      setHasChanges(false);
      showToast('设置已保存！', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      showToast('保存设置时发生错误，请重试', 'error');
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

  const handleClearAllData = async () => {
    const confirmed = await confirm({
      title: '清除所有数据',
      message: '警告：这将删除所有数据，包括文章、页面、用户、媒体文件和设置。此操作不可恢复！确定要继续吗？',
    });
    if (confirmed) {
      clearAllData();
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
            key={setting.key}
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
            key={setting.key}
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
            key={setting.key}
            type="number"
            value={value || setting.defaultValue || ''}
            onChange={(e) => handleChange(setting.key, parseInt(e.target.value))}
            min={setting.min}
            max={setting.max}
            className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'password':
        return (
          <input
            key={setting.key}
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
            key={setting.key}
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
          <div key={setting.key} className="flex gap-3 items-center">
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
          <div key={setting.key} className="w-full max-w-md">
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
            key={setting.key}
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

      case 'checkbox':
        const checkboxValue = value || {};
        return (
          <div key={setting.key} className="space-y-2">
            {setting.options.map(option => {
              const isChecked = checkboxValue[option.value] ?? option.checked ?? false;
              return (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setFormData(prevFormData => {
                        const prevValue = prevFormData[setting.key] || {};
                        const newValue = {
                          ...prevValue,
                          [option.value]: e.target.checked
                        };
                        return { ...prevFormData, [setting.key]: newValue };
                      });
                      setHasChanges(true);
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
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

      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索设置..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {searchQuery ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              搜索结果 ({filteredSettings.length})
            </h2>
          </div>
          
          {filteredSettings.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                <div key={group} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                    {categoryLabels[group] || group}
                  </h3>
                  <div className="space-y-4">
                    {groupSettings.map(setting => (
                      <div key={setting.key} className="flex items-start justify-between py-2">
                        <div className="flex-1">
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              没有找到匹配的设置
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {settingCategories.map(category => {
                const Icon = category.icon;
                const isActive = activeTab === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{category.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const Icon = activeCategory?.icon || SettingsIcon;
                    return <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
                  })()}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activeCategory?.label}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeCategory?.description}
                </p>
              </div>

              {activeTab === 'data' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{posts?.length || 0}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">文章</div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{pages?.length || 0}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">页面</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{categories?.length || 0}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">分类</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tags?.length || 0}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">标签</div>
                    </div>
                  </div>

                  {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                    <div key={group} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                      <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {categoryLabels[group] || group}
                      </h3>
                      <div className="space-y-4">
                        {groupSettings.map(setting => (
                          <div key={setting.key} className="flex items-start justify-between py-2">
                            <div className="flex-1">
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
                    </div>
                  ))}

                  {activeTab === 'email' && (
                    <div className="pt-6">
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
                                <TestTube className="w-4 h-4" />
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

                  <div className="pt-6">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">危险区域</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
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
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                    <div key={group} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                      <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {categoryLabels[group] || group}
                      </h3>
                      <div className="space-y-4">
                        {groupSettings.map(setting => (
                          <div key={setting.key} className="flex items-start justify-between py-2">
                            <div className="flex-1">
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
                    </div>
                  ))}

                  {activeTab === 'email' && (
                    <div className="pt-6">
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
                                <TestTube className="w-4 h-4" />
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
                </div>
              )}
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
  );
}
