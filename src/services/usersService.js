import { useCallback } from 'react';

// 简单的密码验证（明文比较，用于演示目的）
const hashPassword = (password) => password;
const verifyPassword = (inputPassword, storedPassword) => inputPassword === storedPassword;

export const createUsersService = (setUsers, users, saveToStorage) => {
  const getAll = useCallback(() => users, [users]);

  const getById = useCallback((id) => users.find(u => u.id === id), [users]);

  const getByUsername = useCallback((username) => users.find(u => u.username === username), [users]);

  const getByEmail = useCallback((email) => users.find(u => u.email === email), [users]);

  const getByRole = useCallback((role) => {
    if (!role) return users;
    return users.filter(u => u.role === role);
  }, [users]);

  const login = useCallback((username, password) => {
    const user = users.find(u => u.username === username);
    if (user && verifyPassword(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, message: '用户名或密码错误' };
  }, [users]);

  const create = useCallback((userData) => {
    const existing = users.find(u => u.username === userData.username || u.email === userData.email);
    if (existing) {
      return { success: false, message: '用户名或邮箱已存在' };
    }

    const newUser = {
      ...userData,
      id: Date.now(),
      password: hashPassword(userData.password),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const newUsers = [newUser, ...users];
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  }, [users, setUsers, saveToStorage]);

  const update = useCallback((id, updates) => {
    const newUsers = users.map(u =>
      u.id === id
        ? { ...u, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
        : u
    );
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    const updated = newUsers.find(u => u.id === id);
    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }, [users, setUsers, saveToStorage]);

  const remove = useCallback((id) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    return true;
  }, [users, setUsers, saveToStorage]);

  const updatePassword = useCallback((id, newPassword) => {
    const newUsers = users.map(u =>
      u.id === id
        ? { ...u, password: hashPassword(newPassword), updatedAt: new Date().toISOString().split('T')[0] }
        : u
    );
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    return true;
  }, [users, setUsers, saveToStorage]);

  const toggleStatus = useCallback((id) => {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    return update(id, { status: newStatus });
  }, [users, update]);

  return {
    getAll,
    getById,
    getByUsername,
    getByEmail,
    getByRole,
    login,
    create,
    update,
    remove,
    updatePassword,
    toggleStatus,
  };
};

export default createUsersService;