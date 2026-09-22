import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, MessageSquare, Send, Reply, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { commentsAPI } from '../../services/api';
import { sanitizeHtml } from '../../lib/sanitize';
import SidebarWidgets from '../../components/SidebarWidgets';
import SocialShare from '../../components/SocialShare';

export default function PublicPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // 数据自取（路由渲染不再传 props）
  const { posts, settings, categories, tags } = useData();

  // 原来的写法是 posts.find(p => p.id === Number(id))，但文章的 id 是后端生成的
  // UUID 字符串，Number(uuid) 得到 NaN，条件永远不成立 —— 结果就是无论访问哪篇
  // 文章，前台都只显示「文章不存在」，阅读页等于完全不可用。
  // 这里直接按字符串比较，并同时支持用 slug 访问（设置里可选文章链接形式）。
  const post = posts.find(p => p.id === id || p.slug === id);

  const [commentForm, setCommentForm] = useState({ author: '', email: '', content: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ author: '', email: '', content: '' });
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [postComments, setPostComments] = useState([]);

  // 评论单独从公开端点取「已审核」的那部分。
  // 原来直接用 Context 里的 comments（那是后台全量评论，含待审核与垃圾评论），
  // 而且在没有登录的访客场景下根本不会被加载。
  useEffect(() => {
    if (!post?.id) return;
    let cancelled = false;
    commentsAPI.getPublicForPost(post.id)
      .then((res) => {
        if (!cancelled) setPostComments(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setPostComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  // SEO 设置
  const seo = settings?.seo || {};
  const siteUrl = settings?.siteUrl || '';
  const siteName = settings?.siteName || '';

  // 更新页面 SEO 标签
  useEffect(() => {
    if (!post) return;

    const title = seo.siteTitle || post.title;
    const description = seo.siteDescription || post.excerpt || post.content?.slice(0, 160);
    const keywords = seo.siteKeywords || post.tags?.join(', ') || '';
    const ogImage = seo.ogImage || '';

    // 设置文档标题
    document.title = `${title} - ${siteName}`;

    // 更新 meta 标签
    const updateMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);

    // Open Graph 标签
    const updateOg = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOg('og:title', title);
    updateOg('og:description', description);
    updateOg('og:type', 'article');
    updateOg('og:url', `${siteUrl}/posts/${post.id}`);
    updateOg('og:site_name', siteName);
    if (ogImage) updateOg('og:image', ogImage);

    // Twitter Card 标签
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    if (ogImage) updateMeta('twitter:image', ogImage);

    // robots
    if (seo.noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', seo.robots || 'index, follow');
    }

    // Canonical
    if (seo.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${siteUrl}/posts/${post.id}`);
    }

    // 站长验证
    if (seo.googleAnalytics) {
      // GA 会在后续脚本中处理
    }
    if (seo.bingVerification) {
      updateMeta('msvalidate.01', seo.bingVerification);
    }
    if (seo.baiduVerification) {
      updateMeta('baidu-site-verification', seo.baiduVerification);
    }

    return () => {
      // 清理时恢复默认
      document.title = siteName;
    };
  }, [post, seo, siteUrl, siteName]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">文章不存在</h1>
          <p className="text-gray-600 mb-6">您访问的文章可能已被删除或不存在</p>
          <Link
            to="/posts"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  // 对内容进行XSS防护
  const safeContent = sanitizeHtml(post.content);

  // 评论来自上面从公开端点拉取的 postComments（已审核），
  // 并且这些调用原本既不 await 也不处理失败，提交后无论成功与否都提示"已提交"。
  const topLevelComments = postComments.filter(c => !c.parentId);

  const getReplies = (parentId) => postComments.filter(c => c.parentId === parentId);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!commentForm.author || !commentForm.email || !commentForm.content) {
      setSubmitError('请填写昵称、邮箱和评论内容');
      return;
    }
    try {
      await commentsAPI.createPublic({
        postId: post.id,
        author: commentForm.author,
        email: commentForm.email,
        content: commentForm.content,
        parentId: null,
      });
      setCommentForm({ author: '', email: '', content: '' });
      setCommentSubmitted(true);
      setTimeout(() => setCommentSubmitted(false), 4000);
    } catch (err) {
      setSubmitError(err.message || '提交失败，请稍后重试');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!replyForm.author || !replyForm.email || !replyForm.content) {
      setSubmitError('请填写昵称、邮箱和回复内容');
      return;
    }
    try {
      await commentsAPI.reply(replyingTo, {
        postId: post.id,
        author: replyForm.author,
        email: replyForm.email,
        content: replyForm.content,
      });
      setReplyForm({ author: '', email: '', content: '' });
      setReplyingTo(null);
      setCommentSubmitted(true);
      setTimeout(() => setCommentSubmitted(false), 4000);
    } catch (err) {
      setSubmitError(err.message || '回复失败，请稍后重试');
    }
  };

  const getAvatar = (author) => {
    const initial = (author || '').charAt(0).toUpperCase() || '?';
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
        {initial}
      </div>
    );
  };

  const renderReplies = (parentId, level = 1) => {
    const replies = getReplies(parentId);
    if (replies.length === 0) return null;

    return (
      <div className={`mt-4 space-y-4 ${level > 1 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        {replies.map(reply => (
          <div key={reply.id} className="relative">
            <div className="flex gap-3">
              {getAvatar(reply.author)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{reply.author}</span>
                  <span className="text-sm text-gray-500">{reply.email}</span>
                  <span className="text-xs text-gray-400">{reply.createdAt}</span>
                </div>
                <p className="text-gray-600 mb-2">{reply.content}</p>
                <button
                  onClick={() => setReplyingTo(reply.id)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <Reply className="w-3 h-3" />
                  回复
                </button>
              </div>
            </div>
            {replyingTo === reply.id && (
              <form onSubmit={handleReplySubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="昵称"
                    value={replyForm.author}
                    onChange={e => setReplyForm({ ...replyForm, author: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                  />
                  <input
                    type="email"
                    placeholder="邮箱"
                    value={replyForm.email}
                    onChange={e => setReplyForm({ ...replyForm, email: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                  />
                </div>
                <textarea
                  placeholder="回复内容..."
                  value={replyForm.content}
                  onChange={e => setReplyForm({ ...replyForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 mb-4"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    提交回复
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
    <div className="min-h-screen bg-gray-50">
      <article>
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {post.category}
              </span>
              {post.tags && post.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author}</p>
                  <p className="text-sm">作者</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />

              {/* Social Share Bar */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-500 mb-3">
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">分享这篇文章</span>
                </div>
                <SocialShare
                  url={`${settings?.siteUrl || window.location.origin}/posts/${post.id}`}
                  title={post.title}
                  excerpt={post.excerpt}
                  enabledPlatforms={['wechat', 'weibo', 'qq', 'qzone', 'facebook', 'twitter', 'linkedin']}
                  style="circle"
                  size="medium"
                  showLabel={false}
                />
              </div>

              {/* Comments Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  评论 ({postComments.length})
                </h2>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-8 p-6 bg-white rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">发表评论</h3>
                  {commentSubmitted && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                      评论已提交，等待审核后显示
                    </div>
                  )}
                  {submitError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                      {submitError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="昵称 *"
                      value={commentForm.author}
                      onChange={e => setCommentForm({ ...commentForm, author: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="邮箱 *"
                      value={commentForm.email}
                      onChange={e => setCommentForm({ ...commentForm, email: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="评论内容 *"
                    value={commentForm.content}
                    onChange={e => setCommentForm({ ...commentForm, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={4}
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    提交评论
                  </button>
                </form>

                {/* Comments List */}
                {topLevelComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无评论，来说两句吧
                  </div>
                ) : (
                  <div className="space-y-6">
                    {topLevelComments.map(comment => {
                      const replyCount = getReplies(comment.id).length;
                      return (
                        <div key={comment.id} className="p-6 bg-white rounded-xl shadow-sm">
                          <div className="flex gap-3">
                            {getAvatar(comment.author)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{comment.author}</span>
                                <span className="text-sm text-gray-500">{comment.email}</span>
                              </div>
                              <p className="text-gray-600 mb-2">{comment.content}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">{comment.createdAt}</span>
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                                >
                                  <Reply className="w-3 h-3" />
                                  回复 {replyCount > 0 && `(${replyCount})`}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <form onSubmit={handleReplySubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <input
                                  type="text"
                                  placeholder="昵称"
                                  value={replyForm.author}
                                  onChange={e => setReplyForm({ ...replyForm, author: e.target.value })}
                                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                                <input
                                  type="email"
                                  placeholder="邮箱"
                                  value={replyForm.email}
                                  onChange={e => setReplyForm({ ...replyForm, email: e.target.value })}
                                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                              </div>
                              <textarea
                                placeholder="回复内容..."
                                value={replyForm.content}
                                onChange={e => setReplyForm({ ...replyForm, content: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 mb-4"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                  提交回复
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(null)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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

            {/* Sidebar */}
            <aside className="lg:w-80">
              <SidebarWidgets
                posts={posts}
                categories={categories}
                tags={tags}
                settings={settings}
              />
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}
