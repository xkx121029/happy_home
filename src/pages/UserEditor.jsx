import { useState, useMemo } from 'react';
import { ArrowLeft, Save, User, Mail, Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { usersAPI } from '../services/api';

const roleOptions = [
  { id: 'administrator', label: '管理员', color: 'bg-red-100 text-red-700' },
  { id: 'editor', label: '编辑', color: 'bg-blue-100 text-blue-700' },
  { id: 'author', label: '作者', color: 'bg-green-100 text-green-700' },
  { id: 'contributor', label: '贡献者', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'subscriber', label: '订阅者', color: 'bg-purple-100 text-purple-700' },
];

const statusOptions = [
  { id: 'active', label: '活跃', color: 'bg-green-100 text-green-700' },
  { id: 'pending', label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'inactive', label: '已禁用', color: 'bg-gray-100 text-gray-700' },
];

export default function UserEditor() {
  const { id } = useParams();
  // 原来靠 props 拿到待编辑用户与保存/取消回调，现在页面自取 Context
  const { users, loadAllData } = useData();
  const user = id ? users.find(u => u.id === id) : null;
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'author');
  const [status, setStatus] = useState(user?.status || 'active');
  const navigate = useNavigate();

  // 使用useMemo缓存当前日期，避免每次渲染都重新计算
  const currentDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleSave = async () => {
    const userData = {
      id: user?.id || Date.now(),
      username,
      email,
      role,
      status,
      createdAt: user?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    // 只有输入了新密码时才添加密码字段
    if (password) {
      userData.password = password;
    }
    // 原来保存走 props.onSave 回调，现在页面自取 Context 的用户接口
    try {
      if (user) {
        await usersAPI.update(user.id, userData);
      } else {
        await usersAPI.create(userData);
      }
      await loadAllData();
      navigate('/admin/users');
    } catch (err) {
      console.error('保存用户失败:', err);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user ? '编辑用户' : '新建用户'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">管理网站用户账户</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{username || '新用户'}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{email || '请输入邮箱'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {user && (
                <p className="text-xs text-gray-400 mt-2">留空则保持当前密码不变</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRole(option.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                      role === option.id
                        ? `${option.color} border-blue-500`
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">状态</label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setStatus(option.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                      status === option.id
                        ? `${option.color} border-blue-500`
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="md:col-span-2 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">创建时间:</span>
                    <div>{user.createdAt}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">更新时间:</span>
                    <div>{currentDate}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
