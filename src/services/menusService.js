import { createCRUDServices } from './baseService';

export const createMenusService = (setMenus, menus, saveToStorage) => {
  const baseService = createCRUDServices(setMenus, menus, saveToStorage, 'happyhome_menus');

  const getByLocation = (location) => {
    return menus.find(m => m.location === location);
  };

  const addItem = (menuId, item) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return null;
    const newItem = {
      ...item,
      id: Date.now(),
      order: menu.items.length + 1,
    };
    const newItems = [...menu.items, newItem];
    const newMenus = menus.map(m =>
      m.id === menuId
        ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMenus(newMenus);
    saveToStorage('happyhome_menus', newMenus);
    return newItem;
  };

  const updateItem = (menuId, itemId, updates) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return null;
    const newItems = menu.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const newMenus = menus.map(m =>
      m.id === menuId
        ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMenus(newMenus);
    saveToStorage('happyhome_menus', newMenus);
    return newItems.find(item => item.id === itemId);
  };

  const deleteItem = (menuId, itemId) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return false;
    const newItems = menu.items.filter(item => item.id !== itemId);
    const newMenus = menus.map(m =>
      m.id === menuId
        ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMenus(newMenus);
    saveToStorage('happyhome_menus', newMenus);
    return true;
  };

  const reorder = (menuId, orderedItems) => {
    const newMenus = menus.map(m =>
      m.id === menuId
        ? { ...m, items: orderedItems, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMenus(newMenus);
    saveToStorage('happyhome_menus', newMenus);
    return true;
  };

  const toggleEnabled = (menuId, itemId) => {
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return null;
    const item = menu.items.find(i => i.id === itemId);
    if (!item) return null;
    const newItems = menu.items.map(i =>
      i.id === itemId ? { ...i, enabled: !i.enabled } : i
    );
    const newMenus = menus.map(m =>
      m.id === menuId
        ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMenus(newMenus);
    saveToStorage('happyhome_menus', newMenus);
    return newItems.find(i => i.id === itemId);
  };

  return {
    ...baseService,
    getByLocation,
    addItem,
    updateItem,
    deleteItem,
    reorder,
    toggleEnabled,
  };
};

export default createMenusService;