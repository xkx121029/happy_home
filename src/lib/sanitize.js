import DOMPurify from 'dompurify';

/**
 * HTML / CSS 净化 —— 全站唯一入口。
 *
 * 项目里原有 7 处 dangerouslySetInnerHTML，其中 6 处完全没有处理，
 * 唯一处理的那处是自研的「黑名单删除式」过滤：先删掉一批危险标签，再删掉
 * on* 事件属性。黑名单天然会漏（漏掉的标签、属性、协议、畸形嵌套都能绕过），
 * 而且它没处理 style 里的 url()、SVG 内的 script 等变体。
 * 这里改用 DOMPurify 的白名单实现。
 */

// 富文本编辑器会产出的标签集合；DOMPurify 默认白名单已覆盖大部分，
// 这里显式放开表格、代码块与媒体相关的标签，避免正常内容被误删。
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code', 'kbd', 'samp',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'video', 'audio', 'source', 'iframe',
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'class', 'id', 'colspan', 'rowspan', 'start', 'reversed',
  'controls', 'poster', 'allowfullscreen', 'frameborder', 'allow',
];

const FORBID_TAGS = [
  'script', 'style', 'form', 'input', 'button', 'select', 'textarea',
  'object', 'embed', 'link', 'meta', 'base',
];

export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(String(dirty), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style', 'formaction', 'srcdoc'],
  });
}

/**
 * 纯文本净化 —— 用于标题、摘要等不该含标签的字段。
 */
export function sanitizeText(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(String(dirty), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * 自定义 CSS 净化。站点外观设置允许管理员填写 CSS，而 <style> 里的内容
 * 不受 DOMPurify 管辖，所以单独处理：剔除能引入外部资源或触发表达式求值的写法，
 * 保留正常的选择器与属性声明。
 */
export function sanitizeCss(css) {
  if (!css) return '';
  return String(css)
    // IE 时代的表达式求值
    .replace(/expression\s*\(/gi, '')
    // 内联脚本协议
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    // 只允许图片类 data URI，其余（尤其 text/html）一律去掉
    .replace(/data\s*:(?!image\/(png|jpe?g|gif|webp|svg\+xml))/gi, '')
    // @import 会悄悄拉取第三方样式表
    .replace(/@import[^;]*;?/gi, '')
    // 老版本浏览器用 behavior 绑定脚本
    .replace(/behavior\s*:/gi, '');
}

/**
 * 把富文本内容压成纯文本摘要，用于列表页的 excerpt 展示。
 */
export function htmlToPlainText(html, maxLength = 0) {
  if (!html) return '';
  const text = String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, maxLength)}…`;
  }
  return text;
}

export default sanitizeHtml;