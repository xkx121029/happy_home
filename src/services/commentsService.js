import { createCRUDServices } from './baseService';

export const createCommentsService = (setComments, comments, saveToStorage) => {
  const baseService = createCRUDServices(setComments, comments, saveToStorage, 'happyhome_comments');

  const getByPostId = (postId) => {
    return comments.filter(c => c.postId === postId);
  };

  const getByStatus = (status) => {
    return comments.filter(c => c.status === status);
  };

  const getReplies = (parentId) => {
    return comments.filter(c => c.parentId === parentId);
  };

  const getReplyCount = (commentId) => {
    return comments.filter(c => c.parentId === commentId).length;
  };

  const approve = (id) => {
    return baseService.update(id, { status: 'approved' });
  };

  const spam = (id) => {
    return baseService.update(id, { status: 'spam' });
  };

  const trash = (id) => {
    return baseService.update(id, { status: 'trash' });
  };

  const reply = (parentId, replyData) => {
    const parent = comments.find(c => c.id === parentId);
    if (!parent) return null;
    return baseService.create({
      ...replyData,
      postId: parent.postId,
      parentId: parentId,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    });
  };

  const deleteWithReplies = (id) => {
    const newComments = comments.filter(c => c.id !== id && c.parentId !== id);
    setComments(newComments);
    saveToStorage('happyhome_comments', newComments);
    return true;
  };

  return {
    ...baseService,
    getByPostId,
    getByStatus,
    getReplies,
    getReplyCount,
    approve,
    spam,
    trash,
    reply,
    deleteWithReplies,
  };
};

export default createCommentsService;