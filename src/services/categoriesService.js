import { useCallback } from 'react';
import { createCRUDServices } from './baseService';

export const createCategoriesService = (setCategories, categories, saveToStorage, posts) => {
  const baseService = createCRUDServices(setCategories, categories, saveToStorage, 'happyhome_categories');

  const getBySlug = useCallback((slug) => {
    return categories.find(cat => cat.slug === slug);
  }, [categories]);

  const getByParent = useCallback((parentId) => {
    return categories.filter(cat => cat.parent === parentId);
  }, [categories]);

  const getWithCount = useCallback(() => {
    return categories.map(cat => ({
      ...cat,
      count: posts.filter(p => p.categories?.includes(cat.id) || p.categories?.includes(cat.name)).length,
    }));
  }, [categories, posts]);

  const canDelete = useCallback((id) => {
    const hasChildren = categories.some(cat => cat.parent === id);
    const hasPosts = posts.some(p => p.categories?.includes(id));
    return !hasChildren && !hasPosts;
  }, [categories, posts]);

  const generateSlug = useCallback((name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  return {
    ...baseService,
    getBySlug,
    getByParent,
    getWithCount,
    canDelete,
    generateSlug,
  };
};

export default createCategoriesService;