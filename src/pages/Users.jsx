import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Mail, Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';
import { usersAPI } from '../services/api';
import { toneChip } from '../lib/tones';

const roleOptions = [
  { id: 'administrator', label: '管理员', tone: 'danger' },
  { id: 'editor', label: '编辑', tone: 'accent' },
  { id: 'author', label: '作者', tone: 'success' },
  { id: 'contributor', label: '贡献者', tone: 'warning' },
  { id: 'subscriber', label: '订阅者', tone: 'info' },
];

const statusOptions = [
  { id: 'active', label: '活跃', tone: 'success' },
  { id: 'pending', label: '待审核', tone: 'warning' },
  { id: 'inactive', label: '已禁用', tone: 'neutral' },
];

export default function Users() {
  const { confirm, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  // 原来靠 props 拿 users 与各种回调，现在页面自取 Context
  const { users, loadAllData } = useData();
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full${toneChip(option.tone)}`}>
        {option.label}
      </span>
    ) : null;
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find((s) => s.id === status);
    return option ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full${toneChip(option.tone)}`}>
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
          <h1 className="text-2xl font-bold text-fg">用户管理</h1>
          <p className="text-muted mt-1">管理您网站的所有用户</p>
        </div>
        <button
          onClick={handleNewUser}
          className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建用户
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
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
              <tr className="bg-bg">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">邮箱</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted  uppercase tracking-wider">注册日期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted  uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-2">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/12  rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium text-fg">{user.username}</h3>
                        <p className="text-sm text-muted">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Mail className="w-4 h-4 text-muted" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted" />
                      {getRoleBadge(user.role)}
                    </div>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Calendar className="w-4 h-4 text-muted" />
                      {user.createdAt}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-muted hover:text-accent hover:bg-accent/12  rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-muted hover:text-danger hover:bg-danger/12  rounded-lg transition-colors"
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
            <User className="w-16 h-16 text-line mx-auto" />
            <p className="text-muted mt-4">没有找到匹配的用户</p>
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
