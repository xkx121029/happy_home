import { useState, useEffect, useCallback, Fragment } from 'react';
import { History, RotateCcw, Trash2, GitCompare, Search, FileText, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { useModal, useToast } from '../hooks/useModal';
import Modal, { Toast } from '../components/Modal';
import { revisionsAPI } from '../services/api';
import { formatDateTime } from '../lib/format';
import { htmlToLines } from '../lib/sanitize';
import { diffLines, summarizeDiff } from '../lib/diff';
import StatusBadge from '../components/ui/StatusBadge';
import { cn } from '../lib/cn';

/**
 * 修订历史。
 *
 * 这一页此前是空壳：列表写死 `const postRevisions = []`，三个操作全是
 * `alert('修订功能暂未实现')`。阶段 2 已经把后端端点补齐（列表 / 详情 /
 * 回滚 / 删除），这里接上真实数据，并补上「两个版本到底差在哪」的对比视图。
 *
 * 快照由后端在保存文章时写（posts 的 PUT 里，只在正文真的变了时才记），
 * 前端不负责创建修订 —— 所以这一页是只读的，只有回滚与删除两个写操作。
 */

const STATUS_LABELS = {
  published: { text: '已发布', tone: 'success' },
  draft: { text: '草稿', tone: 'neutral' },
  future: { text: '定时', tone: 'info' },
  pending: { text: '待审核', tone: 'warning' },
  private: { text: '私密', tone: 'warning' },
};

export default function Revisions() {
  const { posts } = useData();
  const { settings } = useSiteSettings();
  const timeZone = settings?.timezone;
  const { confirm, alert, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();

  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [compare, setCompare] = useState(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  const postsArray = posts || [];
  const selectedPost = postsArray.find((post) => post.id === selectedPostId) || null;

  const filteredPosts = postsArray.filter((post) =>
    post?.title?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const loadRevisions = useCallback(
    async (postId) => {
      setIsLoadingList(true);
      try {
        const response = await revisionsAPI.listForPost(postId);
        setRevisions(response.data || []);
      } catch (error) {
        setRevisions([]);
        showToast(error.message || '加载修订记录失败', 'error');
      } finally {
        setIsLoadingList(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (selectedPostId) loadRevisions(selectedPostId);
    else setRevisions([]);
  }, [selectedPostId, loadRevisions]);

  // 详情端点会一并带上当前版本，所以对比视图只发这一次请求
  const handleOpenCompare = async (revision) => {
    setIsLoadingCompare(true);
    try {
      const response = await revisionsAPI.getById(revision.id);
      setCompare({ revision: response.data, current: response.current });
    } catch (error) {
      showToast(error.message || '加载版本详情失败', 'error');
    } finally {
      setIsLoadingCompare(false);
    }
  };

  const handleRestore = async (revision) => {
    const okToRestore = await confirm({
      title: '恢复到此版本',
      message: `将把「${selectedPost?.title || '该文章'}」的标题与正文回滚到 ${formatDateTime(
        revision.createdAt,
        timeZone
      )} 的版本。当前内容会先自动留一份快照，可以再回滚回来。`,
      confirmText: '恢复',
    });
    if (!okToRestore) return;

    try {
      await revisionsAPI.restore(revision.id);
      setCompare(null);
      // 回滚本身也会留一份快照，所以要重新拉列表
      await loadRevisions(revision.postId);
      showToast('已恢复到该版本', 'success');
    } catch (error) {
      showToast(error.message || '恢复失败', 'error');
    }
  };

  const handleDelete = async (revision) => {
    const okToDelete = await confirm({
      title: '删除修订',
      message: '删除后这一份快照就无法再恢复，确定继续吗？',
      confirmText: '删除',
      type: 'error',
    });
    if (!okToDelete) return;

    try {
      await revisionsAPI.delete(revision.id);
      if (compare?.revision?.id === revision.id) setCompare(null);
      setRevisions((prev) => prev.filter((item) => item.id !== revision.id));
      showToast('修订记录已删除', 'success');
    } catch (error) {
      showToast(error.message || '删除失败', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">修订历史</h1>
          <p className="text-muted mt-1">
            保存文章时若正文有变化，后端会自动留一份快照，可以在这里对比与回滚
          </p>
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
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface text-fg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredPosts.length > 0 ? (
                <div className="divide-y divide-line">
                  {filteredPosts.map((post) => {
                    const status = STATUS_LABELS[post.status];
                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPostId(post.id)}
                        className={cn(
                          'w-full p-4 text-left hover:bg-surface-2 transition-colors',
                          selectedPostId === post.id && 'bg-accent/12'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-muted mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-fg truncate">{post.title}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {status && (
                                <StatusBadge tone={status.tone}>{status.text}</StatusBadge>
                              )}
                              <span className="text-xs text-muted">
                                {formatDateTime(post.updatedAt, timeZone)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-muted">没有找到文章</div>
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
                      <h2 className="font-semibold text-fg">{selectedPost.title}</h2>
                      <p className="text-sm text-muted">
                        {isLoadingList ? '加载中…' : `共 ${revisions.length} 条修订记录`}
                      </p>
                    </div>
                  </div>
                </div>

                {isLoadingList ? (
                  <div className="p-12 text-center text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                    正在加载修订记录
                  </div>
                ) : revisions.length > 0 ? (
                  <div className="divide-y divide-line">
                    {revisions.map((revision) => (
                      <div
                        key={revision.id}
                        className="p-4 hover:bg-surface-2 transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <History className="w-4 h-4" />
                            <span>{formatDateTime(revision.createdAt, timeZone)}</span>
                            <span className="text-line">|</span>
                            <span>作者：{revision.author || '未知'}</span>
                          </div>
                          <div className="mt-2 font-medium text-fg truncate">{revision.title}</div>
                          <div className="text-sm text-muted mt-1 line-clamp-2">
                            {revision.excerpt || '无摘要'}
                          </div>
                          <div className="text-xs text-muted mt-1">
                            正文 {revision.contentLength ?? 0} 字符
                            {revision.title !== selectedPost.title && ' · 标题与当前版本不同'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenCompare(revision)}
                            className="p-2 text-muted hover:text-accent hover:bg-accent/12 rounded-lg transition-colors"
                            title="与当前版本对比"
                          >
                            <GitCompare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(revision)}
                            className="p-2 text-muted hover:text-success hover:bg-success/12 rounded-lg transition-colors"
                            title="恢复到该版本"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(revision)}
                            className="p-2 text-muted hover:text-danger hover:bg-danger/12 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <History className="w-12 h-12 text-line mx-auto mb-4" />
                    <p className="text-muted">该文章暂无修订记录</p>
                    <p className="text-sm text-muted mt-2">
                      只有正文真正变化时才会留快照，仅改错别字之外的保存不会产生记录
                    </p>
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

      {isLoadingCompare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl px-6 py-5 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-fg">正在读取版本内容</span>
          </div>
        </div>
      )}

      {compare && (
        <CompareDialog
          revision={compare.revision}
          current={compare.current}
          timeZone={timeZone}
          onClose={() => setCompare(null)}
          onRestore={() => handleRestore(compare.revision)}
        />
      )}

      <Modal isOpen={isModalOpen} {...modalConfig} onClose={closeModal} />
      <Toast
        isOpen={isToastOpen}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        onClose={closeToast}
      />
    </div>
  );
}

/**
 * 并排对比。
 *
 * 左右两列由**同一个** diff 数组驱动：遍历一次，每个条目产出左右两个格子，
 * same/del 填左、same/add 填右。这样两列天然逐行对齐，不需要额外计算
 * 行号或插入占位行 —— 这是并排视图最容易写错的地方。
 */
function CompareDialog({ revision, current, timeZone, onClose, onRestore }) {
  const leftLines = htmlToLines(revision?.content);
  const rightLines = htmlToLines(current?.content);
  const parts = diffLines(leftLines.join('\n'), rightLines.join('\n'));
  const summary = summarizeDiff(parts);
  const titleChanged = revision?.title !== current?.title;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-6xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-line">
          <div>
            <h3 className="text-lg font-bold text-fg flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-muted" />
              版本对比
            </h3>
            <p className="text-sm text-muted mt-1">
              {formatDateTime(revision?.createdAt, timeZone)} 的版本 → 当前版本
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-success">新增 {summary.added} 行</span>
              <span className="text-danger">删除 {summary.removed} 行</span>
              {summary.changed === 0 && <span className="text-muted">正文没有差异</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line border-b border-line text-sm">
          <div className="bg-surface-2 px-4 py-2">
            <div className="text-xs text-muted mb-1">该版本</div>
            <div className={cn('font-medium truncate', titleChanged ? 'text-danger' : 'text-fg')}>
              {revision?.title}
            </div>
          </div>
          <div className="bg-surface-2 px-4 py-2">
            <div className="text-xs text-muted mb-1">当前版本</div>
            <div className={cn('font-medium truncate', titleChanged ? 'text-success' : 'text-fg')}>
              {current?.title}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {parts.length === 0 ? (
            <div className="p-12 text-center text-muted">两个版本都没有正文内容</div>
          ) : (
            <div className="grid grid-cols-2 gap-px bg-line">
              {parts.map((part, index) => (
                <Fragment key={index}>
                  <DiffCell
                    text={part.type === 'add' ? '' : part.text}
                    tone={part.type === 'del' ? 'del' : 'none'}
                  />
                  <DiffCell
                    text={part.type === 'del' ? '' : part.text}
                    tone={part.type === 'add' ? 'add' : 'none'}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-line flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-line text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            恢复到该版本
          </button>
        </div>
      </div>
    </div>
  );
}

function DiffCell({ text, tone }) {
  return (
    <div
      className={cn(
        'px-4 py-0.5 min-h-[1.5rem] whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-fg',
        tone === 'add' && 'bg-success/12',
        tone === 'del' && 'bg-danger/12'
      )}
    >
      {text}
    </div>
  );
}
