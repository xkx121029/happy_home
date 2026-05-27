import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, FolderOpen, Image, Palette, Users, BarChart3, 
  Settings, HelpCircle, Globe, Tag, FolderTree, Menu as MenuIcon, Search, 
  MessageSquare, Layout, Database, Share2, Code, History, Shield, Bell,
  ChevronDown, ChevronRight, Sliders
} from 'lucide-react';

export default function Sidebar({ activeMenu, onMenuChange }) {
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘', path: '/admin' },
    { id: 'posts', icon: FileText, label: '文章', path: '/admin/posts' },
    { id: 'revisions', icon: History, label: '修订历史', path: '/admin/revisions' },
    { id: 'categories', icon: FolderTree, label: '分类', path: '/admin/categories' },
    { id: 'tags', icon: Tag, label: '标签', path: '/admin/tags' },
    { id: 'pages', icon: FolderOpen, label: '页面', path: '/admin/pages' },
    { id: 'media', icon: Image, label: '媒体库', path: '/admin/media' },
    { id: 'comments', icon: MessageSquare, label: '评论', path: '/admin/comments' },
    { id: 'menus', icon: MenuIcon, label: '菜单', path: '/admin/menus' },
    { id: 'widgets', icon: Layout, label: '小工具', path: '/admin/widgets' },
    { id: 'users', icon: Users, label: '用户', path: '/admin/users' },
    { id: 'roles', icon: Shield, label: '角色管理', path: '/admin/roles' },
    { id: 'settings', icon: Settings, label: '设置', path: '/admin/settings' },
  ];

  const bottomItems = [
    { id: 'public', icon: Globe, label: '访问前台', path: '/' },
    { id: 'analytics', icon: BarChart3, label: '数据分析', path: '/admin/analytics' },
    { id: 'help', icon: HelpCircle, label: '帮助', path: '/admin/help' },
  ];

  const isActive = (path, id) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path) || activeMenu === id;
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col">
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.id);
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => onMenuChange(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.id);
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => item.id !== 'help' && onMenuChange(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}