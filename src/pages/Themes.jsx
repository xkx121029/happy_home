import { useCallback, useMemo, useState } from 'react';
import { Check, Layers, Palette, RotateCcw, Save, Square, Type } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/Form';
import ThemePreview from '../components/ThemePreview';
import { Toast } from '../components/Modal';
import { useToast } from '../hooks/useModal';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { cn } from '../lib/cn';
import {
  ACCENT_SWATCHES,
  FONT_STACKS,
  NEUTRALS,
  PRESET_THEMES,
  RADIUS_SCALES,
} from '../theme/palettes';
import {
  hexToHsl,
  hslToHex,
  isSameTheme,
  matchPresetId,
  normalizeHex,
  resolveTheme,
  tokenToCss,
} from '../theme/apply';

/**
 * 主题定制。
 *
 * 原实现是一个不连线的演示页：三套写死的「主题」用 Unsplash 风景照当缩略图，
 * 选中的主题只改本地 state，保存后除了 primaryColor 之外没有任何东西生效 ——
 * 字体选项是 Inter / Roboto 这类没有中文字形的英文字体，布局选项没人读，
 * 三套主题之间唯一的区别只是那张照片。
 *
 * 现在四个维度都真正接线：中性色系、强调色、圆角、字体。
 * 保存写进 settings.theme，由 SiteSettingsContext 生成样式表作用到全站。
 *
 * 预览是「局部」的 —— 只在右侧预览框内生效，不污染后台自身。
 * 这样就不存在「改了没保存，离开页面后主题停留在半吊子状态」的问题：
 * 全站只在点保存的那一刻改变。
 */

const TABS = [
  { id: 'presets', label: '预设主题' },
  { id: 'custom', label: '自定义' },
];

const HUE_TRACK =
  'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)';

