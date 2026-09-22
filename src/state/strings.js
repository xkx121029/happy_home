/**
 * 状态与枚举的中文文案 —— 唯一真源。
 *
 * 原来同一个后端状态在不同页面里的文案与配色都不一样，
 * 例如「已发布」在文章列表是绿色、在别处又是蓝色，
 * 而且有的地方直接把英文状态码渲染到界面上。
 *
 * tone 对应 components/ui/StatusBadge.jsx 的色调。
 */

export const POST_STATUS = {
  published: { label: '已发布', tone: 'success' },
  draft: { label: '草稿', tone: 'warning' },
  future: { label: '定时发布', tone: 'info' },
  private: { label: '私密', tone: 'neutral' },
};

export const PAGE_STATUS = {
  published: { label: '已发布', tone: 'success' },
  draft: { label: '草稿', tone: 'warning' },
};

export const COMMENT_STATUS = {
  approved: { label: '已通过', tone: 'success' },
  pending: { label: '待审核', tone: 'warning' },
  spam: { label: '垃圾评论', tone: 'danger' },
};

export const USER_STATUS = {
  active: { label: '正常', tone: 'success' },
  inactive: { label: '已停用', tone: 'neutral' },
  pending: { label: '待验证', tone: 'warning' },
};

export const USER_ROLE = {
  administrator: { label: '管理员', tone: 'accent' },
  editor: { label: '编辑', tone: 'info' },
  author: { label: '作者', tone: 'neutral' },
};

export const WIDGET_LOCATION = {
  sidebar: '侧边栏',
  footer: '页脚',
  header: '页头',
};

export const MENU_LOCATION = {
  header: '页头',
  footer: '页脚',
  primary: '主导航',
  sidebar: '侧边栏',
};

export const BACKUP_TYPE = {
  manual: { label: '手动备份', tone: 'accent' },
  auto: { label: '自动备份', tone: 'neutral' },
};

/**
 * 查表并兜底：未知状态直接显示原始值，而不是空白。
 * 显式暴露「有个没覆盖到的状态」比悄悄显示空更有用。
 */
export function lookupStatus(dict, value) {
  return dict[value] || { label: value || '未知', tone: 'neutral' };
}