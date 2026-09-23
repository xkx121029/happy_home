// 权限定义
export const permissions = {
  posts: {
    read: '阅读文章',
    create: '创建文章',
    edit: '编辑文章',
    delete: '删除文章',
    publish: '发布文章',
  },
  pages: {
    read: '阅读页面',
    create: '创建页面',
    edit: '编辑页面',
    delete: '删除页面',
  },
  comments: {
    read: '阅读评论',
    moderate: '审核评论',
    delete: '删除评论',
  },
  media: {
    read: '阅读媒体',
    upload: '上传媒体',
    delete: '删除媒体',
  },
  users: {
    read: '阅读用户',
    create: '创建用户',
    edit: '编辑用户',
    delete: '删除用户',
  },
  settings: {
    read: '阅读设置',
    edit: '修改设置',
  },
  appearance: {
    read: '阅读外观',
    edit: '修改外观',
  },
  tools: {
    read: '使用工具',
  },
};

// 角色默认权限
export const rolePermissions = {
  administrator: ['*'], // 所有权限
  editor: [
    'posts.*', 'pages.*', 'comments.*', 'media.*',
    '!users.*', '!settings.*', 'tools.*'
  ],
  author: [
    'posts.read', 'posts.create', 'posts.edit:own', 'posts.delete:own',
    'comments.read', 'media.upload'
  ],
  contributor: [
    'posts.read', 'posts.create', 'posts.edit:own',
    'comments.read'
  ],
  subscriber: [
    'posts.read', 'comments.read'
  ],
};

// 角色列表
export const roles = [
  {
    id: 'administrator',
    name: '管理员',
    description: '拥有所有权限',
    isSystem: true,
  },
  {
    id: 'editor',
    name: '编辑',
    description: '管理内容和媒体',
    isSystem: true,
  },
  {
    id: 'author',
    name: '作者',
    description: '可以创建和管理自己的文章',
    isSystem: true,
  },
  {
    id: 'contributor',
    name: '贡献者',
    description: '可以创建文章但不能发布',
    isSystem: true,
  },
  {
    id: 'subscriber',
    name: '订阅者',
    description: '可以阅读内容和评论',
    isSystem: true,
  },
];

// 获取所有权限列表
export function getAllPermissions() {
  const result = [];
  for (const [resource, actions] of Object.entries(permissions)) {
    for (const [action, label] of Object.entries(actions)) {
      result.push({
        key: `${resource}.${action}`,
        label,
        resource,
        action,
      });
    }
  }
  return result;
}

// 获取角色权限列表
export function getRolePermissionList(roleId) {
  const rolePerms = rolePermissions[roleId] || [];
  if (rolePerms.includes('*')) {
    return getAllPermissions().map(p => p.key);
  }

  const result = [];
  for (const perm of rolePerms) {
    if (perm.startsWith('!')) {
      continue; // 排除的权限
    }
    if (perm.endsWith('.*')) {
      const resource = perm.replace('.*', '');
      const resourcePerms = permissions[resource];
      if (resourcePerms) {
        for (const action of Object.keys(resourcePerms)) {
          result.push(`${resource}.${action}`);
        }
      }
    } else if (perm.includes(':')) {
      result.push(perm); // 如 posts.edit:own
    } else {
      result.push(perm);
    }
  }
  return result;
}

// 检查用户是否有指定权限
export function hasPermission(user, permission) {
  if (!user) return false;

  // 管理员拥有所有权限
  if (user.role === 'administrator') return true;

  // 如果用户有 * 权限
  const userPermissions = user.permissions || [];
  if (userPermissions.includes('*')) return true;

  // 检查用户权限列表
  if (userPermissions.includes(permission)) return true;

  // 检查角色默认权限
  const rolePerms = rolePermissions[user.role] || [];
  if (rolePerms.includes('*')) return true;

  // 解析权限字符串
  const [resource, action] = permission.split('.');
  const [, owner] = action.split(':');

  // 检查通配符权限
  if (rolePerms.includes(`${resource}.*`)) {
    // 如果权限要求是 :own，检查是否是作者本人
    if (owner === 'own') {
      // 需要结合具体资源判断，这里简化处理
      return true;
    }
    return true;
  }

  // 检查精确权限
  if (rolePerms.includes(permission)) {
    return true;
  }

  // 检查排除的权限
  if (rolePerms.includes(`!${permission}`)) {
    return false;
  }

  return false;
}

// 检查用户是否有指定角色
export function hasRole(user, role) {
  if (!user) return false;
  return user.role === role;
}

// 获取用户的所有权限
export function getUserPermissions(user) {
  if (!user) return [];

  // 如果是管理员，返回所有权限
  if (user.role === 'administrator') {
    return getAllPermissions().map(p => p.key);
  }

  const result = new Set();

  // 添加角色默认权限
  const rolePerms = rolePermissions[user.role] || [];
  for (const perm of rolePerms) {
    if (perm.startsWith('!')) continue;
    if (perm === '*') {
      getAllPermissions().forEach(p => result.add(p.key));
    } else if (perm.endsWith('.*')) {
      const resource = perm.replace('.*', '');
      const resourcePerms = permissions[resource];
      if (resourcePerms) {
        Object.keys(resourcePerms).forEach(a => result.add(`${resource}.${a}`));
      }
    } else {
      result.add(perm);
    }
  }

  // 添加用户自定义权限
  const customPerms = user.permissions || [];
  customPerms.forEach(p => result.add(p));

  return Array.from(result);
}

// 检查用户是否可以访问指定资源
export function canAccess(user, resource) {
  if (!user) return false;
  if (user.role === 'administrator') return true;
  return hasPermission(user, `${resource}.read`);
}

// 格式化权限列表（按资源分组）
export function getGroupedPermissions() {
  const grouped = {};
  for (const [resource, actions] of Object.entries(permissions)) {
    grouped[resource] = {
      label: getResourceLabel(resource),
      actions: Object.entries(actions).map(([action, label]) => ({
        key: `${resource}.${action}`,
        label,
      })),
    };
  }
  return grouped;
}

// 获取资源标签
export function getResourceLabel(resource) {
  const labels = {
    posts: '文章',
    pages: '页面',
    comments: '评论',
    media: '媒体',
    users: '用户',
    settings: '设置',
    appearance: '外观',
    tools: '工具',
  };
  return labels[resource] || resource;
}
