export const createCRUDServices = (setItems, items, saveToStorage, storageKey) => {
  const getAll = () => items;

  const getById = (id) => items.find(item => item.id === id);

  const create = (data) => {
    const newItem = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const newItems = [newItem, ...items];
    setItems(newItems);
    saveToStorage(storageKey, newItems);
    return newItem;
  };

  const update = (id, updates) => {
    const newItems = items.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
        : item
    );
    setItems(newItems);
    saveToStorage(storageKey, newItems);
    return newItems.find(item => item.id === id);
  };

  const remove = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveToStorage(storageKey, newItems);
    return true;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
};

export default createCRUDServices;