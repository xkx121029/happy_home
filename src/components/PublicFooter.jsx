import { Link } from 'react-router-dom';
import { Rss } from 'lucide-react';
import { useSiteSettings } from '../state/SiteSettingsContext';

/**
 * 前台页脚。
 *
 * 原来站名与描述是写死的「HappyHome / 一个功能强大、易于使用的建站平台」，
 * 设置里改了站点名页脚也不变；导航用的是 `<a href>`，每次点击都整页重载。
 * 这里改为读设置、用 `<Link>`，并补上订阅入口。
 */
export default function PublicFooter() {
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || 'HappyHome';
  const description = settings?.siteDescription || '';

  return (
    <footer className="bg-surface-2 border-t border-line">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-accent text-accent-fg grid place-items-center font-semibold text-sm">
                {siteName.charAt(0).toUpperCase()}
              </span>
              <span className="text-lg font-semibold text-fg">{siteName}</span>
            </div>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>

          <div>
            <h4 className="font-semibold text-fg mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted hover:text-accent transition-colors duration-100 ease-entry">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/posts" className="text-sm text-muted hover:text-accent transition-colors duration-100 ease-entry">
                  文章
                </Link>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors duration-100 ease-entry"
                >
                  <Rss className="w-3.5 h-3.5" />
                  订阅更新
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-fg mb-4">技术支持</h4>
            <p className="text-sm text-muted">HappyHome 建站平台</p>
            <p className="text-sm text-muted mt-1">
              {settings?.siteUrl || '让每个人都能创建专业网站'}
            </p>
          </div>
        </div>

        <div className="border-t border-line mt-8 pt-8 text-center">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
