import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Mail, Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';

const roleOptions = [
  { id: 'administrator', label: '管理员', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  { id: 'editor', label: '编辑', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { id: 'author', label: '作者', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
  { id: 'contributor', label: '贡献者', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
  { id: 'subscriber', label: '订阅者', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
];

const statusOptions = [
  { id: 'active', label: '活跃', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
  { id: 'pending', label: '待审核', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
  { id: 'inactive', label: '已禁用', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
];

export default function Users() {
  const { confirm, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  // 原来靠 props 拿 users 与各种回调，现在页面自取 Context
  const { users, usersAPI, loadAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const navigate = useNavigate();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const option = roleOptions.find((r) => r.id === role);
    return option ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${option.color}`}>
        {option.label}
      </span>
    ) : null;
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find((s) => s.id === status);
    return option ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${option.color}`}>
        {option.label}
      </span>
    ) : null;
  };

  const handleEditUser = (user) => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const handleNewUser = () => {
    navigate('/admin/users/new');
  };

  // 原来删除走 props.onDelete 回调，现在页面自取 Context 的用户接口
  const handleDelete = async (user) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除用户「${user.username}」吗？`,
    });
    if (!confirmed) return;
    try {
      await usersAPI.delete(user.id);
      await loadAllData();
    } catch (err) {
      console.error('删除用户失败:', err);
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理您网站的所有用户</p>
        </div>
        <button
          onClick={handleNewUser}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建用户
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">所有角色</option>
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">邮箱</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">注册日期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{user.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      {getRoleBadge(user.role)}
                    </div>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {user.createdAt}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">没有找到匹配的用户</p>
          </div>
        )}
      </div>
    </div>

    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={modalConfig.title}
      message={modalConfig.message}
      type={modalConfig.type}
      confirmText={modalConfig.confirmText}
      cancelText={modalConfig.cancelText}
      onConfirm={modalConfig.onConfirm}
      showCancel={modalConfig.showCancel}
    />
    </>
  );
}
