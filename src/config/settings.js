import {
  Database,
  FileText,
  Mail,
  MessageSquare,
  Server,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react';

/**
 * 站点设置的唯一真源。
 *
 * 原来设置有两份清单：Settings.jsx 里的 `settingCategories`（表单控件）和
 * utils/allowedSettings.js 里的 `ALLOWED_SETTING_KEYS`（保存白名单）。
 * 两者手工维护、各写一遍，于是必然漂移 —— `postUrlType` 有表单、白名单里没有，
 * 保存时被 `filterSettings` 静默丢弃，用户以为设过了，实际从来没存进去。
 *
 * 现在白名单由表单定义派生，不可能再不一致。
 *
 * 同时这里只保留**真的有消费者**的键。此前 66 个白名单键里只有约 12 个被代码读取，
 * 其余五十多个是「能保存、能刷新、什么都不发生」的假设置。假设置比没有设置更糟：
 * 用户会花时间去调它，然后以为是自己没配对。
 */

/** 有表单控件的标签页。 */
export const SETTINGS_TABS = [
  {
    id: 'general',
    label: '常规',
    icon: SettingsIcon,
    description: '站点标识、地址与时区',
    fields: [
      { key: 'siteName', label: '网站名称', type: 'text', placeholder: '我的网站', hint: '用于浏览器标题与页头' },
      { key: 'siteDescription', label: '网站描述', type: 'textarea', placeholder: '一句话介绍这个站点' },
      { key: 'siteUrl', label: '网站地址', type: 'url', placeholder: 'https://example.com', hint: '订阅源、分享链接与 sitemap 都用它拼绝对地址' },
      {
        key: 'timezone',
        label: '时区',
        type: 'select',
        hint: '定时发布按此时区判断是否到点',
        options: [
          { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
          { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
          { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
          { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
        ],
      },
    ],
  },

  {
    id: 'content',
    label: '内容',
    icon: FileText,
    description: '文章的列表、链接与修订规则',
    fields: [
      { key: 'postsPerPage', label: '每页文章数', type: 'number', min: 1, max: 100, defaultValue: 10 },
      { key: 'excerptLength', label: '摘要长度', type: 'number', min: 40, max: 500, defaultValue: 150, hint: '文章未手写摘要时按此长度从正文截取' },
      // 这里原本还有两项，接不上所以删掉了，而不是留着当摆设：
      //   postUrlType    —— posts 表没有 slug 列，两个分支都只会产出 /posts/{id}，
      //                     要让它生效得先加 slug 列、迁移、改公开端点的查询方式。
      //   defaultPostStatus —— 编辑器上是「保存草稿」和「发布」两个显式按钮，
      //                     用户每次都自己选，没有「默认状态」这个位置可插。
      { key: 'enableRevisions', label: '记录文章修订', type: 'toggle', defaultValue: true, hint: '保存文章时自动留一份快照，可对比与回滚' },
      { key: 'revisionLimit', label: '每篇保留修订数', type: 'number', min: 1, max: 100, defaultValue: 25 },
    ],
  },

  {
    id: 'users',
    label: '用户',
    icon: User,
    description: '注册开关与新用户默认权限',
    fields: [
      { key: 'registrationEnabled', label: '开放注册', type: 'toggle', defaultValue: false, hint: '关闭后注册接口直接拒绝，前台注册页也不可用' },
      {
        key: 'defaultRole',
        label: '新用户默认角色',
        type: 'select',
        defaultValue: 'author',
        options: [
          { value: 'subscriber', label: '订阅者' },
          { value: 'author', label: '作者' },
          { value: 'editor', label: '编辑' },
        ],
      },
      { key: 'emailVerification', label: '注册需要邮箱验证码', type: 'toggle', defaultValue: true, hint: '关闭后注册不再校验邮箱验证码（需已配置 SMTP 才能开启）' },
    ],
  },

  {
    id: 'security',
    label: '安全',
    icon: Shield,
    description: '登录限流与会话时长',
    fields: [
      {
        key: 'loginLimit',
        label: '登录尝试限制',
        type: 'select',
        defaultValue: '10',
        hint: '同一来源在 10 分钟内允许的失败次数',
        options: [
          { value: '0', label: '不限制' },
          { value: '5', label: '5 次' },
          { value: '10', label: '10 次' },
          { value: '20', label: '20 次' },
        ],
      },
      {
        key: 'sessionTimeout',
        label: '登录有效期',
        type: 'select',
        defaultValue: '7d',
        hint: '签发的令牌多久过期，改后需重新登录才生效',
        options: [
          { value: '1h', label: '1 小时' },
          { value: '6h', label: '6 小时' },
          { value: '24h', label: '24 小时' },
          { value: '7d', label: '7 天' },
          { value: '30d', label: '30 天' },
        ],
      },
    ],
  },

  {
    id: 'comments',
    label: '评论',
    icon: MessageSquare,
    description: '是否开放评论与审核策略',
    fields: [
      { key: 'enableComments', label: '启用评论', type: 'toggle', defaultValue: true, hint: '关闭后前台不再显示评论区，提交接口也会拒绝' },
      { key: 'commentsModeration', label: '评论需要审核', type: 'toggle', defaultValue: true, hint: '关闭后访客评论直接公开显示' },
    ],
  },

  {
    id: 'email',
    label: '邮件',
    icon: Mail,
    description: 'SMTP 发信配置',
    fields: [
      { key: 'smtpHost', label: 'SMTP 主机', type: 'text', placeholder: 'smtp.example.com' },
      {
        key: 'smtpPort',
        label: 'SMTP 端口',
        type: 'select',
        defaultValue: '587',
        options: [
          { value: '25', label: '25' },
          { value: '465', label: '465 (SSL)' },
          { value: '587', label: '587 (STARTTLS，推荐)' },
        ],
      },
      { key: 'smtpUser', label: 'SMTP 用户名', type: 'text', placeholder: 'user@example.com' },
      { key: 'smtpPass', label: 'SMTP 密码', type: 'password', placeholder: '输入密码' },
      { key: 'smtpSecure', label: '启用 SSL/TLS', type: 'toggle', defaultValue: false },
      { key: 'smtpFrom', label: '发件人地址', type: 'email', placeholder: 'no-reply@yourdomain.com' },
    ],
  },
];

/** 有独立界面、不走字段渲染的标签页。 */
export const CUSTOM_TABS = [
  { id: 'backup', label: '备份恢复', icon: Database, description: '数据库导出与恢复' },
  { id: 'logs', label: '日志中心', icon: Server, description: '操作记录' },
];

/** 由表单定义派生的可写键白名单。 */
export const ALLOWED_SETTING_KEYS = [
  ...new Set(SETTINGS_TABS.flatMap((tab) => tab.fields.map((field) => field.key))),
];

/** 由字段定义派生的默认值。重置设置时写回这一份，而不是清空 localStorage。 */
export const SETTINGS_DEFAULTS = SETTINGS_TABS.reduce((acc, tab) => {
  for (const field of tab.fields) {
    if (field.defaultValue !== undefined) acc[field.key] = field.defaultValue;
  }
  return acc;
}, {});

/** 只保留白名单内的键，避免把表单里的临时字段（如搜索结果）写进数据库。 */
export function filterSettings(settings) {
  const filtered = {};
  for (const key of ALLOWED_SETTING_KEYS) {
    if (settings && settings[key] !== undefined) {
      filtered[key] = settings[key];
    }
  }
  return filtered;
}

export default ALLOWED_SETTING_KEYS;
