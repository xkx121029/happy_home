import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Check, Trash2, Reply, MessageSquare, User, Mail, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../components/Notification';
import Modal from '../components/Modal';

export default function Comments() {
  const { comments, posts, deleteComment, updateCommentStatus, createComment } = useData();
  const { warning, success, error } = useNotification();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComments, setSelectedComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ author: '', email: '', content: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const getCommentField = (comment, field) => {
    const mapping = {
      postId: comment.post_id,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
    };
    return mapping[field];
  };

  const tabs = [
    { id: 'all', label: '全部', count: comments.length },
    { id: 'pending', label: '待审核', count: comments.filter(c => c.status === 'pending').length },
    { id: 'approved', label: '已通过', count: comments.filter(c => c.status === 'approved').length },
    { id: 'spam', label: '垃圾评论', count: comments.filter(c => c.status === 'spam').length },
  ];

  const filteredComments = comments.filter((comment) => {
    if (activeTab !== 'all' && comment.status !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        comment.author.toLowerCase().includes(query) ||
        comment.email.toLowerCase().includes(query) ||
        comment.content.toLowerCase().includes(query)
      );
    }
    return true;
  }).filter(c => !getCommentField(c, 'parentId'));

  const topLevelComments = filteredComments;

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full',
      approved: 'px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full',
      spam: 'px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full',
      trash: 'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full',
    };
    const labels = {
      pending: '待审核',
      approved: '已通过',
      spam: '垃圾评论',
      trash: '回收站',
    };
    return <span className={badges[status]}>{labels[status]}</span>;
  };

  const getPostTitle = (postId) => {
    const post = posts.find(p => p.id === postId);
    return post ? post.title : '未知文章';
  };

  const getAvatar = (author) => {
    const initial = (author || '').charAt(0).toUpperCase() || '?';
    return (
      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-fg font-medium">
        {initial}
      </div>
    );
  };

  const handleSelect = (id) => {
    setSelectedComments(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApprove = (id) => {
    updateCommentStatus(id, 'approved');
  };

  const handleSpam = (id) => {
    updateCommentStatus(id, 'spam');
  };

  const handleTrash = (id) => {
    setConfirmModal({
      isOpen: true,
      title: '确认移到回收站',
      message: '确定要将这条评论移到回收站吗？',
      onConfirm: () => updateCommentStatus(id, 'trash')
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要永久删除这条评论及其回复吗？',
      onConfirm: () => deleteComment(id)
    });
  };

  const handleBulkApprove = () => {
    selectedComments.forEach(id => updateCommentStatus(id, 'approved'));
    setSelectedComments([]);
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: '确认批量删除',
      message: `确定要永久删除选中的 ${selectedComments.length} 条评论吗？`,
      onConfirm: () => {
        selectedComments.forEach(id => deleteComment(id));
        setSelectedComments([]);
      }
    });
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyForm({ author: '', email: '', content: '' });
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyForm.author || !replyForm.email || !replyForm.content) {
      warning('请填写所有字段');
      return;
    }
    const parentComment = comments.find(c => c.id === replyingTo);
    createComment({
      postId: parentComment ? getCommentField(parentComment, 'postId') || null : null,
      parentId: replyingTo,
      author: replyForm.author,
      email: replyForm.email,
      content: replyForm.content,
    });
    setReplyingTo(null);
    setReplyForm({ author: '', email: '', content: '' });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyForm({ author: '', email: '', content: '' });
  };

  const renderReplies = (parentId, level = 1) => {
    const replies = comments.filter(c => getCommentField(c, 'parentId') === parentId);
    if (replies.length === 0) return null;

    return (
      <div className={`mt-4 space-y-4${level > 1 ? 'ml-8 border-l-2 border-line pl-4' : ''}`}>
        {replies.map(reply => (
          <div key={reply.id} className="relative">
            <div className="flex gap-3">
              {getAvatar(reply.author)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-fg">{reply.author}</span>
                  <span className="text-sm text-muted">{reply.email}</span>
                  {getStatusBadge(reply.status)}
                </div>
                <p className="text-muted  mb-2">{reply.content}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted">{getCommentField(reply, 'createdAt')}</span>
                  {reply.status === 'approved' && (
                    <button
                      onClick={() => handleReply(reply.id)}
                      className="flex items-center gap-1 text-accent hover:text-accent"
                    >
                      <Reply className="w-3 h-3" />
                      回复
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="flex items-center gap-1 text-danger hover:text-danger"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </div>
            </div>
            {replyingTo === reply.id && (
              <form onSubmit={handleReplySubmit} className="mt-4 p-4 bg-bg  rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="昵称"
                    value={replyForm.author}
                    onChange={e => setReplyForm({ ...replyForm, author: e.target.value })}
                    className="px-3 py-2 border border-line rounded-lg bg-surface text-fg"
                  />
                  <input
                    type="email"
                    placeholder="邮箱"
                    value={replyForm.email}
                    onChange={e => setReplyForm({ ...replyForm, email: e.target.value })}
                    className="px-3 py-2 border border-line rounded-lg bg-surface text-fg"
                  />
                </div>
                <textarea
                  placeholder="回复内容..."
                  value={replyForm.content}
                  onChange={e => setReplyForm({ ...replyForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-fg mb-4"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700"
                  >
                    提交回复
                  </button>
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="px-4 py-2 bg-surface-2  text-fg rounded-lg hover:bg-line"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}
            {renderReplies(reply.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">评论管理</h1>
        <p className="text-muted mt-1">管理用户评论和回复</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-line">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedComments([]);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-surface-2">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="搜索评论..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div className="mb-4 p-3 bg-accent/12  rounded-lg flex items-center justify-between">
          <span className="text-sm text-accent">
            已选择 {selectedComments.length} 条评论
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1 text-sm bg-success text-success-fg rounded-lg hover:bg-success"
            >
              批量通过
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-danger text-danger-fg rounded-lg hover:bg-danger"
            >
              批量删除
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="bg-surface rounded-xl shadow-sm border border-line">
        {topLevelComments.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-line mb-4" />
            <p className="text-muted">没有找到评论</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {topLevelComments.map(comment => {
              const replyCount = comments.filter(c => getCommentField(c, 'parentId') === comment.id).length;
              return (
                <div key={comment.id} className="p-6">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={() => handleSelect(comment.id)}
                      className="mt-1 w-4 h-4 text-accent rounded border-line"
                    />
                    {getAvatar(comment.author)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-fg">{comment.author}</span>
                        <span className="text-sm text-muted flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {comment.email}
                        </span>
                        {getStatusBadge(comment.status)}
                        {replyCount > 0 && (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {replyCount} 条回复
                          </span>
                        )}
                      </div>
                      <p className="text-muted  mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Link
                          to={`/posts/${getCommentField(comment, 'postId')}`}
                          className="text-accent hover:text-accent flex items-center gap-1"
                        >
                          <User className="w-3 h-3" />
                          {getPostTitle(getCommentField(comment, 'postId'))}
                        </Link>
                        <span className="text-muted">{getCommentField(comment, 'createdAt')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {comment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-success text-success-fg rounded-lg hover:bg-success"
                            >
                              <Check className="w-3 h-3" />
                              通过
                            </button>
                            <button
                              onClick={() => handleSpam(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-warning text-warning-fg rounded-lg hover:bg-warning"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              标记垃圾
                            </button>
                          </>
                        )}
                        {comment.status === 'approved' && (
                          <button
                            onClick={() => handleReply(comment.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-accent text-accent-fg rounded-lg hover:bg-accent-700"
                          >
                            <Reply className="w-3 h-3" />
                            回复
                          </button>
                        )}
                        <button
                          onClick={() => handleTrash(comment.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-surface-2  text-fg rounded-lg hover:bg-line"
                        >
                          <Trash2 className="w-3 h-3" />
                          移至回收站
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-danger/12  text-danger rounded-lg hover:bg-danger/12"
                        >
                          <Trash2 className="w-3 h-3" />
                          永久删除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <form onSubmit={handleReplySubmit} className="mt-4 p-4 bg-bg  rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="昵称"
                          value={replyForm.author}
                          onChange={e => setReplyForm({ ...replyForm, author: e.target.value })}
                          className="px-3 py-2 border border-line rounded-lg bg-surface text-fg"
                        />
                        <input
                          type="email"
                          placeholder="邮箱"
                          value={replyForm.email}
                          onChange={e => setReplyForm({ ...replyForm, email: e.target.value })}
                          className="px-3 py-2 border border-line rounded-lg bg-surface text-fg"
                        />
                      </div>
                      <textarea
                        placeholder="回复内容..."
                        value={replyForm.content}
                        onChange={e => setReplyForm({ ...replyForm, content: e.target.value })}
                        className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-fg mb-4"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:bg-accent-700"
                        >
                          提交回复
                        </button>
                        <button
                          type="button"
                          onClick={cancelReply}
                          className="px-4 py-2 bg-surface-2  text-fg rounded-lg hover:bg-line"
                        >
                          取消
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Nested Replies */}
                  {renderReplies(comment.id)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    
    <Modal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      title={confirmModal.title}
      message={confirmModal.message}
      type="confirm"
      onConfirm={confirmModal.onConfirm}
    />
    </>
  );
}
