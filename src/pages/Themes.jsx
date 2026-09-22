import { useState, useEffect } from 'react';

import { Check, Palette, Type, Layout, Sparkles, RotateCcw } from 'lucide-react';
import { Toast } from '../components/Modal';
import { useToast } from '../hooks/useModal';
import { useSiteSettings } from '../state/SiteSettingsContext';

// 字体选项改为系统字体栈里的中文友好字体。
// 原来的 Inter / Roboto 都是英文字体，没有中文字形 —— 选了也不会真的生效，
// 中文始终回退到系统默认，字形不统一。
const fontOptions = ['系统默认', '苹方 / 微软雅黑', '思源黑体', '等宽字体'];
const layoutOptions = [
  { id: 'wide', label: '宽屏布局' },
  { id: 'boxed', label: '盒式布局' },
  { id: 'full', label: '全屏布局' },
];

const defaultThemes = [
  {
    id: 'minimal-white',
    name: '简约白',
    preview: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
    },
    font: 'Inter',
    layout: 'wide',
    active: true,
  },
  {
    id: 'deep-black',
    name: '深邃黑',
    preview: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
    colors: {
      primary: '#10b981',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#111827',
      text: '#f9fafb',
    },
    font: 'Arial',
    layout: 'wide',
    active: false,
  },
  {
    id: 'warm-orange',
    name: '温暖橙',
    preview: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: '#fffbeb',
      text: '#78350f',
    },
    font: 'Georgia',
    layout: 'boxed',
    active: false,
  },
];

export default function Themes() {
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  // 原来靠 props 拿 settings 与保存回调，现在页面自取 Context
  const { settings, updateSettings } = useSiteSettings();
  const [themes, setThemes] = useState(defaultThemes);
  const [selectedTheme, setSelectedTheme] = useState(defaultThemes[0]);
  const [activeTab, setActiveTab] = useState('presets');
  const [customTheme, setCustomTheme] = useState({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
    },
    font: 'Inter',
    layout: 'wide',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.theme) {
      setCustomTheme(settings.theme);
      // 更新主题列表
      setThemes(themes.map(t => ({
        ...t,
        active: t.id === 'minimal-white',
      })));
    }
  }, [settings]);

  const handleActivate = (theme) => {
    setThemes(themes.map((t) => ({ ...t, active: t.id === theme.id })));
    setSelectedTheme(theme);
    setHasChanges(true);
  };

  const handleCustomize = (key, value) => {
    if (key in customTheme.colors) {
      setCustomTheme((prev) => ({
        ...prev,
        colors: { ...prev.colors, [key]: value },
      }));
    } else {
      setCustomTheme((prev) => ({ ...prev, [key]: value }));
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    const activePreset = themes.find(t => t.active);
    let colorsToSave;
    
    if (activePreset) {
      colorsToSave = activePreset.colors;
    } else {
      colorsToSave = customTheme.colors;
    }
    
    const newSettings = {
      ...settings,
      theme: {
        name: activePreset ? activePreset.name : 'custom',
        ...customTheme,
        colors: colorsToSave,
      },
    };
    // 原来保存走 props.onSave 回调，现在页面自取 Context 的 updateSettings
    try {
      await updateSettings(newSettings);
      setHasChanges(false);
      showToast('主题已保存', 'success');
    } catch (err) {
      showToast(err.message || '保存主题失败', 'error');
    }
  };

  const handleReset = () => {
    setCustomTheme({
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937',
      },
      font: 'Inter',
      layout: 'wide',
    });
    setHasChanges(true);
  };

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">主题定制</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">自定义您网站的外观和风格</p>
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
            <Sparkles className="w-4 h-4" />
            保存主题
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'presets'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              预设主题
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'customize'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              自定义主题
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'presets' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => handleActivate(theme)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                      theme.active ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="aspect-video">
                      <img
                        src={theme.preview}
                        alt={theme.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">{theme.name}</h3>
                        {theme.active && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {Object.values(theme.colors).slice(0, 4).map((color) => (
                          <div
                            key={color}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">颜色设置</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(customTheme.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 dark:text-gray-300 w-20 capitalize">
                          {key === 'primary' ? '主色' : key === 'secondary' ? '副色' : key === 'accent' ? '强调色' : key === 'background' ? '背景色' : '文字色'}
                        </label>
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleCustomize(key, e.target.value)}
                          className="w-12 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">字体设置</h3>
                  </div>
                  <select
                    value={customTheme.font}
                    onChange={(e) => handleCustomize('font', e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Layout className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">布局设置</h3>
                  </div>
                  <div className="flex gap-3">
                    {layoutOptions.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => handleCustomize('layout', layout.id)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          customTheme.layout === layout.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {layout.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">实时预览</h3>
          </div>
          <div className="p-4">
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: customTheme.colors.background,
                color: customTheme.colors.text,
              }}
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: customTheme.colors.primary }}
                >
                  <span className="text-white text-2xl font-bold">H</span>
                </div>
                <h4
                  className="text-xl font-bold mb-2"
                  style={{ color: customTheme.colors.text }}
                >
                  {settings?.siteName || 'HappyHome'}
                </h4>
                <p style={{ color: customTheme.colors.secondary }}>
                  您的网站预览
                </p>
                <button
                  className="mt-4 px-6 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: customTheme.colors.accent,
                    color: customTheme.colors.text,
                  }}
                >
                  了解更多
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">当前主题信息</h5>
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <p>主题名称: {themes.find(t => t.active)?.name || '自定义'}</p>
                <p>字体: {customTheme.font}</p>
                <p>布局: {customTheme.layout === 'wide' ? '宽屏' : customTheme.layout === 'boxed' ? '盒式' : '全屏'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Toast
      isOpen={isToastOpen}
      message={toastConfig.message}
      type={toastConfig.type}
      onClose={closeToast}
      duration={toastConfig.duration}
    />
    </>
  );
}
