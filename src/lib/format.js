/**
 * 展示层格式化工具。
 *
 * 原来 Backup.jsx、Media.jsx 等各自写了一份 formatSize / formatDate，
 * 实现细节还不一致（有的返回 '0 B'，有的返回 '0 Bytes'）。
 */
import { htmlToPlainText } from './sanitize';

/**
 * 取文章摘要。
 *
 * 作者手写过摘要就用它；没写就从正文截取，长度来自「内容」页的 excerptLength。
 * 原来列表页直接渲染 `post.excerpt`，而摘要字段只有在编辑器里手填过才有值 ——
 * 没填的文章在列表里就是一片空白。
 */
export function excerptFrom(post, maxLength = 150) {
  const explicit = (post?.excerpt || '').trim();
  if (explicit) return explicit;
  return htmlToPlainText(post?.content || '', maxLength);
}

/**
 * 把 UTC 时间按站点时区换算成 `YYYY-MM-DDTHH:mm:ss`。
 *
 * 用 sv-SE 区域是因为它的日期格式天然就是 ISO 形状（`YYYY-MM-DD HH:mm:ss`），
 * 不必手工拼 Intl 的 parts。时区传空则回退到浏览器本地时区。
 */
export function toZonedIso(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timeZone || undefined,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(date).replace(' ', 'T');
}

/**
 * 转成 `<input type="datetime-local">` 需要的墙上时间。
 *
 * 不做这层换算的话，编辑一篇定时文章时输入框里显示的是 UTC 时刻，
 * 比站点时间早 8 小时 —— 用户只要点一下保存，发布时间就被悄悄改了。
 */
export function toDateTimeInputValue(value, timeZone) {
  return toZonedIso(value, timeZone).slice(0, 16);
}

/** 按站点时区格式化日期时间，用于列表与详情展示。 */
export function formatDateTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timeZone || undefined,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * 字节数转可读字符串。
 * @param {number} bytes
 * @param {{ base?: number, decimals?: number, zeroLabel?: string }} [options]
 */
export function formatBytes(bytes, { base = 1024, decimals = 2, zeroLabel = '0 B' } = {}) {
  const value = Number(bytes);
  if (!value || value <= 0) return zeroLabel;

  const units = base === 1000
    ? ['B', 'KB', 'MB', 'GB', 'TB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(base)), units.length - 1);
  const scaled = value / base ** index;
  const rounded = index === 0 ? scaled : Number(scaled.toFixed(decimals));
  return `${rounded} ${units[index]}`;
}

/**
 * 日期格式化。
 * @param {string|number|Date} value
 * @param {{ style?: 'date'|'datetime'|'time'|'relative', locale?: string }} [options]
 */
export function formatDate(value, { style = 'datetime', locale = 'zh-CN' } = {}) {
  if (value === null || value === undefined || value === '') return '';

  // 后端部分时间戳是 'YYYY-MM-DD HH:MM:SS' 形式，Safari 不接受空格分隔，
  // 统一替换成 ISO 的 'T' 再解析
  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);

  if (style === 'relative') return formatRelativeTime(date, locale);

  const options = {
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    },
  }[style] || {};

  return date.toLocaleString(locale, options);
}

/**
 * 相对时间（刚刚 / 5 分钟前 / 3 天前），超过 30 天回退为日期。
 */
export function formatRelativeTime(value, locale = 'zh-CN') {
  const date = value instanceof Date ? value : new Date(typeof value === 'string' ? value.replace(' ', 'T') : value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return formatDate(date, { locale });

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  return formatDate(date, { style: 'date', locale });
}

/**
 * 千分位数字，配合 CSS 的 tabular-nums 使用。
 */
export function formatNumber(value, locale = 'zh-CN') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString(locale);
}

/**
 * 毫秒转「1分23秒」这类可读时长。
 */
export function formatDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms) / 1000));
  if (total < 60) return `${total} 秒`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return seconds ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分`;
  const hours = Math.floor(minutes / 60);
  return `${hours} 小时 ${minutes % 60} 分`;
}

/**
 * 文章正文的预计阅读时长（按中文每分钟约 300 字估算）。
 */
export function estimateReadingMinutes(html) {
  if (!html) return 1;
  const text = String(html).replace(/<[^>]*>/g, '');
  return Math.max(1, Math.round(text.length / 300));
}