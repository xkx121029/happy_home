const MAX_REVISIONS_PER_POST = 10;

export const createRevisionsService = (setRevisions, revisions, saveToStorage) => {
  const getAll = () => revisions;

  const getByPostId = (postId) => {
    return revisions.filter(r => r.postId === postId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getById = (id) => {
    return revisions.find(r => r.id === id);
  };

  const create = (postId, postData) => {
    const newRevision = {
      id: Date.now(),
      postId,
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt,
      author: postData.author || 'admin',
      createdAt: new Date().toISOString(),
    };
    const postRevisions = revisions.filter(r => r.postId === postId);
    const otherRevisions = revisions.filter(r => r.postId !== postId);

    let updatedRevisions = [newRevision, ...postRevisions];
    if (updatedRevisions.length > MAX_REVISIONS_PER_POST) {
      updatedRevisions = updatedRevisions.slice(0, MAX_REVISIONS_PER_POST);
    }

    const newRevisions = [...otherRevisions, ...updatedRevisions];
    setRevisions(newRevisions);
    saveToStorage('happyhome_revisions', newRevisions);
    return newRevision;
  };

  const restore = (revisionId, postsAPI) => {
    const revision = revisions.find(r => r.id === revisionId);
    if (!revision) return null;

    if (postsAPI && postsAPI.update) {
      postsAPI.update(revision.postId, {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }
    return revision;
  };

  const deleteRevision = (id) => {
    const newRevisions = revisions.filter(r => r.id !== id);
    setRevisions(newRevisions);
    saveToStorage('happyhome_revisions', newRevisions);
    return true;
  };

  const deleteByPostId = (postId) => {
    const newRevisions = revisions.filter(r => r.postId !== postId);
    setRevisions(newRevisions);
    saveToStorage('happyhome_revisions', newRevisions);
    return true;
  };

  const deleteOldRevisions = (postId, keepCount = 5) => {
    const postRevisions = revisions.filter(r => r.postId === postId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const toDelete = postRevisions.slice(keepCount);
    const toKeep = postRevisions.slice(0, keepCount);
    const otherRevisions = revisions.filter(r => r.postId !== postId);
    const newRevisions = [...toKeep, ...otherRevisions];
    setRevisions(newRevisions);
    saveToStorage('happyhome_revisions', newRevisions);
    return toDelete.length;
  };

  return {
    getAll,
    getByPostId,
    getById,
    create,
    restore,
    delete: deleteRevision,
    deleteByPostId,
    deleteOldRevisions,
  };
};

export default createRevisionsService;