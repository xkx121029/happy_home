import { useState } from 'react';
import { User, Menu, X, ArrowRight } from 'lucide-react';
import { sanitizeHtml } from '../lib/sanitize';

export default function PublicSite({ posts, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const publishedPosts = posts.filter(post => post.status === 'published');

  const handleNavigate = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const renderHome = () => (
    <div className="space-y-16">
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          欢迎来到 HappyHome
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          一个功能强大、易于使用的建站平台，让每个人都能轻松创建专业网站
        </p>
        <button 
          onClick={() => handleNavigate('posts')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          浏览文章
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">最新文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedPosts.slice(0, 3).map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.createdAt}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-600">{post.author}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 -mx-6 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">关于本站</h2>
          <p className="text-gray-600 text-lg">
            HappyHome 是一个现代化的建站平台，提供丰富的个性化功能，
            让您可以轻松创建美观、专业的网站。无需编程知识，即可拥有属于自己的网络空间。
          </p>
        </div>
      </section>

      <footer className="text-center py-8 border-t border-gray-200">
        <p className="text-gray-500">© 2024 HappyHome. All rights reserved.</p>
      </footer>
    </div>
  );

  const renderPosts = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">所有文章</h1>
      <div className="space-y-6">
        {publishedPosts.map((post) => (
          <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-gray-500">{post.createdAt}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 cursor-pointer">
              {post.title}
            </h2>
            <p className="text-gray-600 mb-6">{post.excerpt}</p>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author}</p>
                  <p className="text-sm text-gray-500">作者</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HappyHome</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavigate('home')}
                className={`font-medium transition-colors ${activeSection === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                首页
              </button>
              <button
                onClick={() => handleNavigate('posts')}
                className={`font-medium transition-colors ${activeSection === 'posts' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                文章
              </button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col gap-2 px-6">
              <button
                onClick={() => handleNavigate('home')}
                className={`px-4 py-2 rounded-lg font-medium text-left ${activeSection === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                首页
              </button>
              <button
                onClick={() => handleNavigate('posts')}
                className={`px-4 py-2 rounded-lg font-medium text-left ${activeSection === 'posts' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                文章
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {activeSection === 'home' && renderHome()}
        {activeSection === 'posts' && renderPosts()}
      </main>
    </div>
  );
}
