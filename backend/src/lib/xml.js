/**
 * XML 文本工具。
 *
 * RSS 与 sitemap 都要做转义，散在两个文件里各写一遍必然有一处漏掉 ——
 * 而漏掉的后果不是报错，是订阅器解析失败（文章标题里一个 `&` 就够了）。
 */

/** 转义 XML 文本节点与属性值里的保留字符。 */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 包成 CDATA 段。
 *
 * 正文里出现 `]]>` 会提前闭合 CDATA，必须拆成两段再拼回来 ——
 * 这是 CDATA 唯一的坑，而富文本编辑器产出的内容里并不罕见。
 */
function cdata(value) {
  const safe = String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safe}]]>`;
}

/** 粗略去掉 HTML 标签，用于把正文降级成纯文本描述。 */
function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 转成 RSS 要求的 RFC 822 日期格式。 */
function toRfc822(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

/** 转成 sitemap 要求的 W3C 日期格式（仅日期）。 */
function toW3CDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

module.exports = { escapeXml, cdata, stripHtml, toRfc822, toW3CDate };
