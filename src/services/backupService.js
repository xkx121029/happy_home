export const createBackupService = (setBackups, backups, saveToStorage, data) => {
  const { posts, pages, users, categories, tags, menus, settings, comments, widgets } = data;

  const createBackup = (name, type, backupData) => {
    const newBackup = {
      id: Date.now(),
      name,
      type,
      size: new Blob([JSON.stringify(backupData)]).size,
      createdAt: new Date().toISOString(),
      data: backupData,
    };
    const newBackups = [newBackup, ...backups];
    setBackups(newBackups);
    saveToStorage('happyhome_backups', newBackups);
    return newBackup;
  };

  const createFullBackup = () => {
    const fullData = {
      posts,
      pages,
      users: users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }),
      categories,
      tags,
      menus,
      settings,
      comments,
      widgets,
    };
    return createBackup(`完整备份 ${new Date().toLocaleString()}`, 'full', fullData);
  };

  const createCustomBackup = (name, type, backupData) => {
    return createBackup(name, type, backupData);
  };

  const restore = (id, setters) => {
    const backup = backups.find(b => b.id === id);
    if (!backup) return { success: false, message: '备份不存在' };

    const { data: backupData } = backup;
    if (backupData.posts && setters.setPosts) {
      setters.setPosts(backupData.posts);
      saveToStorage('happyhome_posts', backupData.posts);
    }
    if (backupData.pages && setters.setPages) {
      setters.setPages(backupData.pages);
      saveToStorage('happyhome_pages', backupData.pages);
    }
    if (backupData.users && setters.setUsers) {
      const usersWithPassword = backupData.users.map(u => {
        const existing = users.find(existing => existing.id === u.id);
        return existing ? { ...u, password: existing.password } : u;
      });
      setters.setUsers(usersWithPassword);
      saveToStorage('happyhome_users', usersWithPassword);
    }
    if (backupData.categories && setters.setCategories) {
      setters.setCategories(backupData.categories);
      saveToStorage('happyhome_categories', backupData.categories);
    }
    if (backupData.tags && setters.setTags) {
      setters.setTags(backupData.tags);
      saveToStorage('happyhome_tags', backupData.tags);
    }
    if (backupData.menus && setters.setMenus) {
      setters.setMenus(backupData.menus);
      saveToStorage('happyhome_menus', backupData.menus);
    }
    if (backupData.settings && setters.setSettings) {
      setters.setSettings(backupData.settings);
      saveToStorage('happyhome_settings', backupData.settings);
    }
    if (backupData.comments && setters.setComments) {
      setters.setComments(backupData.comments);
      saveToStorage('happyhome_comments', backupData.comments);
    }
    if (backupData.widgets && setters.setWidgets) {
      setters.setWidgets(backupData.widgets);
      saveToStorage('happyhome_widgets', backupData.widgets);
    }

    return { success: true, message: '备份恢复成功' };
  };

  const download = (id) => {
    const backup = backups.find(b => b.id === id);
    if (!backup) return false;

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.name}-${backup.createdAt.split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  };

  const exportData = (type, exportData) => {
    let dataToExport = {};
    switch (type) {
      case 'posts':
        dataToExport = { posts: exportData.posts, exportedAt: new Date().toISOString() };
        break;
      case 'pages':
        dataToExport = { pages: exportData.pages, exportedAt: new Date().toISOString() };
        break;
      case 'comments':
        dataToExport = { comments: exportData.comments, exportedAt: new Date().toISOString() };
        break;
      case 'full':
      default:
        dataToExport = {
          posts: exportData.posts,
          pages: exportData.pages,
          categories: exportData.categories,
          tags: exportData.tags,
          menus: exportData.menus,
          comments: exportData.comments,
          exportedAt: new Date().toISOString(),
        };
    }
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  };

  const importData = (file, setters) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.posts && setters.setPosts) {
            setters.setPosts(data.posts);
            saveToStorage('happyhome_posts', data.posts);
          }
          if (data.pages && setters.setPages) {
            setters.setPages(data.pages);
            saveToStorage('happyhome_pages', data.pages);
          }
          if (data.categories && setters.setCategories) {
            setters.setCategories(data.categories);
            saveToStorage('happyhome_categories', data.categories);
          }
          if (data.tags && setters.setTags) {
            setters.setTags(data.tags);
            saveToStorage('happyhome_tags', data.tags);
          }
          if (data.menus && setters.setMenus) {
            setters.setMenus(data.menus);
            saveToStorage('happyhome_menus', data.menus);
          }
          if (data.comments && setters.setComments) {
            setters.setComments(data.comments);
            saveToStorage('happyhome_comments', data.comments);
          }
          resolve({ success: true, message: '数据导入成功' });
        } catch (error) {
          reject({ success: false, message: '文件格式错误' });
        }
      };
      reader.onerror = () => reject({ success: false, message: '读取文件失败' });
      reader.readAsText(file);
    });
  };

  const exportPostsAsMarkdown = (postId, posts) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    let markdown = `# ${post.title}\n\n`;
    markdown += `> ${post.excerpt || ''}\n\n`;
    markdown += `**分类**: ${post.category || '未分类'}  **标签**: ${(post.tags || []).join(', ')}\n\n`;
    markdown += `---\n\n`;
    markdown += post.content.replace(/<[^>]+>/g, '') + '\n\n';
    markdown += `---\n\n`;
    markdown += `*创建于: ${post.createdAt}*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title}-${post.createdAt}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  };

  return {
    getAll: () => backups,
    getById: (id) => backups.find(b => b.id === id),
    create: createBackup,
    createFullBackup,
    createCustomBackup,
    restore,
    delete: (id) => {
      const newBackups = backups.filter(b => b.id !== id);
      setBackups(newBackups);
      saveToStorage('happyhome_backups', newBackups);
      return true;
    },
    download,
    exportData,
    importData,
    exportPostsAsMarkdown,
  };
};

export default createBackupService;