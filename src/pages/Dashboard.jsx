import { FileText, FolderOpen, Image, Users, Eye, TrendingUp } from 'lucide-react';

export default function Dashboard({ posts = [], pages = [], media = [], users = [] }) {
  const publishedPosts = posts.filter(post => post.status === 'published').length;
  const draftPosts = posts.filter(post => post.status === 'draft').length;

  const statCards = [
    { label: '文章总数', value: posts.length, icon: FileText, color: 'bg-blue-500' },
    { label: '已发布', value: publishedPosts, icon: FileText, color: 'bg-green-500' },
    { label: '草稿', value: draftPosts, icon: FileText, color: 'bg-yellow-500' },
    { label: '页面', value: pages.length, icon: FolderOpen, color: 'bg-purple-500' },
    { label: '媒体文件', value: media.length, icon: Image, color: 'bg-pink-500' },
    { label: '用户', value: users.length, icon: Users, color: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">欢迎回来！查看您网站的最新数据概览。</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近文章</h2>
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
              查看全部
            </a>
          </div>
          
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {post.author} · {post.createdAt} · {post.category}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.status === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'}`}>
                  {post.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">暂无文章</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">访问统计</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">今日访问</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">128</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">本周访问</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">892</span>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">访问趋势</span>
                <span className="text-xs text-green-500">+23% 较上周</span>
              </div>
              <div className="flex items-end gap-2 h-24">
                {[40, 60, 45, 80, 55, 90, 70].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>周一</span>
                <span>周三</span>
                <span>周五</span>
                <span>周日</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
