import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Calendar, Tag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import ContentPreview from '../components/ContentPreview';
import { categories } from '../data/mockData';
import { postsAPI } from '../utils/dataStore';

export default function PostEditor({ onSave, onCancel }) {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [postId, setPostId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const fetchedPost = postsAPI.getById(parseInt(id));
      if (fetchedPost) {
        setPostId(fetchedPost.id);
        setTitle(fetchedPost.title || '');
        setContent(fetchedPost.content || '');
        setExcerpt(fetchedPost.excerpt || '');
        setCategory(fetchedPost.category || categories[0]);
        setTags(fetchedPost.tags || []);
        setIsPublished(fetchedPost.status === 'published');
      }
    }
  }, [id]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveDraft = () => {
    const postData = {
      title: title || '无标题',
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      status: 'draft',
      category,
      tags,
      author: 'admin',
    };
    
    if (onSave) {
      onSave({ ...postData, id: postId });
    }
    navigate('/admin/posts');
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入文章内容');
      return;
    }
    
    const postData = {
      title,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      status: 'published',
      category,
      tags,
      author: 'admin',
    };
    
    if (onSave) {
      onSave({ ...postData, id: postId });
    }
    navigate('/admin/posts');
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    }
    navigate('/admin/posts');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancelClick}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {postId ? '编辑文章' : '新建文章'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">创建精彩内容，分享您的故事</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isPublished ? '更新发布' : '发布'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              className="w-full text-2xl font-bold text-gray-900 dark:text-white border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
            />
            
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">文章设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100">
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="输入标签后按回车添加"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">摘要</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要，将显示在文章列表中..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">发布信息</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>创建日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>更新日期: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span>作者: admin</span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  isPublished ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {isPublished ? '已发布' : '草稿'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <ContentPreview
          content={content}
          title={title}
          onClose={() => setShowPreview(false)}
          type="article"
        />
      )}
    </div>
  );
}
