import { useCallback } from 'react';
import { createCRUDServices } from './baseService';

export const createPagesService = (setPages, pages, saveToStorage) => {
  const baseService = createCRUDServices(setPages, pages, saveToStorage, 'happyhome_pages');

  const getByStatus = useCallback((status) => {
    if (!status || status === 'all') return pages;
    return pages.filter(page => page.status === status);
  }, [pages]);

  const getBySlug = useCallback((slug) => {
    return pages.find(page => page.slug === slug);
  }, [pages]);

  const publish = useCallback((id) => {
    return baseService.update(id, { 
      status: 'publish', 
      publishedAt: new Date().toISOString() 
    });
  }, [baseService]);

  return {
    ...baseService,
    getByStatus,
    getBySlug,
    publish,
  };
};

export default createPagesService;