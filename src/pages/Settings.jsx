import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Palette, Shield, Bell, Mail, Key, Save, RotateCcw, Database, Trash2 } from 'lucide-react';
import { DataStore } from '../utils/dataStore';

export default function Settings({ settings, onSave }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(settings || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setHasChanges(true);
  };

  const handleNestedChange = (parentKey, key, value) => {
    setFormData({
      ...formData,
      [parentKey]: {
        ...formData[parentKey],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置吗？这将恢复默认设置。')) {
      DataStore.reset();
      window.location.reload();
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('警告：这将删除所有数据，包括文章、页面、用户、媒体文件和设置。此操作不可恢复！确定要继续吗？')) {
      DataStore.remove('happyhome_posts');
      DataStore.remove('happyhome_pages');
      DataStore.remove('happyhome_users');
      DataStore.remove('happyhome_media');
      DataStore.remove('happyhome_settings');
      DataStore.remove('happyhome_tutorial');
      DataStore.initialize();
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'general', label: '常规设置', icon: SettingsIcon },
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'security', label: '安全', icon: Shield },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'email', label: '邮件', icon: Mail },
    { id: 'data', label: '数据管理', icon: Database },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">常规设置</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网站名称</label>
                      <input
                        type="text"
                        value={formData.siteName || ''}
                        onChange={(e) => handleChange('siteName', e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网站描述</label>
                      <textarea
                        value={formData.siteDescription || ''}
                        onChange={(e) => handleChange('siteDescription', e.target.value)}
                        rows={3}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网站URL</label>
                      <input
                        type="url"
                        value={formData.siteUrl || ''}
                        onChange={(e) => handleChange('siteUrl', e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">管理员邮箱</label>
                      <input
                        type="email"
                        value={formData.adminEmail || ''}
                        onChange={(e) => handleChange('adminEmail', e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时区</label>
                      <select
                        value={formData.timezone || 'Asia/Shanghai'}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                        <option value="America/New_York">America/New_York (UTC-5)</option>
                        <option value="Europe/London">Europe/London (UTC+0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">语言</label>
                      <select
                        value={formData.language || 'zh-CN'}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="zh-CN">简体中文</option>
                        <option value="zh-TW">繁体中文</option>
                        <option value="en-US">English</option>
                        <option value="ja-JP">日本語</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">外观设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">每页文章数</label>
                    <input
                      type="number"
                      value={formData.postsPerPage || 10}
                      onChange={(e) => handleChange('postsPerPage', parseInt(e.target.value))}
                      className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="50"
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">评论审核</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">新评论需要管理员审核后才能显示</p>
                    </div>
                    <button
                      onClick={() => handleChange('commentsModeration', !formData.commentsModeration)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.commentsModeration ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.commentsModeration ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">开放注册</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">允许访客注册成为网站用户</p>
                    </div>
                    <button
                      onClick={() => handleChange('registrationEnabled', !formData.registrationEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.registrationEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">安全设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">当前密码</label>
                    <input type="password" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="输入当前密码" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">新密码</label>
                    <input type="password" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="输入新密码" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认新密码</label>
                    <input type="password" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="再次输入新密码" />
                  </div>

                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">修改密码</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">通知设置</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">新评论通知</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">当有新评论时发送邮件通知</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">新用户注册通知</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">当有新用户注册时发送邮件通知</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">邮件设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP 主机</label>
                    <input type="text" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="smtp.example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP 端口</label>
                    <input type="text" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="587" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP 用户名</label>
                    <input type="text" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your-email@example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP 密码</label>
                    <input type="password" className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="密码" />
                  </div>

                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">保存邮件设置</button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">数据管理</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ 危险区域</h3>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
