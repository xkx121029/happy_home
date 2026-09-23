import { useState, useEffect } from 'react';
import {
  Share2, Save, RotateCcw, Check, ExternalLink, Globe, Link2, Eye, MousePointer
} from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { useSiteSettings } from '../state/SiteSettingsContext';

/** 默认分享设置。原来初始化和重置各写了一份重复字面量，改一处必然漏另一处。 */
const DEFAULT_SOCIAL_SHARE = {
  enabled: true,
  platforms: ['wechat', 'weibo', 'qq', 'qzone', 'facebook', 'twitter', 'linkedin'],
  position: 'bottom',
  style: 'circle',
  size: 'medium',
  showLabel: false,
  customTitle: '分享这篇文章',
  customMessage: '',
};

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
  const { settings: siteSettings, updateSettings } = useSiteSettings();
  const [settings, setSettings] = useState({ ...DEFAULT_SOCIAL_SHARE });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // 原来这里存的是 localStorage，而白名单里的 twitterEnabled / facebookEnabled
  // 又是另一套（无表单、无读者）—— 两处都跟「前台真的渲染什么」没有关系：
  // PublicPostDetail 当时把平台列表、样式、尺寸、是否显示文字全部写死在 JSX 里，
  // 所以这一页调什么都没用。现在统一进 settings.socialShare，前台从它渲染。
  useEffect(() => {
    if (siteSettings?.socialShare) {
      setSettings({ ...DEFAULT_SOCIAL_SHARE, ...siteSettings.socialShare });
    }
  }, [siteSettings?.socialShare]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ socialShare: settings });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('保存分享设置失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('确定要重置所有分享设置为默认值吗？')) return;
    setSettings({ ...DEFAULT_SOCIAL_SHARE });
    try {
      await updateSettings({ socialShare: { ...DEFAULT_SOCIAL_SHARE } });
      setHasChanges(false);
    } catch (err) {
      console.error('重置分享设置失败:', err);
    }
  };

  const previewTitle = '示例文章标题';
  const previewExcerpt = '这是文章的摘要内容';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">社交分享设置</h1>
          <p className="text-muted mt-1">配置社交媒体分享功能</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-muted  hover:bg-surface-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2${
              hasChanges && !saving
                ? 'bg-accent text-accent-fg hover:bg-accent-700'
                : 'bg-surface-2 text-muted cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h2 className="text-lg font-semibold text-fg mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              常规设置
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-fg">启用分享按钮</label>
                  <p className="text-sm text-muted mt-1">在文章底部显示分享按钮</p>
                </div>
                <button
                  onClick={() => handleToggle('enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors${
                    settings.enabled ? 'bg-accent' : 'bg-line'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-fg">显示分享文字</label>
                  <p className="text-sm text-muted mt-1">在分享按钮旁显示文字</p>
                </div>
                <button
                  onClick={() => handleToggle('showLabel')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors${
                    settings.showLabel ? 'bg-accent' : 'bg-line'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform${
                    settings.showLabel ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">
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
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all${
                      isSelected
                        ? 'border-accent bg-accent/12'
                        : 'border-line hover:border-line'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: platform.color + '20' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: platform.color }} />
                    </div>
                    <span className="text-sm font-medium text-fg">
                      {platform.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-accent ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Settings */}
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">
              样式设置
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-fg mb-3">
                  按钮样式
                </label>
                <div className="flex gap-2">
                  {styleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectChange('style', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors${
                        settings.style === option.value
                          ? 'border-accent bg-accent/12  text-accent'
                          : 'border-line text-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-3">
                  按钮大小
                </label>
                <div className="flex gap-2">
                  {sizeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectChange('size', option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors${
                        settings.size === option.value
                          ? 'border-accent bg-accent/12  text-accent'
                          : 'border-line text-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-3">
                  显示位置
                </label>
                <div className="flex gap-2">
                  {positionOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectChange('position', option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2${
                          settings.position === option.value
                            ? 'border-accent bg-accent/12  text-accent'
                            : 'border-line text-muted'
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
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">
              自定义文案
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-2">
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
                  className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-fg mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              预览
            </h2>

            <div className="p-4 bg-bg  rounded-xl">
              <div className="text-sm text-muted mb-3">预览效果</div>
              <div className="mb-3">
                <h3 className="font-medium text-fg">{previewTitle}</h3>
                <p className="text-sm text-muted mt-1">{previewExcerpt}</p>
              </div>

              <div className={`mt-4${settings.position === 'top' ? 'border-t pt-4' : ''}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  {settings.showLabel && (
                    <span className="text-sm text-muted mr-2">分享到：</span>
                  )}

                  {settings.platforms.slice(0, 4).map(platformId => {
                    const platform = platformOptions.find(p => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;

                    return (
                      <button
                        key={platform.id}
                        className={`flex items-center justify-center${
                          settings.size === 'small' ? 'w-8 h-8' :
                          settings.size === 'large' ? 'w-12 h-12' : 'w-10 h-10'
                        } ${settings.style === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-surface-2`}
                      >
                        <Icon className={`${
                          settings.size === 'small' ? 'w-4 h-4' :
                          settings.size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
                        } text-muted`} />
                      </button>
                    );
                  })}

                  <button
                    className={`flex items-center justify-center${
                      settings.size === 'small' ? 'w-8 h-8' :
                      settings.size === 'large' ? 'w-12 h-12' : 'w-10 h-10'
                    } ${settings.style === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-surface-2`}
                  >
                    <Link2 className={`${
                      settings.size === 'small' ? 'w-4 h-4' :
                      settings.size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
                    } text-muted`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-accent/12  rounded-lg">
              <p className="text-sm text-accent">
                提示：预览仅为示意，实际效果可能略有差异
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
