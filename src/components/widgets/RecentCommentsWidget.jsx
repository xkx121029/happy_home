import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function RecentCommentsWidget({ comments, config = {} }) {
  const count = config.count || 5;
  const recentComments = comments
    .filter(c => c.status === 'approved' && !c.parentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count);

  if (recentComments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          最新评论
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">暂无评论</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        最新评论
      </h3>
      <ul className="space-y-3">
        {recentComments.map(comment => (
          <li key={comment.id}>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {(comment.author || '').charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{comment.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{comment.author}</span>
                  <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                  <Link
                    to={`/posts/${comment.postId}`}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    查看文章
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
