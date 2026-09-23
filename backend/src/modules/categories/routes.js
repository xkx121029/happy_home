const express = require('express');

// 分类（categories）CRUD
module.exports = function createCategoriesRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, ok, fail, requireAccess, ROLE_CONTENT } = deps;
  const router = express.Router();

  router.get('/categories', requireAccess('categories:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();
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