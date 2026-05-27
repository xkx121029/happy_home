const hashPassword = (password) => password;
const verifyPassword = (inputPassword, storedPassword) => inputPassword === storedPassword;

export const createUsersService = (setUsers, users, saveToStorage) => {
  const getAll = () => users;

  const getById = (id) => users.find(u => u.id === id);

  const getByUsername = (username) => users.find(u => u.username === username);

  const getByEmail = (email) => users.find(u => u.email === email);

  const getByRole = (role) => {
    if (!role) return users;
    return users.filter(u => u.role === role);
  };

  const login = (username, password) => {
    const user = users.find(u => u.username === username);
    if (user && verifyPassword(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, message: '用户名或密码错误' };
  };

  const create = (userData) => {
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
  };

  const update = (id, updates) => {
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
  };

  const remove = (id) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    return true;
  };

  const updatePassword = (id, newPassword) => {
    const newUsers = users.map(u =>
      u.id === id
        ? { ...u, password: hashPassword(newPassword), updatedAt: new Date().toISOString().split('T')[0] }
        : u
    );
    setUsers(newUsers);
    saveToStorage('happyhome_users', newUsers);
    return true;
  };

  const toggleStatus = (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    return update(id, { status: newStatus });
  };

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