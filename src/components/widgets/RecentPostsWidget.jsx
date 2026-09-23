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
      <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
        <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          最新文章
        </h3>
        <p className="text-muted text-sm">暂无文章</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
      <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        最新文章
      </h3>
      <ul className="space-y-3">
        {recentPosts.map(post => (
          <li key={post.id}>
            <Link
              to={`/posts/${post.id}`}
              className="text-fg hover:text-accent text-sm line-clamp-2 transition-colors"
            >
              {post.title}
            </Link>
            <span className="text-xs text-muted">{post.createdAt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
