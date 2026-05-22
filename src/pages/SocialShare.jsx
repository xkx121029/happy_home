import { useState, useEffect } from 'react';
import {
  Share2, Save, RotateCcw, Check, ExternalLink, Globe, Link2, Eye, MousePointer
} from 'lucide-react';
import SocialShare from '../components/SocialShare';

const platformOptions = [
  { id: 'wechat', name: '微信', icon: Share2, color: '#07c160' },
  { id: 'weibo', name: '微博', icon: Share2, color: '#e6162d' },
  { id: 'qq', name: 'QQ', icon: Share2, color: '#1296db' },
  { id: 'qzone', name: 'QQ空间', icon: Share2, color: '#ffc107' },
  { id: 'facebook', name: 'Facebook', icon: ExternalLink, color: '#1877f2' },
  { id: 'twitter', name: 'Twitter', icon: ExternalLink, color: '#1da1f2' },
  { id: 'linkedin', name: 'LinkedIn', icon: ExternalLink, color: '#0a66c2' },
];

const positionOptions = [
  { value: 'top', label: '文章顶部', icon: MousePointer },
  { value: 'bottom', label: '文章底部', icon: Eye },
];

const styleOptions = [
  { value: 'circle', label: '圆形' },
  { value: 'square', label: '方形' },
];

const sizeOptions = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
];

export default function SocialShareSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    platforms: ['wechat', 'weibo', 'qq', 'qzone', 'facebook', 'twitter', 'linkedin'],
    position: 'bottom',
    style: 'circle',
    size: 'medium',
    showLabel: false,
    customTitle: '分享这篇文章',
    customMessage: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('happyhome_social_share_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse social share settings');
      }
    }
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleTogglePlatform = (platformId) => {
    setSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId],
    }));
    setHasChanges(true);
  };

  const handleSelectChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('happyhome_social_share_settings', JSON.stringify(settings));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有分享设置为默认值吗？')) {
      const defaultSettings = {
        enabled: true,
        platforms: ['wechat', 'weibo', 'qq', 'qzone', 'facebook', 'twitter', 'linkedin'],
        position: 'bottom',
        style: 'circle',
        size: 'medium',
        showLabel: false,
        customTitle: '分享这篇文章',
        customMessage: '',
      };
      setSettings(defaultSettings);
      localStorage.setItem('happyhome_social_share_settings', JSON.stringify(defaultSettings));
      setHasChanges(false);
    }
  };

  const previewUrl = `${window.location.origin}/posts/demo`;
  const previewTitle = '示例文章标题';
  const previewExcerpt = '这是文章的摘要内容';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">社交分享设置</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">配置社交媒体分享功能</p>
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
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              常规设置
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">启用分享按钮</label>
                  <p className="text-sm text-gray-500 mt-1">在文章底部显示分享按钮</p>
                </div>
                <button
                  onClick={() => handleToggle('enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">显示分享文字</label>
                  <p className="text-sm text-gray-500 mt-1">在分享按钮旁显示文字</p>
                </div>
                <button
                  onClick={() => handleToggle('showLabel')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showLabel ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showLabel ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              选择分享平台
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platformOptions.map(platform => {
                const Icon = platform.icon;
                const isSelected = settings.platforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleTogglePlatform(platform.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: platform.color + '20' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: platform.color }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {platform.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-500 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              样式设置
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  按钮样式
                </label>
                <div className="flex gap-2">
                  {styleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectChange('style', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                        settings.style === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  按钮大小
                </label>
                <div className="flex gap-2">
                  {sizeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectChange('size', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                        settings.size === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  显示位置
                </label>
                <div className="flex gap-2">
                  {positionOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectChange('position', option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                          settings.position === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Text */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              自定义文案
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分享标题
                </label>
                <input
                  type="text"
                  value={settings.customTitle}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, customTitle: e.target.value }));
                    setHasChanges(true);
                  }}
                  placeholder="分享这篇文章"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              预览
            </h2>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-sm text-gray-500 mb-3">预览效果</div>
              <div className="mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">{previewTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">{previewExcerpt}</p>
              </div>

              <div className={`mt-4 ${settings.position === 'top' ? 'border-t pt-4' : ''}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  {settings.showLabel && (
                    <span className="text-sm text-gray-500 mr-2">分享到：</span>
                  )}

                  {settings.platforms.slice(0, 4).map(platformId => {
                    const platform = platformOptions.find(p => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;

                    return (
                      <button
                        key={platform.id}
                        className={`flex items-center justify-center ${
                          settings.size === 'small' ? 'w-8 h-8' :
                          settings.size === 'large' ? 'w-12 h-12' : 'w-10 h-10'
                        } rounded-${settings.style === 'circle' ? 'full' : 'lg'} bg-gray-200 dark:bg-gray-600`}
                      >
                        <Icon className={`${
                          settings.size === 'small' ? 'w-4 h-4' :
                          settings.size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
                        } text-gray-600 dark:text-gray-300`} />
                      </button>
                    );
                  })}

                  <button
                    className={`flex items-center justify-center ${
                      settings.size === 'small' ? 'w-8 h-8' :
                      settings.size === 'large' ? 'w-12 h-12' : 'w-10 h-10'
                    } rounded-${settings.style === 'circle' ? 'full' : 'lg'} bg-gray-200 dark:bg-gray-600`}
                  >
                    <Link2 className={`${
                      settings.size === 'small' ? 'w-4 h-4' :
                      settings.size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
                    } text-gray-600 dark:text-gray-300`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                提示：预览仅为示意，实际效果可能略有差异
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
