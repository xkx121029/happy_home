import { createCRUDServices } from './baseService';

export const createPagesService = (setPages, pages, saveToStorage) => {
  const baseService = createCRUDServices(setPages, pages, saveToStorage, 'happyhome_pages');

  const getByStatus = (status) => {
    if (!status || status === 'all') return pages;
    return pages.filter(page => page.status === status);
  };

  const getBySlug = (slug) => {
    return pages.find(page => page.slug === slug);
  };

  const publish = (id) => {
    return baseService.update(id, { 
      status: 'publish', 
      publishedAt: new Date().toISOString() 
    });
  };

  return {
    ...baseService,
    getByStatus,
    getBySlug,
    publish,
  };
};

export default createPagesService;