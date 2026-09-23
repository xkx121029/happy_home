import { Link } from 'react-router-dom';
import { FileText, Clock, User, Calendar, ExternalLink, Pin } from 'lucide-react';
import { useEffect } from 'react';
import { useSiteSettings } from '../../state/SiteSettingsContext';
import { useData } from '../../contexts/DataContext';

export default function PublicHome() {
  // 原来靠 App.jsx 通过 props 下发数据，路由重构后页面自取 Context
  const { posts, pages } = useData();
  const { settings } = useSiteSettings();
  const publishedPosts = posts.filter(post => post.status === 'published');
  const sortedPosts = [...publishedPosts].sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  const recentPosts = sortedPosts.slice(0, 3);
  const publishedPages = (pages || []).filter(page => page.status === 'published');

  const siteName = settings?.siteName || 'HappyHome';
  const siteDescription = settings?.siteDescription || '一个功能强大、易于使用的建站平台';

  // SEO 设置
  const seo = settings?.seo || {};
  const siteUrl = settings?.siteUrl || '';

  // 更新页面 SEO 标签
  useEffect(() => {
    const title = seo.siteTitle || siteName;
    const description = seo.siteDescription || siteDescription;
    const keywords = seo.siteKeywords || '';
    const ogImage = seo.ogImage || '';

    // 设置文档标题
    document.title = title;

    // 更新 meta 标签
    const updateMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);

    // Open Graph 标签
    const updateOg = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOg('og:title', title);
    updateOg('og:description', description);
    updateOg('og:type', 'website');
    updateOg('og:url', siteUrl || window.location.origin);
    updateOg('og:site_name', siteName);
    if (ogImage) updateOg('og:image', ogImage);

    // Twitter Card 标签
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    if (ogImage) updateMeta('twitter:image', ogImage);

    // robots
    if (seo.noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', seo.robots || 'index, follow');
    }

    // Canonical
    if (seo.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', siteUrl || window.location.origin);
    }

    // 站长验证
    if (seo.bingVerification) {
      updateMeta('msvalidate.01', seo.bingVerification);
    }
    if (seo.baiduVerification) {
      updateMeta('baidu-site-verification', seo.baiduVerification);
    }

    return () => {
      document.title = siteName;
    };
  }, [seo, siteName, siteDescription, siteUrl]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="py-20 bg-surface-2">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold text-fg mb-6">
            欢迎来到 <span className="text-transparent bg-clip-text bg-accent">{siteName}</span>
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto mb-10">
            {siteDescription}。
            无需编程知识，即可拥有属于自己的网络空间。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/posts"
              className="px-8 py-4 bg-accent text-accent-fg rounded-xl font-semibold hover:bg-accent-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              浏览文章
              <FileText className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-fg mb-12">
            我们的特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: '内容管理',
                desc: '强大的富文本编辑器，支持多种内容格式，轻松创建和管理文章页面。'
              },
              {
                icon: Clock,
                title: '主题定制',
                desc: '丰富的主题选择，自定义颜色、字体和布局，打造独特的网站风格。'
              },
              {
                icon: User,
                title: '用户管理',
                desc: '完整的权限系统，支持多用户协作，灵活的角色分配。'
              }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-surface rounded-2xl p-8 shadow-sm border border-line hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-accent/12 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-fg mb-2">{feature.title}</h3>
                  <p className="text-muted">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 bg-surface">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-fg">最新文章</h2>
              <Link
                to="/posts"
                className="flex items-center gap-2 text-accent hover:text-accent font-semibold"
              >
                查看全部
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <article key={post.id} className="group">
                  <Link to={`/posts/${post.id}`} className="block">
                    <div className="bg-surface-2 rounded-2xl aspect-video mb-4 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-line text-4xl">
                        <FileText className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {post.sticky && (
                        <span className="px-2 py-0.5 bg-accent/12 text-accent rounded-full text-xs font-medium flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          置顶
                        </span>
                      )}
                      <span className="px-3 py-1 bg-accent/12 text-accent rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-sm text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-fg mb-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-surface-2 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-muted" />
                      </div>
                      <span className="text-sm text-muted">{post.author}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pages */}
      {publishedPages.length > 0 && (
        <section className="py-16 bg-surface">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-fg">更多页面</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedPages.map((page) => (
                <article key={page.id} className="group">
                  <Link to={`/page/${page.slug}`} className="block">
                    <div className="bg-surface-2 rounded-2xl aspect-video mb-4 overflow-hidden flex items-center justify-center">
                      <FileText className="w-16 h-16 text-line" />
                    </div>
                    <h3 className="text-xl font-bold text-fg mb-2 group-hover:text-accent transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-muted line-clamp-2">
                      点击查看页面内容
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
