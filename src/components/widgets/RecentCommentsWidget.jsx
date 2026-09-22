import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { publicAPI } from '../../services/api';
import { formatDate } from '../../lib/format';
import { PUBLIC_PATHS } from '../../routes/paths';

/**
 * 侧栏「最新评论」。
 *
 * 原来靠父级传进来的 comments 数组，而那份数据来自 DataContext 的全量评论列表 ——
 * 只有管理员登录时才会加载（且包含待审核与垃圾评论）。访客看到的一直是空的，
 * 管理员看到的则本不该公开。现在改为自己从公开端点取「已发布文章下的已审核评论」。
 */
export default function RecentCommentsWidget({ config = {} }) {
  const count = config.count || 5;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    publicAPI.getRecentComments(count)
      .then((res) => {
        if (!cancelled) setComments(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [count]);

  const shell = (children) => (
    <section className="rounded-lg bg-surface border border-line p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-fg mb-3">
        <MessageSquare className="w-4 h-4 text-muted" />
        最新评论
      </h3>
      {children}
    </section>
  );

  if (loading) {
    return shell(
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return shell(<p className="text-sm text-muted">暂无评论</p>);
  }

  return shell(
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex items-start gap-2.5">
          <span className="w-7 h-7 shrink-0 rounded-full bg-accent-100 text-accent grid place-items-center text-xs font-medium">
            {(comment.author || '').charAt(0).toUpperCase() || '?'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-fg/85 leading-snug line-clamp-2">{comment.content}</p>
            <p className="mt-1 text-xs text-muted">
              <span>{comment.author}</span>
              {comment.createdAt && <span className="mx-1">·</span>}
              {comment.createdAt && <span>{formatDate(comment.createdAt, { style: 'date' })}</span>}
            </p>
            {comment.postId && (
              <Link
                to={PUBLIC_PATHS.postDetail(comment.postId)}
                className="mt-0.5 inline-block text-xs text-accent hover:opacity-80"
              >
                {comment.postTitle || '查看文章'}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}