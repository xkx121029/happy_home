import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function RecentPostsWidget({ posts, config = {} }) {
  const count = config.count || 5;
  const recentPosts = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count);

  if (recentPosts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          最新文章
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无文章</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        最新文章
      </h3>
      <ul className="space-y-3">
        {recentPosts.map(post => (
          <li key={post.id}>
            <Link
              to={`/posts/${post.id}`}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm line-clamp-2 transition-colors"
            >
              {post.title}
            </Link>
            <span className="text-xs text-gray-400 dark:text-gray-500">{post.createdAt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
