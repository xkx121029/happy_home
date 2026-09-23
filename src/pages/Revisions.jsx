import { useState } from 'react';
import { History, RotateCcw, Trash2, Eye, Search, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { sanitizeHtml } from '../lib/sanitize';

export default function Revisions() {
  const { posts } = useData();
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRevision, setSelectedRevision] = useState(null);

  // 确保 posts 是一个数组
  const postsArray = posts || [];
  const filteredPosts = postsArray.filter(post =>
    post?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 模拟修订数据，因为这个功能还没实现
  const postRevisions = [];

  const handleRestore = (revision) => {
    if (window.confirm('确定要恢复到该修订版本吗？')) {
      alert('修订功能暂未实现');
    }
  };

  const handleDelete = (revisionId) => {
    if (window.confirm('确定要删除该修订记录吗？')) {
      alert('修订功能暂未实现');
      setSelectedRevision(null);
    }
  };

  const handleDeleteOld = (postId) => {
    if (window.confirm('确定要删除旧修订（保留最近5条）吗？')) {
      alert('修订功能暂未实现');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">修订历史</h1>
          <p className="text-muted mt-1">管理所有文章的修订记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl shadow-sm border border-line">
            <div className="p-4 border-b border-line">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredPosts.length > 0 ? (
                <div className="divide-y divide-line">
                  {filteredPosts.map((post) => {
                    const revisionCount = 0;
                    return (
                      <button
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setSelectedRevision(null);
                        }}
                        className={`w-full p-4 text-left hover:bg-surface-2 transition-colors${
                          selectedPost?.id === post.id ? 'bg-accent/12' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-muted mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-fg truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              {revisionCount} 条修订
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-muted">
                  没有找到文章
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-sm border border-line">
            {selectedPost ? (
              <>
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-muted" />
                    <div>
                      <h2 className="font-semibold text-fg">
                        {selectedPost.title}
                      </h2>
                      <p className="text-sm text-muted">
                        共 {postRevisions.length} 条修订记录
                      </p>
                    </div>
                  </div>
                  {postRevisions.length > 5 && (
                    <button
                      onClick={() => handleDeleteOld(selectedPost.id)}
                      className="px-3 py-1.5 text-sm text-danger hover:bg-danger/12  rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除旧修订
                    </button>
                  )}
                </div>

                {postRevisions.length > 0 ? (
                  <div className="divide-y divide-line">
                    {postRevisions.map((revision) => (
                      <div
                        key={revision.id}
                        className={`p-4 hover:bg-surface-2 transition-colors${
                          selectedRevision?.id === revision.id ? 'bg-accent/12' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <History className="w-4 h-4" />
                              <span>{new Date(revision.createdAt).toLocaleString()}</span>
                              <span>|</span>
                              <span>作者: {revision.author}</span>
                            </div>
                            <div className="mt-2">
                              <div className="font-medium text-fg">
                                {revision.title}
                              </div>
                              <div className="text-sm text-muted mt-1 line-clamp-2">
                                {revision.excerpt || '无摘要'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setSelectedRevision(revision)}
                              className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
                              title="预览"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRestore(revision)}
                              className="p-2 text-muted hover:text-success hover:bg-success/12  rounded-lg transition-colors"
                              title="恢复到该版本"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(revision.id)}
                              className="p-2 text-muted hover:text-danger hover:bg-danger/12  rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <History className="w-12 h-12 text-line mx-auto mb-4" />
                    <p className="text-muted">该文章暂无修订记录</p>
                  </div>
                )}

                {selectedRevision && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                      <div className="flex items-center justify-between p-6 border-b border-line">
                        <div>
                          <h3 className="text-lg font-bold text-fg">
                            修订预览
                          </h3>
                          <p className="text-sm text-muted mt-1">
                            {new Date(selectedRevision.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedRevision(null)}
                          className="p-2 text-muted hover:text-fg  hover:bg-surface-2 rounded-lg"
                        >
                          ×
                        </button>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                        <h4 className="text-xl font-bold text-fg mb-4">
                          {selectedRevision.title}
                        </h4>
                        <div className="rich-text max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedRevision.content) }} />
                        </div>
                      </div>
                      <div className="p-6 border-t border-line flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedRevision(null)}
                          className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors"
                        >
                          关闭
                        </button>
                        <button
                          onClick={() => {
                            handleRestore(selectedRevision);
                            setSelectedRevision(null);
                          }}
                          className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          恢复到该版本
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-line mx-auto mb-4" />
                <p className="text-muted">请选择一篇文章查看修订历史</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
