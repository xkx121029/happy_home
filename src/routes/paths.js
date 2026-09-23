/**
 * 路由路径的唯一真源。
 *
 * 侧边栏菜单、跳转、面包屑都引用这里，避免出现「页面改了路径但菜单还在指旧地址」
 * 这类问题 —— 项目里曾经有后台生成的链接指向 /post/xxx，而路由注册的是 /posts/:id，
 * 点「查看文章」必然 404。
 *
 * 注意：前台路径（/、/posts/:id、/page/:slug）不要随意改动 ——
 * 这些地址已经写进了数据库 menus.items 里，改了会让已有菜单链接失效。
 */

export const PUBLIC_PATHS = {
  home: '/',
  posts: '/posts',
  postDetail: (idOrSlug = ':id') => `/posts/${idOrSlug}`,
  pageDetail: (slug = ':slug') => `/page/${slug}`,
};

export const AUTH_PATHS = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  unauthorized: '/unauthorized',
};

export const ADMIN_PATHS = {
  root: '/admin',
  dashboard: '/admin',
  analytics: '/admin/analytics',

  posts: '/admin/posts',
  postNew: '/admin/posts/new',
  postEdit: (id = ':id') => `/admin/posts/${id}/edit`,
  revisions: '/admin/revisions',

  pages: '/admin/pages',
  pageNew: '/admin/pages/new',
  pageEdit: (id = ':id') => `/admin/pages/${id}/edit`,

  media: '/admin/media',
  comments: '/admin/comments',

  categories: '/admin/categories',
  tags: '/admin/tags',
  menus: '/admin/menus',
  widgets: '/admin/widgets',

  // 站点外观
  themes: '/admin/settings/appearance',
  seo: '/admin/settings/seo',
  customCss: '/admin/settings/custom-css',
  socialShare: '/admin/settings/social',

  // 系统
  users: '/admin/users',
  userNew: '/admin/users/new',
  userEdit: (id = ':id') => `/admin/users/${id}/edit`,
  roles: '/admin/roles',
  notifications: '/admin/notifications',
  backup: '/admin/system/backup',
  apiKeys: '/admin/system/api-keys',
  settings: '/admin/settings',

  help: '/admin/help',
};

/**
 * 后台导航分组。侧边栏结构与激活态都从这里派生，不再各写一份。
 *
 * `match` 用于判别激活：'exact' 只匹配完全相等（仪表盘），
 * 'prefix' 匹配自身及其子路径（/admin/posts 也要在 /admin/posts/new 时点亮）。
 */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'content',
    label: '内容',
    items: [
      { id: 'dashboard', label: '仪表盘', path: ADMIN_PATHS.dashboard, match: 'exact', icon: 'LayoutDashboard' },
      { id: 'posts', label: '文章', path: ADMIN_PATHS.posts, match: 'prefix', icon: 'FileText' },
      { id: 'revisions', label: '修订历史', path: ADMIN_PATHS.revisions, match: 'prefix', icon: 'History' },
      { id: 'pages', label: '页面', path: ADMIN_PATHS.pages, match: 'prefix', icon: 'FolderOpen' },
      { id: 'media', label: '媒体库', path: ADMIN_PATHS.media, match: 'prefix', icon: 'Image' },
      { id: 'comments', label: '评论', path: ADMIN_PATHS.comments, match: 'prefix', icon: 'MessageSquare' },
    ],
  },
  {
    id: 'structure',
    label: '结构',
    items: [
      { id: 'categories', label: '分类', path: ADMIN_PATHS.categories, match: 'prefix', icon: 'FolderTree' },
      { id: 'tags', label: '标签', path: ADMIN_PATHS.tags, match: 'prefix', icon: 'Tag' },
      { id: 'menus', label: '菜单', path: ADMIN_PATHS.menus, match: 'prefix', icon: 'Menu' },
      { id: 'widgets', label: '小工具', path: ADMIN_PATHS.widgets, match: 'prefix', icon: 'Layout' },
    ],
  },
  {
    id: 'appearance',
    label: '外观',
    items: [
      { id: 'themes', label: '主题', path: ADMIN_PATHS.themes, match: 'prefix', icon: 'Palette' },
      { id: 'seo', label: 'SEO', path: ADMIN_PATHS.seo, match: 'prefix', icon: 'Search' },
      { id: 'customCss', label: '自定义 CSS', path: ADMIN_PATHS.customCss, match: 'prefix', icon: 'Code' },
      { id: 'socialShare', label: '社交分享', path: ADMIN_PATHS.socialShare, match: 'prefix', icon: 'Share2' },
    ],
  },
  {
    id: 'system',
    label: '系统',
    items: [
      { id: 'notifications', label: '通知', path: ADMIN_PATHS.notifications, match: 'prefix', icon: 'Bell' },
      { id: 'users', label: '用户', path: ADMIN_PATHS.users, match: 'prefix', icon: 'Users' },
      { id: 'roles', label: '角色管理', path: ADMIN_PATHS.roles, match: 'prefix', icon: 'Shield' },
      { id: 'apiKeys', label: 'API 密钥', path: ADMIN_PATHS.apiKeys, match: 'prefix', icon: 'KeyRound' },
      { id: 'backup', label: '备份', path: ADMIN_PATHS.backup, match: 'prefix', icon: 'Database' },
      { id: 'settings', label: '设置', path: ADMIN_PATHS.settings, match: 'prefix', icon: 'Settings', excludePrefixes: [ADMIN_PATHS.themes, ADMIN_PATHS.seo, ADMIN_PATHS.customCss, ADMIN_PATHS.socialShare] },
      { id: 'analytics', label: '数据分析', path: ADMIN_PATHS.analytics, match: 'prefix', icon: 'BarChart3' },
    ],
  },
];

export const ADMIN_FOOTER_ITEMS = [
  { id: 'public', label: '访问前台', path: PUBLIC_PATHS.home, match: 'none', icon: 'Globe', external: true },
  { id: 'help', label: '帮助', path: ADMIN_PATHS.help, match: 'prefix', icon: 'HelpCircle' },
];

/**
 * 判断某个导航项在当前路径下是否应处于激活态。
 */
export function isNavItemActive(item, pathname) {
  if (item.match === 'none') return false;
  if (item.match === 'exact') return pathname === item.path;

  if (item.excludePrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}