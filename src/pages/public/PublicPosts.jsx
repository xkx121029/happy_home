import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, FileText, Pin, Search, User } from 'lucide-react';
import { publicAPI } from '../../services/api';
import { useResource } from '../../hooks/useResource';
import { useSiteSettings } from '../../state/SiteSettingsContext';
import { excerptFrom, formatDate } from '../../lib/format';

/**
 * 前台文章列表。
 *
 * 原来从 DataContext 取全量文章，再在浏览器里过滤与排序 ——
 * 意味着前台会拿到后台那份含草稿的数据，而且没有任何分页，
 * 文章一多就要把整张表拉下来。现在改走公开端点，
 * 分页、搜索、分类筛选都在服务端完成，每页条数来自「内容」页的 postsPerPage。
 */
export default function PublicPosts() {
  const { settings } = useSiteSettings();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, error } = useResource(
    () => publicAPI.getPosts({ page, search: search || undefined, category: category || undefined }),
    { deps: [page, search, category], select: (res) => res }
  );

  const categories = useResource(
    () => publicAPI.getCategories(),
    { initialData: [], select: (res) => res?.data || [] }
  );

  const posts = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const excerptLength = Number(settings?.excerptLength) || 150;

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeCategory = (value) => {
    setPage(1);
    setCategory(value);
  };

  const goToPage = (next) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-bg py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-fg mb-3">文章列表</h1>
          <p className="text-muted max-w-2xl mx-auto">浏览我们最新的文章，发现有趣的内容。</p>
        </div>

        <form
          onSubmit={applySearch}
          className="bg-surface rounded-lg border border-line p-4 mb-8 flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜索文章…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface text-fg placeholder:text-muted/70 border border-line focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(event) => changeCategory(event.target.value)}
            className="h-10 px-3 rounded-lg bg-surface text-fg border border-line focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">全部分类</option>
            {(categories.data || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 px-5 rounded-lg bg-accent text-accent-fg font-medium active:scale-[0.97] transition-colors duration-100 ease-entry"
          >
            搜索
          </button>
        </form>

        {isLoading ? (
          <p className="text-center text-muted py-20">正在加载…</p>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-fg mb-2">文章加载失败</h3>
            <p className="text-muted">{error.message || '请稍后重试'}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg mb-2">没有找到文章</h3>
            <p className="text-muted">尝试调整搜索条件或分类筛选</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-surface rounded-lg border border-line overflow-hidden transition-shadow duration-160 ease-entry hover:shadow-md"
                >
                  <Link to={`/posts/${post.id}`} className="block">
                    <div className="bg-surface-2 aspect-video flex items-center justify-center text-muted">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {post.sticky && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/12 text-accent text-xs font-medium">
                            <Pin className="w-3 h-3" />
                            置顶
                          </span>
                        )}
                        {post.category && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/12 text-accent text-xs font-medium">
                            {post.category}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-fg mb-2 line-clamp-2">{post.title}</h2>
                      <p className="text-sm text-muted line-clamp-2 mb-4">
                        {excerptFrom(post, excerptLength)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-surface-2 grid place-items-center">
                          <User className="w-3 h-3 text-muted" />
                        </span>
                        <span className="text-xs text-muted">{post.author}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-line text-sm text-fg disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-2 transition-colors duration-100 ease-entry"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </button>
                <span className="text-sm text-muted tabular-nums">
                  第 {page} / {totalPages} 页 · 共 {total} 篇
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-line text-sm text-fg disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-2 transition-colors duration-100 ease-entry"
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
