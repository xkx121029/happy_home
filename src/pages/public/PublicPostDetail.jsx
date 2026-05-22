import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, MessageSquare, Send, Reply, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import SidebarWidgets from '../../components/SidebarWidgets';
import SocialShare from '../../components/SocialShare';

// XSS防护：增强的HTML过滤函数
const sanitizeHTML = (html) => {
  if (!html) return '';
  
  // 创建一个临时div来解析HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 1. 移除所有危险的标签
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta', 'style'];
  dangerousTags.forEach(tagName => {
    const elements = temp.getElementsByTagName(tagName);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  });
  
  // 2. 移除所有事件处理器属性和危险属性
  const allElements = temp.getElementsByTagName('*');
  const dangerousAttrs = [
    // 事件处理器
    /^on/i,
    // 危险属性
    /^(src|href|data|style)$/i, // 需要进一步检查
  ];
  
  const dangerousPatterns = [
    /javascript:/i,
    /data:(?!image\/(png|jpg|jpeg|gif|webp))/i, // 只允许图片data URL
    /vbscript:/i,
    /expression\s*\(/i, // CSS表达式（IE）
  ];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const attrs = Array.from(element.attributes);
    
    attrs.forEach(attr => {
      const attrName = attr.name.toLowerCase();
      let shouldRemove = false;
      
      // 检查是否是事件处理器（on开头）
      if (attrName.startsWith('on')) {
        shouldRemove = true;
      }
      
      // 检查href/src/data属性中的危险协议
      if (['href', 'src', 'data', 'action', 'poster'].includes(attrName)) {
        const attrValue = attr.value || '';
        if (dangerousPatterns.some(pattern => pattern.test(attrValue))) {
          shouldRemove = true;
        }
      }
      
      // 检查style属性中的危险内容
      if (attrName === 'style') {
        if (/expression\s*\(|url\s*\(|javascript:/i.test(attr.value || '')) {
          shouldRemove = true;
        }
      }
      
      if (shouldRemove) {
        element.removeAttribute(attr.name);
      }
    });
  }
  
  return temp.innerHTML;
};

export default function PublicPostDetail({ posts: propPosts, settings: propSettings }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts: contextPosts, settings: contextSettings, categories, tags, comments, commentsAPI, widgets } = useData();

  const posts = propPosts || contextPosts;
  const settings = propSettings || contextSettings;
  const post = posts.find(p => p.id === Number(id));

  const [commentForm, setCommentForm] = useState({ author: '', email: '', content: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ author: '', email: '', content: '' });
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  // SEO 设置
  const seo = settings?.seo || {};
  const siteUrl = settings?.siteUrl || '';
  const siteName = settings?.siteName || '';

  // 更新页面 SEO 标签
  useEffect(() => {
    if (!post) return;

    const title = seo.siteTitle || post.title;
    const description = seo.siteDescription || post.excerpt || post.content?.substring(0, 160);
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
  const safeContent = sanitizeHTML(post.content);

  // 获取文章的评论（只显示已审核的）
  const postComments = comments.filter(c => c.postId === Number(id) && c.status === 'approved');
  const topLevelComments = postComments.filter(c => !c.parentId);

  const getReplies = (parentId) => postComments.filter(c => c.parentId === parentId);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentForm.author || !commentForm.email || !commentForm.content) {
      alert('请填写所有字段');
      return;
    }
    commentsAPI.create({
      postId: Number(id),
      author: commentForm.author,
      email: commentForm.email,
      content: commentForm.content,
      parentId: null,
    });
    setCommentForm({ author: '', email: '', content: '' });
    setCommentSubmitted(true);
    setTimeout(() => setCommentSubmitted(false), 3000);
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyForm.author || !replyForm.email || !replyForm.content) {
      alert('请填写所有字段');
      return;
    }
    commentsAPI.reply(replyingTo, {
      author: replyForm.author,
      email: replyForm.email,
      content: replyForm.content,
    });
    setReplyForm({ author: '', email: '', content: '' });
    setReplyingTo(null);
  };

  const getAvatar = (author) => {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
        {author.charAt(0).toUpperCase()}
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
                widgets={widgets}
                posts={posts}
                categories={categories}
                tags={tags}
                comments={comments}
                settings={settings}
              />
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}
