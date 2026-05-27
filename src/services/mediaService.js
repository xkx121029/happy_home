export const createMediaService = (setMedia, media, saveToStorage) => {
  const getAll = () => media;

  const getById = (id) => {
    return media.find(m => m.id === id);
  };

  const upload = (file, url) => {
    const newMedia = {
      id: Date.now(),
      name: file.name,
      url: url,
      size: formatFileSize(file.size),
      type: file.type,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const newMediaList = [newMedia, ...media];
    setMedia(newMediaList);
    saveToStorage('happyhome_media', newMediaList);
    return newMedia;
  };

  const deleteMedia = (id) => {
    const newMediaList = media.filter(m => m.id !== id);
    setMedia(newMediaList);
    saveToStorage('happyhome_media', newMediaList);
    return true;
  };

  const getByType = (type) => {
    if (!type) return media;
    return media.filter(m => m.type.startsWith(type));
  };

  const search = (query) => {
    if (!query) return media;
    const lowerQuery = query.toLowerCase();
    return media.filter(m => m.name.toLowerCase().includes(lowerQuery));
  };

  return {
    getAll,
    getById,
    upload,
    delete: deleteMedia,
    getByType,
    search,
  };
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default createMediaService;