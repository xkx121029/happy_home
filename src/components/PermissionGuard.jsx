import { Shield, Lock } from 'lucide-react';
import { hasPermission } from '../utils/permissions';

export default function PermissionGuard({ permission, children, fallback = null }) {
  // 从 localStorage 获取当前用户
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!currentUser) {
    return fallback;
  }

  if (!hasPermission(currentUser, permission)) {
    if (fallback) return fallback;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          权限不足
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          您没有执行此操作的权限。请联系管理员获取相应权限。
        </p>
      </div>
    );
  }

  return children;
}
