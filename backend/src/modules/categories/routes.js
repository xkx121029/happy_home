const express = require('express');

// 分类（categories）CRUD
module.exports = function createCategoriesRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, ok, fail, requireAccess, ROLE_CONTENT } = deps;
  const router = express.Router();

  router.get('/categories', requireAccess('categories:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();

      // ?usedOnly=1：只返回「已被已发布文章实际用到」的分类。
      // 这个语义来自合并掉的 /public/categories —— 前台列表的分类下拉不该列出
      // 后台建了但一篇文章都没挂的分类。
      //
      // 注意返回的仍然是分类行对象，不是分类名的字符串数组：合并前那个端点返回
      // string[]，与这里的行对象是同一个路径上的两种形状，必须收敛成一种，
      // 否则外部客户端没法写文档。用 name 过滤，但形状保持一致。
      if (req.query.usedOnly === '1') {
        const used = execQuery(
          db,
          `SELECT * FROM categories
           WHERE name IN (
             SELECT DISTINCT category FROM posts
             WHERE status = 'published' AND category IS NOT NULL AND category != ''
           )
           ORDER BY created_at DESC`
        );
        return ok(res, { data: used, count: used.length });
      }

      const categories = execQuery(db, 'SELECT * FROM categories ORDER BY created_at DESC');
      ok(res, { data: categories, count: categories.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/categories', requireAccess('categories:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { name, slug, description, parent } = req.body;
      const db = getDb();

      if (!name) {
        return fail(res, 400, '请输入分类名称');
      }

      const newCategoryId = uuidv4();
      const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

      db.run(
        'INSERT INTO categories (id, name, slug, description, parent) VALUES (?, ?, ?, ?, ?)',
        [newCategoryId, name, categorySlug, description || '', parent || null]
      );
      saveDatabase();

      const newCategory = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [newCategoryId]);
      ok(res, { message: '分类创建成功', data: newCategory }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/categories/:id', requireAccess('categories:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { name, slug, description, parent } = req.body;
      const db = getDb();
      const category = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);

      if (!category) {
        return fail(res, 404, '分类不存在');
      }

      db.run(
        'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), parent = ? WHERE id = ?',
        bindable([name, slug, description, parent || null, req.params.id])
      );
      saveDatabase();

      const updatedCategory = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);
      ok(res, { message: '分类更新成功', data: updatedCategory });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/categories/:id', requireAccess('categories:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const db = getDb();
      const category = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);
      if (!category) {
        return fail(res, 404, '分类不存在');
      }

      const hasChildren = getSingle(db, 'SELECT id FROM categories WHERE parent = ?', [req.params.id]);
      if (hasChildren) {
        return fail(res, 400, '请先删除子分类');
      }

      db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
      db.run('DELETE FROM post_categories WHERE category_id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '分类删除成功', data: category });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};