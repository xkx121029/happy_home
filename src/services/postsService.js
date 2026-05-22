import { useCallback } from 'react';
import { createCRUDServices } from './baseService';

export const createPostsService = (setPosts, posts, saveToStorage, revisionsAPI) => {
  const baseService = createCRUDServices(setPosts, posts, saveToStorage, 'happyhome_posts');

  const getByStatus = useCallback((status) => {
    if (!status || status === 'all') return posts;
    return posts.filter(post => post.status === status);
  }, [posts]);

  const getByCategory = useCallback((category) => {
    if (!category) return posts;
    return posts.filter(post => post.categories?.includes(category));
  }, [posts]);

  const getByTag = useCallback((tag) => {
    if (!tag) return posts;
    return posts.filter(post => post.tags?.includes(tag));
  }, [posts]);

  const publish = useCallback((id) => {
    const updated = baseService.update(id, { 
      status: 'publish', 
      publishedAt: new Date().toISOString() 
    });
    
    if (revisionsAPI) {
      const post = posts.find(p => p.id === id);
      if (post) {
        revisionsAPI.create(id, post);
      }
    }
    
    return updated;
  }, [baseService, posts, revisionsAPI]);

  const saveDraft = useCallback((id, data) => {
    if (revisionsAPI) {
      const post = posts.find(p => p.id === id);
      if (post) {
        revisionsAPI.create(id, post);
      }
    }
    
    return baseService.update(id, { ...data, status: 'draft' });
  }, [baseService, posts, revisionsAPI]);

  const toggleSticky = useCallback((id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return null;
    return baseService.update(id, { sticky: !post.sticky });
  }, [baseService, posts]);

  const schedule = useCallback((id, publishDate) => {
    return baseService.update(id, { 
      status: 'future', 
      publishDate 
    });
  }, [baseService]);

  return {
    ...baseService,
    getByStatus,
    getByCategory,
    getByTag,
    publish,
    saveDraft,
    toggleSticky,
    schedule,
  };
};

export default createPostsService;