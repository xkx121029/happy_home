import { useState, useEffect } from 'react';
import {
  Search, Globe, Share2, Shield, Settings, Eye, Save, RotateCcw,
  Check, AlertCircle, Smartphone, Monitor, FileText
} from 'lucide-react';
import { useSiteSettings } from '../state/SiteSettingsContext';

export default function SEO() {
  const { settings, updateSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState('basic');
  const [seo, setSeo] = useState({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    googleAnalytics: '',
    googleTagManager: '',
    hotjar: '',
    matomo: '',
    bingVerification: '',
    baiduVerification: '',
    robots: 'index, follow',
    canonical: true,
    noIndex: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.seo) {
      setSeo(settings.seo);
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setSeo(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      // 后端 PUT /settings 是「合并」语义，只传 seo 不会清掉其它设置项。
      // 原来这里既不 await 也不处理失败，无论结果如何都显示"已保存"。
      await updateSettings({ seo });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('保存 SEO 设置失败:', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有SEO设置吗？')) {
      setSeo({
        siteTitle: '',
        siteDescription: '',
        siteKeywords: '',
        ogImage: '',
        googleAnalytics: '',
        bingVerification: '',
        baiduVerification: '',
        robots: 'index, follow',
        canonical: true,
        noIndex: false,
      });
      setHasChanges(true);
    }
  };

  const tabs = [
    { id: 'basic', label: '基本SEO', icon: Search, description: '网站标题、描述和关键字' },
    { id: 'social', label: '社交分享', icon: Share2, description: 'Open Graph 和 Twitter Cards' },
    { id: 'verification', label: '站长验证', icon: Shield, description: 'Google、Bing、百度验证' },
    { id: 'advanced', label: '高级设置', icon: Settings, description: 'robots.txt、canonical 等' },
    { id: 'preview', label: '预览', icon: Eye, description: 'Google搜索结果预览' },
  ];

  const renderGooglePreview = () => {
    const title = seo.siteTitle || settings?.siteName || '网站标题';
    const description = seo.siteDescription || settings?.siteDescription || '网站描述将在此处显示...';
    const url = settings?.siteUrl || 'https://example.com';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Google 搜索结果预览
        </h3>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="text-lg text-blue-600 hover:underline cursor-pointer truncate">
            {title}
          </div>
          <div className="text-green-600 text-sm truncate">
            {url}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {description}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              桌面端预览
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>标题字符建议：50-60字符</p>
              <p>当前：{title.length} 字符</p>
              {title.length > 60 && (
                <p className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  标题过长，可能被截断
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              移动端预览
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>描述字符建议：150-160字符</p>
              <p>当前：{description.length} 字符</p>
              {description.length > 160 && (
                <p className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  描述过长，可能被截断
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          网站标题
        </label>
        <input
          type="text"
          value={seo.siteTitle}
          onChange={(e) => handleChange('siteTitle', e.target.value)}
          placeholder={settings?.siteName || '我的网站'}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500">将显示在搜索结果中的标题，建议50-60个字符</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          网站描述
        </label>
        <textarea
          value={seo.siteDescription}
          onChange={(e) => handleChange('siteDescription', e.target.value)}
          placeholder={settings?.siteDescription || '描述您的网站'}
          rows={4}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">将显示在搜索结果中的描述，建议150-160个字符</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          关键字
        </label>
        <textarea
          value={seo.siteKeywords}
          onChange={(e) => handleChange('siteKeywords', e.target.value)}
          placeholder="关键字1, 关键字2, 关键字3"
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">用逗号分隔关键字，虽然现代搜索引擎不太重视但仍建议填写</p>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Open Graph 标签</h3>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          Open Graph 标签用于控制在社交媒体（如 Facebook、微信）分享时显示的内容。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Open Graph 图片
        </label>
        <input
          type="text"
          value={seo.ogImage}
          onChange={(e) => handleChange('ogImage', e.target.value)}
          placeholder="https://example.com/og-image.jpg"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500">建议尺寸：1200x630 像素</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">社交分享预览</h4>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {seo.ogImage ? (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
              <img src={seo.ogImage} alt="OG Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
          ) : (
            <div className="aspect-video bg-surface-2 flex items-center justify-center">
              <FileText className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          <div className="p-3">
            <div className="text-sm text-gray-500 uppercase tracking-wide">{settings?.siteUrl || 'example.com'}</div>
            <div className="font-medium text-gray-900 dark:text-white">{seo.siteTitle || settings?.siteName || '网站标题'}</div>
            <div className="text-sm text-gray-500 line-clamp-2">{seo.siteDescription || settings?.siteDescription || '网站描述'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerificationTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">站长验证</h3>
        <p className="text-sm text-green-600 dark:text-green-300">
          添加搜索引擎站长工具的验证代码，以确认你对网站的所有权。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Google Analytics 追踪码
        </label>
        <input
          type="text"
          value={seo.googleAnalytics}
          onChange={(e) => handleChange('googleAnalytics', e.target.value)}
          placeholder="G-XXXXXXXXXX 或 UA-XXXXXXXX-X"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">在 Google Analytics 中获取您的追踪码</p>
      </div>

      {/* GTM / Hotjar / Matomo 原来在设置页的「集成」标签页里，但那份数据
          没有任何代码读取；真正被注入前台的只有 seo.googleAnalytics 一项。
          统一收到这一页之后，四个统计脚本才都有唯一且生效的入口。 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Google Tag Manager ID
        </label>
        <input
          type="text"
          value={seo.googleTagManager || ''}
          onChange={(e) => handleChange('googleTagManager', e.target.value)}
          placeholder="GTM-XXXXXXX"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">留空则不注入。与 Google Analytics 同时填写会重复统计，建议只用一个</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hotjar Site ID
        </label>
        <input
          type="text"
          value={seo.hotjar || ''}
          onChange={(e) => handleChange('hotjar', e.target.value)}
          placeholder="1234567"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Matomo 地址
        </label>
        <input
          type="text"
          value={seo.matomo || ''}
          onChange={(e) => handleChange('matomo', e.target.value)}
          placeholder="https://analytics.example.com/"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">自建 Matomo 的根地址，需以 / 结尾</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bing 验证
        </label>
        <input
          type="text"
          value={seo.bingVerification}
          onChange={(e) => handleChange('bingVerification', e.target.value)}
          placeholder="MSXXXXXXX"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">在 Bing Webmaster Tools 中获取验证代码</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          百度验证
        </label>
        <input
          type="text"
          value={seo.baiduVerification}
          onChange={(e) => handleChange('baiduVerification', e.target.value)}
          placeholder="xxxxxxxxxxxxxxx"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">在百度搜索资源平台中获取验证代码</p>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Robots.txt 内容
        </label>
        <textarea
          value={seo.robots}
          onChange={(e) => handleChange('robots', e.target.value)}
          placeholder="index, follow"
          rows={4}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">控制搜索引擎爬虫的访问行为，如：index, follow / noindex, nofollow</p>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">启用规范链接</div>
          <p className="text-sm text-gray-500">规范链接可防止重复内容问题</p>
        </div>
        <button
          onClick={() => handleChange('canonical', !seo.canonical)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${seo.canonical ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${seo.canonical ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">noindex</div>
          <p className="text-sm text-gray-500">启用后将阻止搜索引擎索引您的网站</p>
        </div>
        <button
          onClick={() => handleChange('noIndex', !seo.noIndex)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${seo.noIndex ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${seo.noIndex ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {seo.noIndex && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">警告：您的网站将被禁止索引</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            启用 noindex 将导致您的网站不会出现在搜索引擎结果中，除非您确实需要，否则不建议启用。
          </p>
        </div>
      )}
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-6">
      {renderGooglePreview()}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO 状态检查</h3>

        <div className="space-y-3">
          {[
            { label: '网站标题', value: seo.siteTitle, warning: !seo.siteTitle, suggestion: '建议设置网站标题' },
            { label: '网站描述', value: seo.siteDescription, warning: seo.siteDescription.length < 50 || seo.siteDescription.length > 160, suggestion: '描述长度建议在50-160字符之间' },
            { label: '关键字', value: seo.siteKeywords, warning: !seo.siteKeywords, suggestion: '建议填写关键字' },
            { label: 'OG图片', value: seo.ogImage, warning: !seo.ogImage, suggestion: '建议设置Open Graph图片以优化社交分享' },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-3 p-3 rounded-lg ${item.warning ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
              {item.warning ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                <div className="text-sm text-gray-500">{item.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO 设置</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">优化网站在搜索引擎中的表现</p>
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
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 标签导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left flex-1">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'social' && renderSocialTab()}
            {activeTab === 'verification' && renderVerificationTab()}
            {activeTab === 'advanced' && renderAdvancedTab()}
            {activeTab === 'preview' && renderPreviewTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
