/**
 * 把管理员自定义的代码注入到页面。
 *
 * 信任模型：这些内容只有管理员能写（`PUT /api/settings` 要求 administrator 角色），
 * 权限等价于直接改模板文件。所以这里**不做净化** —— 净化会破坏脚本本身，
 * 而这个功能存在的意义就是让管理员能插入自己的统计、客服、验证脚本。
 * CSS 是唯一的例外，它仍然走 sanitizeCss（`@import` 之类会让整站样式失效）。
 */

const MARKER = 'data-happyhome-injected';

/** 移除上一次注入的节点，避免设置改变后新旧两份代码同时存在。 */
function clearInjected(host, key) {
  host.querySelectorAll(`[${MARKER}="${key}"]`).forEach((node) => node.remove());
}

/**
 * 注入一段原始 HTML。
 *
 * 必须逐个重建 `<script>`：通过 innerHTML 插入的 script 标签浏览器不会执行，
 * 而自定义代码最常见的用法恰恰就是挂一个外部脚本。这是这类功能唯一容易踩的坑。
 */
export function injectHtml(host, key, html) {
  if (!host) return;
  clearInjected(host, key);
  if (!html || !String(html).trim()) return;

  const template = document.createElement('template');
  template.innerHTML = String(html);

  for (const node of Array.from(template.content.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const target =
      node.tagName === 'SCRIPT' ? rebuildScript(node) : node;

    target.setAttribute(MARKER, key);
    host.appendChild(target);
  }
}

function rebuildScript(source) {
  const script = document.createElement('script');
  for (const attr of Array.from(source.attributes)) {
    script.setAttribute(attr.name, attr.value);
  }
  script.textContent = source.textContent;
  return script;
}

/** 注入一段样式。传入的 CSS 应已净化。 */
export function injectStyle(host, key, css) {
  if (!host) return;
  clearInjected(host, key);
  if (!css || !String(css).trim()) return;

  const style = document.createElement('style');
  style.setAttribute(MARKER, key);
  style.textContent = String(css);
  host.appendChild(style);
}

/** 注入一段 JS（作为内联脚本执行）。 */
export function injectScript(host, key, code) {
  if (!host) return;
  clearInjected(host, key);
  if (!code || !String(code).trim()) return;

  const script = document.createElement('script');
  script.setAttribute(MARKER, key);
  script.textContent = String(code);
  host.appendChild(script);
}

/**
 * 注入第三方统计脚本（Google Analytics / GTM / Hotjar / Matomo）。
 *
 * 参数是 `settings.seo` 这个嵌套对象 —— 统计 ID 统一由 SEO 页维护。
 * 原来设置页的「集成」标签页也存过一份扁平的 googleAnalytics，
 * 但没有任何代码读它，两处并存只会让人不知道该改哪个。
 */
export function injectAnalytics(seo) {
  const head = document.head;
  const gtm = String(seo?.googleTagManager || '').trim();
  const ga = String(seo?.googleAnalytics || '').trim();
  const hotjar = String(seo?.hotjar || '').trim();
  const matomo = String(seo?.matomo || '').trim();

  // Google Tag Manager：官方要求脚本进 head，noscript 进 body
  if (gtm) {
    injectScript(
      head,
      'gtm',
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
        `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';` +
        `j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
        `})(window,document,'script','dataLayer','${escapeForInlineScript(gtm)}');`
    );
    injectHtml(
      document.body,
      'gtm-noscript',
      `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${escapeForInlineScript(gtm)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
    );
  }

  if (ga) {
    injectScript(
      head,
      'ga',
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
        `gtag('js',new Date());gtag('config','${escapeForInlineScript(ga)}');` +
        `var s=document.createElement('script');s.async=true;` +
        `s.src='https://www.googletagmanager.com/gtag/js?id=${escapeForInlineScript(ga)}';` +
        `document.head.appendChild(s);`
    );
  }

  if (hotjar) {
    injectScript(
      head,
      'hotjar',
      `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};` +
        `h._hjSettings={hjid:${Number(hotjar) || 0},hjsv:6};a=o.getElementsByTagName('head')[0];` +
        `r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;` +
        `a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`
    );
  }

  if (matomo) {
    injectScript(
      head,
      'matomo',
      `var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);` +
        `(function(){var u='${escapeForInlineScript(matomo).replace(/\/?$/, '/')}';` +
        `_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','1']);` +
        `var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];` +
        `g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();`
    );
  }
}

/** 拼进内联脚本字符串里的值必须转义，否则一个引号就能提前闭合语句。 */
function escapeForInlineScript(value) {
  return String(value).replace(/[\\'"]/g, (char) => `\\${char}`);
}
