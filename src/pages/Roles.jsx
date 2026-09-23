import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Check, X, ChevronRight } from 'lucide-react';
import { roles as defaultRoles, getGroupedPermissions, getRolePermissionList } from '../utils/permissions';

export default function Roles() {
  const [roles, setRoles] = useState(defaultRoles);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editingPermissions, setEditingPermissions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const groupedPermissions = getGroupedPermissions();

  const handleCreateRole = () => {
    if (!newRole.name.trim()) return;

    const roleId = newRole.name.toLowerCase().replace(/\s+/g, '_');
    const customRole = {
      id: roleId,
      name: newRole.name,
      description: newRole.description || '',
      isSystem: false,
      permissions: [],
    };

    setRoles([...roles, customRole]);
    setNewRole({ name: '', description: '' });
    setIsCreating(false);
    setSelectedRole(customRole);
  };

  const handleDeleteRole = (roleId) => {
    setRoles(roles.filter(r => r.id !== roleId));
    setSelectedRole(null);
    setShowDeleteConfirm(null);
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setIsEditing(false);
    setEditingPermissions([]);
  };

  const handleEditPermissions = () => {
    if (!selectedRole) return;
    setEditingPermissions(getRolePermissionList(selectedRole.id));
    setIsEditing(true);
  };

  const handleTogglePermission = (permKey) => {
    setEditingPermissions(prev => {
      if (prev.includes(permKey)) {
        return prev.filter(p => p !== permKey);
      }
      return [...prev, permKey];
    });
  };

  const handleSelectAllInGroup = (resource) => {
    const group = groupedPermissions[resource];
    if (!group) return;

    const allKeys = group.actions.map(a => a.key);
    const allSelected = allKeys.every(k => editingPermissions.includes(k));

    setEditingPermissions(prev => {
      if (allSelected) {
        return prev.filter(k => !allKeys.includes(k));
      }
      const withoutGroup = prev.filter(k => !allKeys.includes(k));
      return [...withoutGroup, ...allKeys];
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;

    setRoles(roles.map(r => {
      if (r.id === selectedRole.id) {
        return { ...r, permissions: editingPermissions };
      }
      return r;
    }));

    setSelectedRole({ ...selectedRole, permissions: editingPermissions });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPermissions([]);
  };

  const getRolePermissions = (roleId) => {
    const customRole = roles.find(r => r.id === roleId);
    if (customRole && customRole.permissions && customRole.permissions.length > 0) {
      return customRole.permissions;
    }
    return getRolePermissionList(roleId);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">角色管理</h1>
          <p className="text-muted mt-1">管理用户角色和权限</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建角色
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 角色列表 */}
        <div className="bg-surface rounded-xl shadow-sm border border-line">
          <div className="p-4 border-b border-line">
            <h2 className="font-semibold text-fg flex items-center gap-2">
              <Shield className="w-4 h-4" />
              角色列表
            </h2>
          </div>
          <div className="p-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between hover:bg-surface-2 transition-colors${
                  selectedRole?.id === role.id ? 'bg-accent/12' : ''
                }`}
              >
                <div>
                  <div className="font-medium text-fg flex items-center gap-2">
                    {role.name}
                    {role.isSystem && (
                      <span className="text-xs bg-surface-2  px-2 py-0.5 rounded text-muted">
                        系统
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted">{role.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </button>
            ))}
          </div>
        </div>

        {/* 角色详情或创建表单 */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
              <h2 className="text-lg font-semibold text-fg mb-4">新建角色</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="输入角色名称"
                    className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fg mb-2">
                    描述
                  </label>
                  <input
                    type="text"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="输入角色描述"
                    className="w-full px-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); setNewRole({ name: '', description: '' }); }}
                    className="px-4 py-2 bg-surface-2  text-fg rounded-lg font-medium hover:bg-line transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          ) : selectedRole ? (
            <div className="bg-surface rounded-xl shadow-sm border border-line">
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
                    {selectedRole.name}
                    {selectedRole.isSystem && (
                      <span className="text-xs bg-surface-2  px-2 py-0.5 rounded text-muted">
                        系统角色
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted">{selectedRole.description}</p>
                </div>
                <div className="flex gap-2">
                  {!selectedRole.isSystem && (
                    <>
                      <button
                        onClick={() => setShowDeleteConfirm(selectedRole.id)}
                        className="p-2 text-danger hover:bg-danger/12  rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-fg">权限</h3>
                  {!selectedRole.isSystem && !isEditing && (
                    <button
                      onClick={handleEditPermissions}
                      className="text-sm text-accent hover:text-accent"
                    >
                      编辑权限
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([resource, group]) => (
                      <div key={resource} className="border border-line rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-fg">{group.label}</h4>
                          <button
                            onClick={() => handleSelectAllInGroup(resource)}
                            className="text-xs text-accent hover:text-accent"
                          >
                            全选/取消
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.actions.map((action) => (
                            <label
                              key={action.key}
                              className="flex items-center gap-2 text-sm text-muted cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={editingPermissions.includes(action.key)}
                                onChange={() => handleTogglePermission(action.key)}
                                className="rounded border-line text-accent focus:ring-accent"
                              />
                              {action.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSavePermissions}
                        className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-surface-2  text-fg rounded-lg font-medium hover:bg-line transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([resource, group]) => {
                      const rolePerms = getRolePermissions(selectedRole.id);
                      const hasAnyPerm = group.actions.some(a => rolePerms.includes(a.key));

                      return hasAnyPerm ? (
                        <div key={resource} className="border border-line rounded-lg p-4">
                          <h4 className="font-medium text-fg mb-2">{group.label}</h4>
                          <div className="flex flex-wrap gap-2">
                            {group.actions.map((action) => {
                              const hasPerm = rolePerms.includes(action.key);
                              return hasPerm ? (
                                <span
                                  key={action.key}
                                  className="px-2 py-1 bg-success/12  text-success text-sm rounded"
                                >
                                  {action.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-xl shadow-sm border border-line p-8 text-center">
              <Users className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">选择一个角色查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-fg mb-2">确认删除</h3>
            <p className="text-muted mb-4">
              确定要删除角色"{roles.find(r => r.id === showDeleteConfirm)?.name}"吗？此操作无法撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteRole(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-danger text-danger-fg rounded-lg font-medium hover:bg-danger transition-colors"
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-surface-2  text-fg rounded-lg font-medium hover:bg-line transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
