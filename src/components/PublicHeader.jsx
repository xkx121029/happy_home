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
    <header className="bg-surface shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-fg font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-fg">HappyHome</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {enabledItems.length > 0 ? (
              enabledItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.url}
                  target={item.target}
                  className={`flex items-center gap-2 font-medium transition-colors${
                    location.pathname === item.url 
                      ? 'text-accent' 
                      : 'text-muted  hover:text-fg'
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
                    className={`flex items-center gap-2 font-medium transition-colors${
                      isActive 
                        ? 'text-accent' 
                        : 'text-muted  hover:text-fg'
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
              className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">登录/注册</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted hover:text-fg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-t border-line py-4">
            <nav className="flex flex-col gap-2 px-4">
              {enabledItems.length > 0 ? (
                enabledItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.url}
                    target={item.target}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors${
                      location.pathname === item.url 
                        ? 'bg-accent/12  text-accent' 
                        : 'text-muted  hover:bg-surface-2'
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors${
                        isActive 
                          ? 'bg-accent/12  text-accent' 
                          : 'text-muted  hover:bg-surface-2'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )}
              
              <hr className="my-2 border-line" />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-accent text-accent-fg rounded-lg font-medium"
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
