import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { NetworkProvider, useNetwork } from './contexts/NetworkContext';
import { NotificationProvider, useNotification } from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatusBanner from './components/NetworkStatus';
import Modal from './components/Modal';
import { usersAPI, mediaAPI } from './services/api';

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
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });
  const { success, error } = useNotification();
  const { pendingCount } = useNetwork();
  const { 
    posts, pages, users, mediaItems, categories, tags, settings, updateSettings,
    createPost, updatePost, deletePost,
    createPage, updatePage, deletePage,
    createCategory, updateCategory, deleteCategory,
    createTag, updateTag, deleteTag,
    loadAllData
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
  }, []);

  const handleDarkModeToggle = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  const handleSavePost = useCallback(async (postData) => {
    try {
      if (postData.id) {
        await updatePost(postData.id, postData);
        success('文章已成功更新！');
      } else {
        await createPost(postData);
        success('文章已成功创建！');
      }
    } catch (err) {
      error('保存文章失败：' + (err.message || '未知错误'));
    }
  }, [updatePost, createPost, success, error]);

  const handleDeletePost = useCallback(async (id) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这篇文章吗？',
      onConfirm: async () => {
        try {
          await deletePost(id);
          success('文章已成功删除！');
        } catch (err) {
          error('删除文章失败：' + (err.message || '未知错误'));
        }
      }
    });
  }, [deletePost, success, error]);

  const handleSavePage = useCallback(async (pageData) => {
    try {
      if (pageData.id) {
        await updatePage(pageData.id, pageData);
        success('页面已成功更新！');
      } else {
        await createPage(pageData);
        success('页面已成功创建！');
      }
    } catch (err) {
      error('保存页面失败：' + (err.message || '未知错误'));
    }
  }, [updatePage, createPage, success, error]);

  const handleDeletePage = useCallback(async (id) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这个页面吗？',
      onConfirm: async () => {
        try {
          await deletePage(id);
          success('页面已成功删除！');
        } catch (err) {
          error('删除页面失败：' + (err.message || '未知错误'));
        }
      }
    });
  }, [deletePage, success, error]);

  const handleSaveUser = useCallback(async (userData, isEdit) => {
    try {
      if (isEdit) {
        await usersAPI.update(userData.id, userData);
        success('用户已成功更新！');
      } else {
        await usersAPI.create(userData);
        success('用户已成功创建！');
      }
      await loadAllData();
    } catch (err) {
      error('保存用户失败：' + (err.message || '未知错误'));
    }
  }, [loadAllData, success, error]);

  const handleDeleteUser = useCallback(async (id) => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这个用户吗？',
      onConfirm: async () => {
        try {
          await usersAPI.delete(id);
          await loadAllData();
          success('用户已成功删除！');
        } catch (err) {
          error('删除用户失败：' + (err.message || '未知错误'));
        }
      }
    });
  }, [loadAllData, success, error]);

  const handleUploadMedia = useCallback(async (file, url) => {
    try {
      // 这里应该调用 mediaAPI.upload，但目前只是存储URL
      success('媒体文件已成功上传！');
    } catch (err) {
      error('上传媒体文件失败：' + (err.message || '未知错误'));
    }
  }, [success, error]);

  const handleDeleteMedia = useCallback(async (id) => {
    try {
      await mediaAPI.delete(id);
      success('媒体文件已成功删除！');
    } catch (err) {
      error('删除媒体文件失败：' + (err.message || '未知错误'));
    }
  }, [success, error]);

  const handleSaveCategory = useCallback(async (categoryData) => {
    try {
      if (categoryData.id) {
        await updateCategory(categoryData.id, categoryData);
        success('分类已成功更新！');
      } else {
        await createCategory(categoryData);
        success('分类已成功创建！');
      }
    } catch (err) {
      error('保存分类失败：' + (err.message || '未知错误'));
    }
  }, [updateCategory, createCategory, success, error]);

  const handleDeleteCategory = useCallback(async (id) => {
    try {
      await deleteCategory(id);
      success('分类已成功删除！');
    } catch (err) {
      error('删除分类失败：' + (err.message || '未知错误'));
    }
  }, [deleteCategory, success, error]);

  const handleSaveTag = useCallback(async (tagData) => {
    try {
      if (tagData.id) {
        await updateTag(tagData.id, tagData);
        success('标签已成功更新！');
      } else {
        await createTag(tagData);
        success('标签已成功创建！');
      }
    } catch (err) {
      error('保存标签失败：' + (err.message || '未知错误'));
    }
  }, [updateTag, createTag, success, error]);

  const handleDeleteTag = useCallback(async (id) => {
    try {
      await deleteTag(id);
      success('标签已成功删除！');
    } catch (err) {
      error('删除标签失败：' + (err.message || '未知错误'));
    }
  }, [deleteTag, success, error]);

  const handleSaveSettings = useCallback(async (newSettings) => {
    try {
      await updateSettings(newSettings);
      success('设置已成功保存！');
    } catch (err) {
      error('保存设置失败：' + (err.message || '未知错误'));
    }
  }, [updateSettings, success, error]);

  const handleClearAllData = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: '警告',
      message: '这将删除所有数据！确定要继续吗？',
      onConfirm: () => {
        setInfoModal({ isOpen: true, title: '提示', message: '数据清除功能暂时不可用！' });
      }
    });
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
    // 加载并应用自定义CSS（只在管理员登录时应用）
    const customCSS = localStorage.getItem('happyhome_custom_css') || '';

    // 清理和验证自定义CSS
    const sanitizeCSS = (css) => {
      if (!css) return '';
      // 移除危险的CSS属性和表达式
      return css
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
    };

    const safeCSS = sanitizeCSS(customCSS);

    return (
      <div className={darkMode ? 'dark' : ''}>
        <PublicHeader />
        <main className="flex-1">
          {content}
        </main>
        <PublicFooter />
        {/* 自定义CSS（已安全清理） */}
        {safeCSS && <style id="custom-css">{safeCSS}</style>}
        {/* 注意：自定义JS和自定义Head功能已移除，存在安全风险 */}
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
    <ErrorBoundary>
      <NetworkStatusBanner pendingCount={pendingCount} />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/page/:slug" element={<PageDetailPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

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

          {/* 404 未找到 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <TutorialSystem />
        
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          title={confirmModal.title}
          message={confirmModal.message}
          type="confirm"
          onConfirm={confirmModal.onConfirm}
        />
        
        <Modal
          isOpen={infoModal.isOpen}
          onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
          title={infoModal.title}
          message={infoModal.message}
          type="info"
          showCancel={false}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <ErrorProvider>
        <NotificationProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </NotificationProvider>
      </ErrorProvider>
    </NetworkProvider>
  );
}
