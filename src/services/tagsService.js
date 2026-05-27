import { createCRUDServices } from './baseService';

export const createTagsService = (setTags, tags, saveToStorage, posts) => {
  const baseService = createCRUDServices(setTags, tags, saveToStorage, 'happyhome_tags');

  const getBySlug = (slug) => {
    return tags.find(tag => tag.slug === slug);
  };

  const getWithCount = () => {
    return tags.map(tag => ({
      ...tag,
      count: posts.filter(p => p.tags?.includes(tag.id) || p.tags?.includes(tag.name)).length,
    }));
  };

  const canDelete = (id) => {
    const tag = tags.find(t => t.id === id);
    return !tag || tag.count === 0;
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const incrementCount = (id) => {
    const newTags = tags.map(t =>
      t.id === id ? { ...t, count: t.count + 1 } : t
    );
    setTags(newTags);
    saveToStorage('happyhome_tags', newTags);
  };

  const decrementCount = (id) => {
    const newTags = tags.map(t =>
      t.id === id ? { ...t, count: Math.max(0, t.count - 1) } : t
    );
    setTags(newTags);
    saveToStorage('happyhome_tags', newTags);
  };

  return {
    ...baseService,
    getBySlug,
    getWithCount,
    canDelete,
    generateSlug,
    incrementCount,
    decrementCount,
  };
};

export default createTagsService;