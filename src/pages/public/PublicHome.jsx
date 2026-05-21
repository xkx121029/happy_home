import { Link } from 'react-router-dom';
import { FileText, Clock, User, Calendar, ExternalLink } from 'lucide-react';

export default function PublicHome({ posts, settings }) {
  const publishedPosts = posts.filter(post => post.status === 'published');
  const recentPosts = publishedPosts.slice(0, 3);

  const siteName = settings?.siteName || 'HappyHome';
  const siteDescription = settings?.siteDescription || '一个功能强大、易于使用的建站平台';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            欢迎来到 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{siteName}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            {siteDescription}。
            无需编程知识，即可拥有属于自己的网络空间。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/posts"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
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
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gray-900">最新文章</h2>
              <Link
                to="/posts"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                查看全部
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <article key={post.id} className="group">
                  <Link to={`/posts/${post.id}`} className="block">
                    <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl aspect-video mb-4 group-hover:scale-[1.02] transition-transform overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl opacity-30">
                        <FileText className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-600">{post.author}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">关于 {siteName}</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            {siteName} 致力于为每个人提供简单易用的建站解决方案。我们相信
            每个人都应该能够轻松展示自己的创意和内容，无需复杂的技术知识。
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { number: '10K+', label: '网站数量' },
              { number: '50K+', label: '用户数量' },
              { number: '1M+', label: '文章总数' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-1">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
