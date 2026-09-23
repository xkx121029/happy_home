import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FolderOpen, Image, Palette, Users, BarChart3,
  Settings, HelpCircle, Globe, Tag, FolderTree, Menu as MenuIcon, Search,
  MessageSquare, Layout, Database, Share2, Code, History, Shield, Bell,
} from 'lucide-react';
import { ADMIN_FOOTER_ITEMS, ADMIN_NAV_GROUPS, isNavItemActive } from '../routes/paths';

// 图标按名字查表，让路由配置（routes/paths.js）保持纯数据、不引入 JSX
const ICONS = {
  LayoutDashboard, FileText, FolderOpen, Image, Palette, Users, BarChart3,
  Settings, HelpCircle, Globe, Tag, FolderTree, Menu: MenuIcon, Search,
  MessageSquare, Layout, Database, Share2, Code, History, Shield, Bell,
};

/**
 * 后台侧边栏。
 *
 * 两处改动：
 * 1. 从 13+3 项的扁平列表改为五组（内容 / 结构 / 外观 / 系统），
 *    四个此前没有入口的外观页与通知、备份页现在都有地方进。
 * 2. 激活态改为从 location.pathname 派生。
 *    原来靠一个 activeMenu 的 state 镜像当前路由，并且只在点击时才更新 ——
 *    直接输入 URL、浏览器前进后退、刷新都会让菜单高亮错位。
 *    「用 state 镜像 URL」这个做法本身就是问题的根源，直接去掉这个 state。
 */
export default function Sidebar() {
  const { pathname } = useLocation();

  const renderLink = (item) => {
    const Icon = ICONS[item.icon];
    const active = isNavItemActive(item, pathname);

    return (
      <li key={item.id}>
        <NavLink
          to={item.path}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-100${
            active
              ? 'bg-accent-50 text-accent'
              : 'text-muted hover:bg-surface-2 hover:text-fg'
          }`}
        >
          {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
          <span className="truncate">{item.label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-5">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 mb-1.5 text-xs font-medium text-muted tracking-wide">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(renderLink)}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line space-y-0.5">
        <ul className="space-y-0.5">
          {ADMIN_FOOTER_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isNavItemActive(item, pathname);
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-100${
                    active ? 'bg-accent-50 text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg'
                  }`}
                >
                  {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}