import { createCRUDServices } from './baseService';

export const createPostsService = (setPosts, posts, saveToStorage, revisionsAPI) => {
  const baseService = createCRUDServices(setPosts, posts, saveToStorage, 'happyhome_posts');

  const getByStatus = (status) => {
    if (!status || status === 'all') return posts;
    return posts.filter(post => post.status === status);
  };

  const getByCategory = (category) => {
    if (!category) return posts;
    return posts.filter(post => post.categories?.includes(category));
  };

  const getByTag = (tag) => {
    if (!tag) return posts;
    return posts.filter(post => post.tags?.includes(tag));
  };

  const publish = (id) => {
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
  };

  const saveDraft = (id, data) => {
    if (revisionsAPI) {
      const post = posts.find(p => p.id === id);
      if (post) {
        revisionsAPI.create(id, post);
      }
    }
    
    return baseService.update(id, { ...data, status: 'draft' });
  };

  const toggleSticky = (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return null;
    return baseService.update(id, { sticky: !post.sticky });
  };

  const schedule = (id, publishDate) => {
    return baseService.update(id, { 
      status: 'future', 
      publishDate 
    });
  };

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