function ControlGroup({ icon: Icon, title, hint, children }) {
  return (
    <div className="py-5 border-b border-line last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start gap-2.5 mb-3.5">
        <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, trackStyle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-8 shrink-0">{label}</span>
      <input
        type="range"
        className="tone-slider flex-1 min-w-0"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={trackStyle}
      />
      <span className="text-xs text-muted tabular-nums w-8 text-right shrink-0">{value}</span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted shrink-0">{label}</span>
      <span className={cn('text-fg truncate', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

export default function Themes() {
  const { settings, updateSettings } = useSiteSettings();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();

  const saved = useMemo(() => resolveTheme(settings), [settings]);
  // draft 为 null 表示「跟随已保存的主题」。用 null 而不是直接把 saved 拷进 state，
  // 是为了避免设置异步到达后草稿与已保存值脱节（拷贝进 state 就再也同步不上了）。
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('presets');
  const [saving, setSaving] = useState(false);
  // 色值输入框需要自己的文本状态，否则用户删到一半（比如只剩 "#B4"）就会被回写覆盖
  const [accentText, setAccentText] = useState(null);

  const current = draft || saved;
  const dirty = !isSameTheme(current, saved);
  const activePresetId = matchPresetId(current);
  const siteName = settings?.siteName || 'HappyHome';

  const update = useCallback(
    (patch) => {
      setDraft({ ...(draft || saved), presetId: 'custom', ...patch });
    },
    [draft, saved]
  );

  const selectPreset = (preset) => {
    setAccentText(null);
    setDraft({
      presetId: preset.id,
      neutral: preset.neutral,
      accent: preset.accent,
      radius: preset.radius,
      font: preset.font,
    });
  };

  const pickAccent = (hex) => {
    setAccentText(null);
    update({ accent: normalizeHex(hex) || current.accent });
  };

  const handleAccentText = (value) => {
    setAccentText(value);
    const normalized = normalizeHex(value);
    if (normalized) update({ accent: normalized });
  };

  // 保留未取整的原始分量：拖动某一通道时其余通道沿用精确值，
  // 否则每次拖动都会因为四舍五入让颜色悄悄偏移一点。
  const [hueExact, saturationExact, lightnessExact] = hexToHsl(current.accent);
  const setHsl = (nextHue, nextSaturation, nextLightness) => {
    setAccentText(null);
    update({ accent: hslToHex(nextHue, nextSaturation, nextLightness) });
  };

  const handleReset = () => {
    setAccentText(null);
    setDraft(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        theme: {
          presetId: activePresetId,
          neutral: current.neutral,
          accent: current.accent,
          radius: current.radius,
          font: current.font,
        },
      });
      setDraft(null);
      showToast('主题已保存，全站已生效', 'success');
    } catch (err) {
      showToast(err.message || '保存主题失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activePresetName =
    PRESET_THEMES.find((preset) => preset.id === activePresetId)?.name || '自定义组合';

  return (
    <>
      <div className="p-6">
        <PageHeader
          title="主题定制"
          description="预设一键切换，或自行组合中性色系、强调色、圆角与字体。保存后全站立即生效。"
          actions={
            <>
              <Button
                variant="ghost"
                iconLeft={RotateCcw}
                onClick={handleReset}
                disabled={!dirty}
              >
                还原
              </Button>
              <Button iconLeft={Save} onClick={handleSave} loading={saving} disabled={!dirty}>
                保存主题
              </Button>
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card padding="none" className="self-start">
            <div className="px-4 py-3 border-b border-line">
              <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-line">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'h-8 px-3.5 rounded-md text-sm font-medium',
                      'transition-colors duration-100 ease-entry',
                      tab === item.id
                        ? 'bg-surface text-fg shadow-sm'
                        : 'text-muted hover:text-fg'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {tab === 'presets' ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {PRESET_THEMES.map((preset) => {
                    const active = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className={cn(
                          'text-left rounded-lg border overflow-hidden',
                          'transition-colors duration-100 ease-entry',
                          active ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-muted/60'
                        )}
                      >
                        {/* 缩略图就是用这套主题真渲染出来的迷你站点，不是配图 */}
                        <ThemePreview
                          theme={preset}
                          mode="light"
                          siteName={siteName}
                          framed={false}
                        />
                        <div className="flex items-start justify-between gap-2 px-3 py-2.5 border-t border-line bg-surface">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-fg truncate">{preset.name}</p>
                            <p className="text-xs text-muted mt-0.5 truncate">{preset.note}</p>
                          </div>
                          <span
                            className={cn(
                              'mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center',
                              active ? 'bg-accent text-accent-fg' : 'border border-line'
                            )}
                          >
                            {active && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <ControlGroup
                    icon={Layers}
                    title="中性色系"
                    hint="决定页面底色、卡片面、正文与描边"
                  >
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(NEUTRALS).map(([key, ramp]) => {
                        const active = current.neutral === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update({ neutral: key })}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left',
                              'transition-colors duration-100 ease-entry',
                              active
                                ? 'border-accent ring-1 ring-accent'
                                : 'border-line hover:border-muted/60'
                            )}
                          >
                            <span className="flex w-7 h-7 shrink-0 rounded border border-line overflow-hidden">
                              <span
                                className="flex-1"
                                style={{ background: tokenToCss(ramp.light.bg) }}
                              />
                              <span
                                className="flex-1"
                                style={{ background: tokenToCss(ramp.light.surface) }}
                              />
                              <span
                                className="flex-1"
                                style={{ background: tokenToCss(ramp.light.fg) }}
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-fg">
                                {ramp.label}
                              </span>
                              <span className="block text-xs text-muted truncate">{ramp.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </ControlGroup>

                  <ControlGroup
                    icon={Palette}
                    title="强调色"
                    hint="按钮、链接与选中态统一使用这一色，其余色阶由它推导"
                  >
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_SWATCHES.map((swatch) => {
                        const active =
                          current.accent.toUpperCase() === swatch.hex.toUpperCase();
                        return (
                          <button
                            key={swatch.hex}
                            type="button"
                            title={swatch.label}
                            aria-label={swatch.label}
                            onClick={() => pickAccent(swatch.hex)}
                            className={cn(
                              'w-7 h-7 rounded-full border',
                              'transition-transform duration-100 ease-entry active:scale-[0.97]',
                              active
                                ? 'border-fg ring-2 ring-accent ring-offset-2 ring-offset-surface'
                                : 'border-line'
                            )}
                            style={{ background: swatch.hex }}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-4 space-y-3 max-w-md">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-8 shrink-0">色值</span>
                        <Input
                          size="sm"
                          value={accentText ?? current.accent}
                          onChange={(event) => handleAccentText(event.target.value)}
                          onBlur={() => setAccentText(null)}
                          placeholder="#B4552C"
                          className="w-32 font-mono uppercase"
                        />
                        <span
                          className="w-6 h-6 rounded border border-line shrink-0"
                          style={{ background: current.accent }}
                        />
                      </div>

                      <SliderRow
                        label="色相"
                        value={Math.round(hueExact)}
                        min={0}
                        max={360}
                        onChange={(next) => setHsl(next, saturationExact, lightnessExact)}
                        trackStyle={{ background: HUE_TRACK }}
                      />
                      <SliderRow
                        label="饱和"
                        value={Math.round(saturationExact)}
                        min={0}
                        max={100}
                        onChange={(next) => setHsl(hueExact, next, lightnessExact)}
                        trackStyle={{
                          background: `linear-gradient(to right, hsl(${hueExact} 0% ${lightnessExact}%), hsl(${hueExact} 100% ${lightnessExact}%))`,
                        }}
                      />
                      <SliderRow
                        label="明度"
                        value={Math.round(lightnessExact)}
                        min={0}
                        max={100}
                        onChange={(next) => setHsl(hueExact, saturationExact, next)}
                        trackStyle={{
                          background: `linear-gradient(to right, #000, hsl(${hueExact} ${saturationExact}% 50%), #fff)`,
                        }}
                      />
                    </div>
                  </ControlGroup>

                  <ControlGroup icon={Square} title="圆角" hint="全站转角的锐利程度">
                    <div className="flex flex-wrap gap-2.5">
                      {Object.entries(RADIUS_SCALES).map(([key, scale]) => {
                        const active = current.radius === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update({ radius: key })}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left',
                              'transition-colors duration-100 ease-entry',
                              active
                                ? 'border-accent ring-1 ring-accent'
                                : 'border-line hover:border-muted/60'
                            )}
                          >
                            <span
                              className="w-6 h-6 shrink-0 border-2 border-fg/50"
                              style={{ borderRadius: scale.vars.lg }}
                            />
                            <span>
                              <span className="block text-sm font-medium text-fg">
                                {scale.label}
                              </span>
                              <span className="block text-xs text-muted">{scale.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </ControlGroup>

                  <ControlGroup icon={Type} title="字体" hint="只列中文有真字形的系统字体，不加载网络字体">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {Object.entries(FONT_STACKS).map(([key, font]) => {
                        const active = current.font === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => update({ font: key })}
                            className={cn(
                              'px-3 py-2.5 rounded-lg border text-left',
                              'transition-colors duration-100 ease-entry',
                              active
                                ? 'border-accent ring-1 ring-accent'
                                : 'border-line hover:border-muted/60'
                            )}
                          >
                            {/* 选项本身就用该字体渲染，选之前就能看出差别 */}
                            <span
                              className="block text-base text-fg truncate"
                              style={{ fontFamily: font.stack }}
                            >
                              中文字形 Aa 123
                            </span>
                            <span className="block text-xs text-muted mt-1">
                              {font.label} · {font.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </ControlGroup>
                </div>
              )}
            </div>
          </Card>

          <Card padding="none" className="self-start xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
              <h2 className="text-sm font-semibold text-fg">实时预览</h2>
              <span className="text-xs text-muted truncate">{activePresetName}</span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted mb-2">亮色</p>
                <ThemePreview theme={current} mode="light" siteName={siteName} />
              </div>
              <div>
                <p className="text-xs text-muted mb-2">暗色</p>
                <ThemePreview theme={current} mode="dark" siteName={siteName} />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-line space-y-1.5">
              <InfoRow label="中性色系" value={NEUTRALS[current.neutral].label} />
              <InfoRow label="强调色" value={current.accent} mono />
              <InfoRow label="圆角" value={RADIUS_SCALES[current.radius].label} />
              <InfoRow label="字体" value={FONT_STACKS[current.font].label} />
            </div>
          </Card>
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
