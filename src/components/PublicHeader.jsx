import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, Search, Menu, X, LogIn, ChevronDown, ExternalLink, FolderOpen, Tag, Link as LinkIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    // 从 localStorage 读取菜单数据
    try {
      const savedMenus = localStorage.getItem('happyhome_menus');
      if (savedMenus) {
        const menus = JSON.parse(savedMenus);
        const headerMenuData = menus.find(m => m.location === 'header');
        setHeaderMenu(headerMenuData);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  }, []);

  // 从菜单项过滤启用的项目
  const getEnabledItems = () => {
    if (!headerMenu || !headerMenu.items) return [];
    return headerMenu.items.filter(item => item.enabled).sort((a, b) => a.order - b.order);
  };

  const enabledItems = getEnabledItems();
  
  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/posts', label: '文章', icon: FileText },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HappyHome</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {enabledItems.length > 0 ? (
              enabledItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.url}
                  target={item.target}
                  className={`flex items-center gap-2 font-medium transition-colors ${
                    location.pathname === item.url 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.type === 'custom' && <LinkIcon className="w-4 h-4" />}
                  {item.type === 'post' && <FileText className="w-4 h-4" />}
                  {item.type === 'page' && <FileText className="w-4 h-4" />}
                  {item.type === 'category' && <FolderOpen className="w-4 h-4" />}
                  {item.type === 'tag' && <Tag className="w-4 h-4" />}
                  <span>{item.title}</span>
                  {item.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                </Link>
              ))
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 font-medium transition-colors ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">登录/注册</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-4">
            <nav className="flex flex-col gap-2 px-4">
              {enabledItems.length > 0 ? (
                enabledItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.url}
                    target={item.target}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                      location.pathname === item.url 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.type === 'custom' && <LinkIcon className="w-5 h-5" />}
                    {item.type === 'post' && <FileText className="w-5 h-5" />}
                    {item.type === 'page' && <FileText className="w-5 h-5" />}
                    {item.type === 'category' && <FolderOpen className="w-5 h-5" />}
                    {item.type === 'tag' && <Tag className="w-5 h-5" />}
                    <span>{item.title}</span>
                    {item.target === '_blank' && <ExternalLink className="w-4 h-4" />}
                  </Link>
                ))
              ) : (
                navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )}
              
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-500 text-white rounded-lg font-medium"
              >
                <LogIn className="w-5 h-5" />
                <span>登录/注册</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
