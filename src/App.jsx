import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import Pages from './pages/Pages';
import PageEditor from './pages/PageEditor';
import Media from './pages/Media';
import Users from './pages/Users';
import UserEditor from './pages/UserEditor';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Roles from './pages/Roles';
import Menus from './pages/Menus';
import Comments from './pages/Comments';
import Widgets from './pages/Widgets';
import Revisions from './pages/Revisions';

import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';
import PublicHome from './pages/public/PublicHome';
import PublicPosts from './pages/public/PublicPosts';
import PublicPostDetail from './pages/public/PublicPostDetail';
import PublicPageDetail from './pages/public/PublicPageDetail';

import TutorialSystem from './components/TutorialSystem';
import PrivateRoute from './components/PrivateRoute';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const { 
    posts, pages, users, mediaItems, categories, tags, settings, updateSettings,
    createPost, updatePost, deletePost,
    createPage, updatePage, deletePage,
    createCategory, updateCategory, deleteCategory,
    createTag, updateTag, deleteTag
  } = useData();

  useEffect(() => {
    const checkScheduledPosts = () => {
      const now = new Date();
      posts.forEach(post => {
        if (post.status === 'future' && post.publishDate) {
          const publishTime = new Date(post.publishDate);
          if (publishTime <= now) {
            postsAPI.update(post.id, { status: 'published', publishDate: null });
          }
        }
      });
    };

    checkScheduledPosts();
    const interval = setInterval(checkScheduledPosts, 60000);
    return () => clearInterval(interval);
  }, [posts]);

  const handleDarkModeToggle = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  const handleSavePost = useCallback(async (postData) => {
    if (postData.id) {
      await updatePost(postData.id, postData);
    } else {
      await createPost(postData);
    }
  }, [updatePost, createPost]);

  const handleDeletePost = useCallback(async (id) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      await deletePost(id);
    }
  }, [deletePost]);

  const handleSavePage = useCallback(async (pageData) => {
    if (pageData.id) {
      await updatePage(pageData.id, pageData);
    } else {
      await createPage(pageData);
    }
  }, [updatePage, createPage]);

  const handleDeletePage = useCallback(async (id) => {
    if (window.confirm('确定要删除这个页面吗？')) {
      await deletePage(id);
    }
  }, [deletePage]);

  const handleSaveUser = useCallback((userData) => {
    console.log('handleSaveUser not implemented', userData);
  }, []);

  const handleDeleteUser = useCallback((id) => {
    console.log('handleDeleteUser not implemented', id);
  }, []);

  const handleUploadMedia = useCallback((file, url) => {
    console.log('handleUploadMedia not implemented', file, url);
  }, []);

  const handleDeleteMedia = useCallback((id) => {
    console.log('handleDeleteMedia not implemented', id);
  }, []);

  const handleSaveCategory = useCallback(async (categoryData) => {
    if (categoryData.id) {
      await updateCategory(categoryData.id, categoryData);
    } else {
      await createCategory(categoryData);
    }
  }, [updateCategory, createCategory]);

  const handleDeleteCategory = useCallback(async (id) => {
    await deleteCategory(id);
  }, [deleteCategory]);

  const handleSaveTag = useCallback(async (tagData) => {
    if (tagData.id) {
      await updateTag(tagData.id, tagData);
    } else {
      await createTag(tagData);
    }
  }, [updateTag, createTag]);

  const handleDeleteTag = useCallback(async (id) => {
    await deleteTag(id);
  }, [deleteTag]);

  const handleSaveSettings = useCallback(async (newSettings) => {
    await updateSettings(newSettings);
  }, [updateSettings]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('警告：这将删除所有数据！确定要继续吗？')) {
      alert('数据清除功能暂时不可用！');
    }
  }, []);

  const renderAdminLayout = (content) => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header
            darkMode={darkMode}
            onDarkModeToggle={handleDarkModeToggle}
          />
          <div className="flex">
            <Sidebar
              activeMenu={activeMenu}
              onMenuChange={setActiveMenu}
            />
            <main className="flex-1 overflow-auto">
              {content}
            </main>
          </div>
        </div>
      </div>
    );
  };

  const renderPublicLayout = (content) => {
    // 加载并应用自定义CSS
    const customCSS = localStorage.getItem('happyhome_custom_css') || '';
    const customJS = localStorage.getItem('happyhome_custom_js') || '';
    const customHead = localStorage.getItem('happyhome_custom_head') || '';

    return (
      <div className={darkMode ? 'dark' : ''}>
        <PublicHeader />
        <main className="flex-1">
          {content}
        </main>
        <PublicFooter />
        {/* 自定义CSS */}
        {customCSS && <style id="custom-css">{customCSS}</style>}
        {/* 自定义Head代码 */}
        {customHead && <div dangerouslySetInnerHTML={{ __html: customHead }} />}
        {/* 自定义JS */}
        {customJS && <script dangerouslySetInnerHTML={{ __html: customJS }} />}
      </div>
    );
  };

  const AdminDashboard = () => renderAdminLayout(
    <Dashboard posts={posts} pages={pages} media={mediaItems} users={users} />
  );

  const AdminPosts = () => renderAdminLayout(
    <Posts
      posts={posts}
      onDelete={handleDeletePost}
    />
  );

  const AdminPostEditor = () => renderAdminLayout(<PostEditor onSave={handleSavePost} />);

  const AdminPages = () => renderAdminLayout(
    <Pages
      pages={pages}
      onDelete={handleDeletePage}
    />
  );

  const AdminPageEditor = () => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header
            darkMode={darkMode}
            onDarkModeToggle={handleDarkModeToggle}
          />
          <PageEditor onSave={handleSavePage} />
        </div>
      </div>
    );
  };

  const AdminMedia = () => renderAdminLayout(
    <Media
      media={mediaItems}
      onUpload={handleUploadMedia}
      onDelete={handleDeleteMedia}
    />
  );

  const AdminCategories = () => renderAdminLayout(
    <Categories
      categories={categories}
      onSave={handleSaveCategory}
      onDelete={handleDeleteCategory}
    />
  );

  const AdminTags = () => renderAdminLayout(
    <Tags
      tags={tags}
      onSave={handleSaveTag}
      onDelete={handleDeleteTag}
    />
  );

  const AdminUsers = () => renderAdminLayout(
    <Users
      users={users}
      onDelete={handleDeleteUser}
    />
  );

  const AdminUserEditor = () => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header
            darkMode={darkMode}
            onDarkModeToggle={handleDarkModeToggle}
          />
          <UserEditor onSave={handleSaveUser} />
        </div>
      </div>
    );
  };

  const AdminSettings = () => renderAdminLayout(<Settings />);
  const AdminHelp = () => renderAdminLayout(<Help />);
  const AdminAnalytics = () => renderAdminLayout(<Analytics />);
  const AdminMenus = () => renderAdminLayout(<Menus />);
  const AdminComments = () => renderAdminLayout(<Comments />);
  const AdminWidgets = () => renderAdminLayout(<Widgets />);
  const AdminRevisions = () => renderAdminLayout(<Revisions />);
  const AdminRoles = () => renderAdminLayout(<Roles />);

  const HomePage = () => renderPublicLayout(<PublicHome posts={posts} pages={pages} settings={settings} />);
  const PostsPage = () => renderPublicLayout(<PublicPosts posts={posts} />);
  const PostDetailPage = () => renderPublicLayout(<PublicPostDetail posts={posts} settings={settings} />);
  const PageDetailPage = () => renderPublicLayout(<PublicPageDetail pages={pages} />);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/page/:slug" element={<PageDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/posts" element={
          <PrivateRoute>
            <AdminPosts />
          </PrivateRoute>
        } />
        <Route path="/admin/posts/new" element={
          <PrivateRoute>
            <AdminPostEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/posts/:id/edit" element={
          <PrivateRoute>
            <AdminPostEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/pages" element={
          <PrivateRoute>
            <AdminPages />
          </PrivateRoute>
        } />
        <Route path="/admin/pages/new" element={
          <PrivateRoute>
            <AdminPageEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/pages/:id/edit" element={
          <PrivateRoute>
            <AdminPageEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/media" element={
          <PrivateRoute>
            <AdminMedia />
          </PrivateRoute>
        } />
        <Route path="/admin/categories" element={
          <PrivateRoute>
            <AdminCategories />
          </PrivateRoute>
        } />
        <Route path="/admin/tags" element={
          <PrivateRoute>
            <AdminTags />
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute>
            <AdminUsers />
          </PrivateRoute>
        } />
        <Route path="/admin/users/new" element={
          <PrivateRoute>
            <AdminUserEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/users/:id/edit" element={
          <PrivateRoute>
            <AdminUserEditor />
          </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute>
            <AdminSettings />
          </PrivateRoute>
        } />
        <Route path="/admin/help" element={
          <PrivateRoute>
            <AdminHelp />
          </PrivateRoute>
        } />
        <Route path="/admin/analytics" element={
          <PrivateRoute>
            <AdminAnalytics />
          </PrivateRoute>
        } />
        <Route path="/admin/menus" element={
          <PrivateRoute>
            <AdminMenus />
          </PrivateRoute>
        } />
        <Route path="/admin/comments" element={
          <PrivateRoute>
            <AdminComments />
          </PrivateRoute>
        } />
        <Route path="/admin/widgets" element={
          <PrivateRoute>
            <AdminWidgets />
          </PrivateRoute>
        } />
        <Route path="/admin/revisions" element={
          <PrivateRoute>
            <AdminRevisions />
          </PrivateRoute>
        } />
        <Route path="/admin/roles" element={
          <PrivateRoute>
            <AdminRoles />
          </PrivateRoute>
        } />
      </Routes>

      <TutorialSystem />
    </Router>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
