const express = require('express');
const crypto = require('crypto');
const permissions = require('../../lib/permissions');

/**
 * API 密钥管理。
 *
 * 对外开放 API 的长期凭据。设计上有三条硬约束：
 *
 *   1. 明文只在创建/轮换的响应里出现一次，之后任何端点都取不回来 ——
 *      库里存的是 bcrypt 哈希，与用户密码同一套处理。
 *   2. 密钥不能管理密钥。apikeys:* 一律要求 administrator 角色，
 *      requireAccess 的 key 分支只认 scope、不看角色，所以拿密钥来调
 *      这里必然 403（密钥的 req.user.role 固定为 'api'）。
 *   3. 撤销是软删（revoked_at），保留「谁在什么时候用过」的审计痕迹；
 *      只有 DELETE 才是真删。
 */
module.exports = function createApiKeysRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, ok, fail, requireAccess, ROLE_ADMIN_ONLY, password } = deps;
  const router = express.Router();

  // key_hash 永远不出现在任何响应里，所以列清单写死而不是 SELECT *
  const KEY_COLUMNS =
    'id, name, key_prefix, scopes, expires_at, last_used_at, request_count, created_by, created_at, revoked_at';

  const NAME_MAX_LENGTH = 100;

  /**
   * 生成密钥明文。
   *
   * 格式 hhk_<8位前缀>_<32位随机>，前缀存在的意义是让鉴权层能用一次
   * 「按前缀索引查询 + 少量 bcrypt 比对」代替「全表逐个比对」。
   * 两段都用 hex，避免 base64url 里的 `-`/`_` 与分隔符混淆。
   */
  function generateKey() {
    const prefix = crypto.randomBytes(4).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    return { plaintext: `hhk_${prefix}_${secret}`, prefix };
  }

  /** 库里 scopes 存 JSON 字符串，对外直接给数组 —— 开放 API 的调用方不该再解一层。 */
  function toPublicRow(row) {
    if (!row) return row;
    let scopes = [];
    try {
      scopes = JSON.parse(row.scopes || '[]');
    } catch {
      scopes = [];
    }
    return { ...row, scopes };
  }

  function listKeys() {
    const db = getDb();
    return execQuery(db, `SELECT ${KEY_COLUMNS} FROM api_keys ORDER BY created_at DESC`).map(toPublicRow);
  }

  function findKey(id) {
    const db = getDb();
    return getSingle(db, `SELECT ${KEY_COLUMNS} FROM api_keys WHERE id = ?`, [id]);
  }

  /**
   * 校验创建/轮换时的入参。
   * @returns {{ error?: string, scopes?: string[], expiresAt?: string|null }}
   */
  function validateInput(body) {
    const name = String(body.name || '').trim();
    if (!name) return { error: '请填写备注名' };
    if (name.length > NAME_MAX_LENGTH) return { error: `备注名不能超过 ${NAME_MAX_LENGTH} 个字符` };

    const scopes = permissions.sanitizeScopes(body.scopes);
    if (scopes.length === 0) return { error: '请至少选择一项权限' };

    let expiresAt = null;
    if (body.expiresAt) {
      const parsed = new Date(body.expiresAt);
      if (Number.isNaN(parsed.getTime())) return { error: '有效期格式不正确' };
      if (parsed.getTime() <= Date.now()) return { error: '有效期必须晚于当前时间' };
      expiresAt = parsed.toISOString();
    }

    return { scopes, expiresAt, name };
  }

  router.get('/api-keys', requireAccess('apikeys:read', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const keys = listKeys();
      ok(res, { data: keys, count: keys.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  /**
   * scope 目录。后台新建密钥的复选框直接按这个结构渲染 ——
   * 标签只在 lib/permissions 里写一份，前端不再抄一遍，
   * 将来加 scope 时不会出现「后端支持但界面勾不到」。
   */
  router.get('/api-keys/scopes', requireAccess('apikeys:read', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    ok(res, {
      data: {
        groups: permissions.SCOPE_GROUPS,
        defaults: permissions.READONLY_SCOPES,
        wildcard: permissions.WILDCARD_SCOPE,
      },
    });
  });

  router.post('/api-keys', requireAccess('apikeys:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const input = validateInput(req.body);
      if (input.error) return fail(res, 400, input.error);

      const { plaintext, prefix } = generateKey();
      const id = uuidv4();
      const db = getDb();

      db.run(
        'INSERT INTO api_keys (id, name, key_hash, key_prefix, scopes, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, input.name, password.hash(plaintext), prefix, JSON.stringify(input.scopes), input.expiresAt, req.user?.id || null]
      );
      saveDatabase();

      // key 只在这一条响应里出现，之后无处可取
      ok(res, {
        message: '密钥创建成功，请立即保存明文，此后再无法查看',
        data: { ...toPublicRow(findKey(id)), key: plaintext },
      }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api-keys/:id/revoke', requireAccess('apikeys:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const db = getDb();
      const existing = findKey(req.params.id);
      if (!existing) return fail(res, 404, '密钥不存在');
      if (existing.revoked_at) return fail(res, 400, '该密钥已撤销');

      db.run("UPDATE api_keys SET revoked_at = datetime('now') WHERE id = ?", [req.params.id]);
      saveDatabase();

      ok(res, { message: '密钥已撤销', data: toPublicRow(findKey(req.params.id)) });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api-keys/:id/rotate', requireAccess('apikeys:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const db = getDb();
      const existing = findKey(req.params.id);
      if (!existing) return fail(res, 404, '密钥不存在');
      if (existing.revoked_at) return fail(res, 400, '已撤销的密钥不能轮换');

      // 换前缀也换哈希：旧明文立刻失效，不需要额外的失效名单
      const { plaintext, prefix } = generateKey();
      db.run(
        'UPDATE api_keys SET key_hash = ?, key_prefix = ?, request_count = 0, last_used_at = NULL WHERE id = ?',
        [password.hash(plaintext), prefix, req.params.id]
      );
      saveDatabase();

      ok(res, {
        message: '密钥已轮换，旧密钥立即失效，请保存新的明文',
        data: { ...toPublicRow(findKey(req.params.id)), key: plaintext },
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api-keys/:id', requireAccess('apikeys:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const db = getDb();
      const existing = findKey(req.params.id);
      if (!existing) return fail(res, 404, '密钥不存在');

      db.run('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '密钥已删除', data: toPublicRow(existing) });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};
