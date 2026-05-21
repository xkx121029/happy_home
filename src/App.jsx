import { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import Pages from './pages/Pages';
import PageEditor from './pages/PageEditor';
import Media from './pages/Media';
import Themes from './pages/Themes';
import Users from './pages/Users';
import UserEditor from './pages/UserEditor';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';
import PublicHome from './pages/public/PublicHome';
import PublicPosts from './pages/public/PublicPosts';
import PublicPostDetail from './pages/public/PublicPostDetail';

import TutorialSystem from './components/TutorialSystem';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const { posts, pages, users, media, settings, postsAPI, pagesAPI, usersAPI, mediaAPI, settingsAPI, clearAllData } = useData();

  const handleDarkModeToggle = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  const handleSavePost = useCallback((postData) => {
    if (postData.id) {
      postsAPI.update(postData.id, postData);
    } else {
      postsAPI.create(postData);
    }
  }, [postsAPI]);

  const handleDeletePost = useCallback((id) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      postsAPI.delete(id);
    }
  }, [postsAPI]);

  const handleSavePage = useCallback((pageData) => {
    if (pageData.id) {
      pagesAPI.update(pageData.id, pageData);
    } else {
      pagesAPI.create(pageData);
    }
  }, [pagesAPI]);

  const handleDeletePage = useCallback((id) => {
    if (window.confirm('确定要删除这个页面吗？')) {
      pagesAPI.delete(id);
    }
  }, [pagesAPI]);

  const handleSaveUser = useCallback((userData) => {
    if (userData.id) {
      usersAPI.update(userData.id, userData);
    } else {
      usersAPI.create(userData);
    }
  }, [usersAPI]);

  const handleDeleteUser = useCallback((id) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      usersAPI.delete(id);
    }
  }, [usersAPI]);

  const handleUploadMedia = useCallback((file, url) => {
    mediaAPI.upload(file, url);
  }, [mediaAPI]);

  const handleDeleteMedia = useCallback((id) => {
    if (window.confirm('确定要删除这个媒体文件吗？')) {
      mediaAPI.delete(id);
    }
  }, [mediaAPI]);

  const handleSaveSettings = useCallback((newSettings) => {
    settingsAPI.update(newSettings);
    alert('设置已保存！');
  }, [settingsAPI]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('警告：这将删除所有数据！确定要继续吗？')) {
      clearAllData();
      alert('数据已清除！');
    }
  }, [clearAllData]);

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
    return (
      <div className={darkMode ? 'dark' : ''}>
        <PublicHeader />
        <main className="flex-1">
          {content}
        </main>
        <PublicFooter />
      </div>
    );
  };

  const AdminDashboard = () => renderAdminLayout(
    <Dashboard posts={posts} pages={pages} users={users} />
  );

  const AdminPosts = () => renderAdminLayout(
    <Posts
      posts={posts}
      onDelete={handleDeletePost}
    />
  );

  const AdminPostEditor = () => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header
            darkMode={darkMode}
            onDarkModeToggle={handleDarkModeToggle}
          />
          <PostEditor onSave={handleSavePost} />
        </div>
      </div>
    );
  };

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
      media={media}
      onUpload={handleUploadMedia}
      onDelete={handleDeleteMedia}
    />
  );

  const AdminThemes = () => renderAdminLayout(
    <Themes settings={settings} onSave={handleSaveSettings} />
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

  const AdminSettings = () => renderAdminLayout(
    <Settings
      settings={settings}
      onSave={handleSaveSettings}
      onClearData={handleClearAllData}
    />
  );

  const AdminHelp = () => renderAdminLayout(<Help />);
  const AdminAnalytics = () => renderAdminLayout(<Analytics />);

  const HomePage = () => renderPublicLayout(<PublicHome posts={posts} settings={settings} />);
  const PostsPage = () => renderPublicLayout(<PublicPosts posts={posts} />);
  const PostDetailPage = () => renderPublicLayout(<PublicPostDetail posts={posts} />);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/posts/new" element={<AdminPostEditor />} />
        <Route path="/admin/posts/:id/edit" element={<AdminPostEditor />} />
        <Route path="/admin/pages" element={<AdminPages />} />
        <Route path="/admin/pages/new" element={<AdminPageEditor />} />
        <Route path="/admin/pages/:id/edit" element={<AdminPageEditor />} />
        <Route path="/admin/media" element={<AdminMedia />} />
        <Route path="/admin/themes" element={<AdminThemes />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/new" element={<AdminUserEditor />} />
        <Route path="/admin/users/:id/edit" element={<AdminUserEditor />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/help" element={<AdminHelp />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
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
