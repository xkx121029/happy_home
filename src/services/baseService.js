import { useCallback } from 'react';

export const createCRUDServices = (setItems, items, saveToStorage, storageKey) => {
  const getAll = useCallback(() => items, [items]);

  const getById = useCallback((id) => items.find(item => item.id === id), [items]);

  const create = useCallback((data) => {
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
  }, [items, setItems, saveToStorage, storageKey]);

  const update = useCallback((id, updates) => {
    const newItems = items.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
        : item
    );
    setItems(newItems);
    saveToStorage(storageKey, newItems);
    return newItems.find(item => item.id === id);
  }, [items, setItems, saveToStorage, storageKey]);

  const remove = useCallback((id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveToStorage(storageKey, newItems);
    return true;
  }, [items, setItems, saveToStorage, storageKey]);

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  };
};

export default createCRUDServices;