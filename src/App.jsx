import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

// Admin Components
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

// Public Components
import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';
import PublicHome from './pages/public/PublicHome';
import PublicPosts from './pages/public/PublicPosts';
import PublicPostDetail from './pages/public/PublicPostDetail';

// Data Store
import { postsAPI, pagesAPI, usersAPI, mediaAPI, settingsAPI, DataStore } from './utils/dataStore';
import TutorialSystem from './components/TutorialSystem';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据
  useEffect(() => {
    DataStore.initialize();
    loadData();
  }, []);

  // 加载所有数据
  const loadData = () => {
    setIsLoading(true);
    try {
      setPosts(postsAPI.getAll());
      setPages(pagesAPI.getAll());
      setUsers(usersAPI.getAll());
      setMedia(mediaAPI.getAll());
      setSettings(settingsAPI.get());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Posts handlers
  const handleSavePost = useCallback((postData) => {
    if (postData.id) {
      postsAPI.update(postData.id, postData);
    } else {
      postsAPI.create(postData);
    }
    setPosts(postsAPI.getAll());
    setEditingPost(null);
    setActiveEditor(null);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setActiveEditor('post');
  }, []);

  const handleDeletePost = useCallback((id) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      postsAPI.delete(id);
      setPosts(postsAPI.getAll());
    }
  }, []);

  const handleNewPost = useCallback(() => {
    setEditingPost(null);
    setActiveEditor('post');
  }, []);

  // Pages handlers
  const handleSavePage = useCallback((pageData) => {
    if (pageData.id) {
      pagesAPI.update(pageData.id, pageData);
    } else {
      pagesAPI.create(pageData);
    }
    setPages(pagesAPI.getAll());
    setEditingPage(null);
    setActiveEditor(null);
  }, []);

  const handleEditPage = useCallback((page) => {
    setEditingPage(page);
    setActiveEditor('page');
  }, []);

  const handleDeletePage = useCallback((id) => {
    if (window.confirm('确定要删除这个页面吗？')) {
      pagesAPI.delete(id);
      setPages(pagesAPI.getAll());
    }
  }, []);

  const handleNewPage = useCallback(() => {
    setEditingPage(null);
    setActiveEditor('page');
  }, []);

  // Users handlers
  const handleSaveUser = useCallback((userData) => {
    if (userData.id) {
      const result = usersAPI.update(userData.id, userData);
      if (!result.success) {
        alert(result.message);
        return;
      }
    } else {
      const result = usersAPI.create(userData);
      if (!result.success) {
        alert(result.message);
        return;
      }
    }
    setUsers(usersAPI.getAll());
    setEditingUser(null);
    setActiveEditor(null);
  }, []);

  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setActiveEditor('user');
  }, []);

  const handleDeleteUser = useCallback((id) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      const result = usersAPI.delete(id);
      if (!result.success) {
        alert(result.message);
        return;
      }
      setUsers(usersAPI.getAll());
    }
  }, []);

  const handleNewUser = useCallback(() => {
    setEditingUser(null);
    setActiveEditor('user');
  }, []);

  // Media handlers
  const handleUploadMedia = useCallback((file, url) => {
    mediaAPI.upload(file, url);
    setMedia(mediaAPI.getAll());
  }, []);

  const handleDeleteMedia = useCallback((id) => {
    if (window.confirm('确定要删除这个媒体文件吗？')) {
      mediaAPI.delete(id);
      setMedia(mediaAPI.getAll());
    }
  }, []);

  // Settings handlers
  const handleSaveSettings = useCallback((newSettings) => {
    const updated = settingsAPI.update(newSettings);
    setSettings(updated);
    alert('设置已保存！');
  }, []);

  // Dark mode toggle
  const handleDarkModeToggle = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Render Admin Layout
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

  // Render Public Layout
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

  // Admin Routes Components
  const AdminDashboard = () => renderAdminLayout(
    <Dashboard posts={posts} pages={pages} users={users} />
  );

  const AdminPosts = () => renderAdminLayout(
    <Posts
      posts={posts}
      onEdit={handleEditPost}
      onDelete={handleDeletePost}
      onNew={handleNewPost}
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
          <PostEditor
            onSave={handleSavePost}
            onCancel={() => {
              setEditingPost(null);
              setActiveEditor(null);
            }}
          />
        </div>
      </div>
    );
  };

  const AdminPages = () => renderAdminLayout(
    <Pages
      pages={pages}
      onEdit={handleEditPage}
      onDelete={handleDeletePage}
      onNew={handleNewPage}
    />
  );

  const AdminPageEditor = () => (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          darkMode={darkMode}
          onDarkModeToggle={handleDarkModeToggle}
        />
        <PageEditor
          page={editingPage}
          onSave={handleSavePage}
          onCancel={() => {
            setEditingPage(null);
            setActiveEditor(null);
          }}
        />
      </div>
    </div>
  );

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
      onEdit={handleEditUser}
      onDelete={handleDeleteUser}
      onNew={handleNewUser}
    />
  );

  const AdminUserEditor = () => (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          darkMode={darkMode}
          onDarkModeToggle={handleDarkModeToggle}
        />
        <UserEditor
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setEditingUser(null);
            setActiveEditor(null);
          }}
        />
      </div>
    </div>
  );

  const AdminSettings = () => renderAdminLayout(
    <Settings
      settings={settings}
      onSave={handleSaveSettings}
    />
  );

  const AdminHelp = () => renderAdminLayout(<Help />);

  const AdminAnalytics = () => renderAdminLayout(<Analytics />);

  // Public Routes Components
  const HomePage = () => renderPublicLayout(<PublicHome posts={posts} settings={settings} />);
  const PostsPage = () => renderPublicLayout(<PublicPosts posts={posts} />);
  const PostDetailPage = () => renderPublicLayout(<PublicPostDetail posts={posts} />);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
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

      {/* Tutorial System */}
      <TutorialSystem />
    </Router>
  );
}
