import { useState } from 'react';
import { History, RotateCcw, Trash2, Eye, Search, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">修订历史</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理所有文章的修订记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredPosts.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPosts.map((post) => {
                    const revisionCount = 0;
                    return (
                      <button
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setSelectedRevision(null);
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedPost?.id === post.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {revisionCount} 条修订
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  没有找到文章
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {selectedPost ? (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-gray-400" />
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {selectedPost.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        共 {postRevisions.length} 条修订记录
                      </p>
                    </div>
                  </div>
                  {postRevisions.length > 5 && (
                    <button
                      onClick={() => handleDeleteOld(selectedPost.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除旧修订
                    </button>
                  )}
                </div>

                {postRevisions.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {postRevisions.map((revision) => (
                      <div
                        key={revision.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedRevision?.id === revision.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <History className="w-4 h-4" />
                              <span>{new Date(revision.createdAt).toLocaleString()}</span>
                              <span>|</span>
                              <span>作者: {revision.author}</span>
                            </div>
                            <div className="mt-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {revision.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {revision.excerpt || '无摘要'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setSelectedRevision(revision)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="预览"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRestore(revision)}
                              className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                              title="恢复到该版本"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(revision.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
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
                    <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">该文章暂无修订记录</p>
                  </div>
                )}

                {selectedRevision && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            修订预览
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(selectedRevision.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedRevision(null)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          ×
                        </button>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                          {selectedRevision.title}
                        </h4>
                        <div className="prose dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedRevision.content }} />
                        </div>
                      </div>
                      <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedRevision(null)}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          关闭
                        </button>
                        <button
                          onClick={() => {
                            handleRestore(selectedRevision);
                            setSelectedRevision(null);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
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
                <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">请选择一篇文章查看修订历史</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
