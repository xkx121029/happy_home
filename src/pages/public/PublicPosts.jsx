import { Link } from 'react-router-dom';
import { FileText, Calendar, User, Search, Pin } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';

export default function PublicPosts() {
  // 原来靠 App.jsx 通过 props 下发数据，路由重构后页面自取 Context
  const { posts } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const publishedPosts = posts.filter(post => post.status === 'published');

  const sortedPosts = [...publishedPosts].sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const filteredPosts = sortedPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(publishedPosts.map(post => post.category))];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">文章列表</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            浏览我们最新的文章，发现有趣的内容。
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '全部分类' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <Link to={`/posts/${post.id}`} className="block">
                  <div className="bg-surface-2 aspect-video flex items-center justify-center text-white text-4xl opacity-80">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {post.sticky && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          置顶
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.createdAt}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    <p className="text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-600">{post.author}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">没有找到文章</h3>
            <p className="text-gray-500">尝试调整搜索条件或分类筛选</p>
          </div>
        )}
      </div>
    </div>
  );
}
