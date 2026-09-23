const express = require('express');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- 备份管理
//
// 原来 /api/backups 一组接口完全不存在，前端 Backup 页的 10 个操作全是
// 「暂未实现」的提示。这里做真实的文件级备份。
//
// 设计取舍：备份文件放在 backend/backups/ 目录，而不是写进数据库的 backups 表。
// 备份的意义就是在数据库本身损坏时还能救回来，把它存进同一个库
// 是自我循环 —— 库没了，备份跟着一起没。所以以文件系统为唯一真源，
// 列表直接读目录，不依赖任何数据库表。
module.exports = function createBackupsRoutes(deps) {
  const { ok, fail, asyncHandler, initDatabase, requireAccess, ROLE_ADMIN_ONLY } = deps;
  const router = express.Router();

  // 本模块位于 src/modules/backups/，向上三级回到 backend/ 根目录
  const ROOT_DIR = path.join(__dirname, '..', '..', '..');
  const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
  const DB_FILE = path.join(ROOT_DIR, 'happyhome.db');
  const BACKUP_FILE_PATTERN = /^happyhome-[\dT\-Z]+-(manual|auto)\.db$/;

  function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  function backupFileName(type) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `happyhome-${stamp}-${type}.db`;
  }

  function describeBackup(fileName) {
    const stat = fs.statSync(path.join(BACKUP_DIR, fileName));
    const match = fileName.match(/-(manual|auto)\.db$/);
    return {
      id: fileName,
      name: fileName,
      type: match ? match[1] : 'unknown',
      size: stat.size,
      createdAt: stat.mtime.toISOString(),
    };
  }

  function listBackups() {
    ensureBackupDir();
    return fs.readdirSync(BACKUP_DIR)
      .filter((name) => BACKUP_FILE_PATTERN.test(name))
      .map(describeBackup)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // 备份 id 来自 URL，必须挡住 ../ 之类的路径穿越
  function resolveBackupPath(id) {
    if (!BACKUP_FILE_PATTERN.test(id)) return null;
    const full = path.join(BACKUP_DIR, id);
    if (path.dirname(full) !== BACKUP_DIR) return null;
    return fs.existsSync(full) ? full : null;
  }

  router.get('/backups', requireAccess('backups:read', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const backups = listBackups();
      ok(res, { data: backups, count: backups.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/backups', requireAccess('backups:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return fail(res, 400, '数据库文件不存在，无法备份');
      }
      ensureBackupDir();
      const fileName = backupFileName('manual');
      // 先写临时文件再改名，避免列表里出现半截文件
      const target = path.join(BACKUP_DIR, fileName);
      fs.copyFileSync(DB_FILE, `${target}.tmp`);
      fs.renameSync(`${target}.tmp`, target);
      ok(res, { message: '备份创建成功', data: describeBackup(fileName) }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/backups/:id/download', requireAccess('backups:read', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    const filePath = resolveBackupPath(req.params.id);
    if (!filePath) {
      return fail(res, 404, '备份不存在');
    }
    res.download(filePath, req.params.id);
  });

  router.delete('/backups/:id', requireAccess('backups:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const filePath = resolveBackupPath(req.params.id);
      if (!filePath) {
        return fail(res, 404, '备份不存在');
      }
      fs.unlinkSync(filePath);
      ok(res, { message: '备份已删除' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/backups/:id/restore', requireAccess('backups:restore', { roles: ROLE_ADMIN_ONLY }), asyncHandler(async (req, res) => {
    try {
      const filePath = resolveBackupPath(req.params.id);
      if (!filePath) {
        return fail(res, 404, '备份不存在');
      }

      // 恢复前先把当前状态存一份，误操作还有回头路
      const safetyName = backupFileName('auto');
      ensureBackupDir();
      const safetyPath = path.join(BACKUP_DIR, safetyName);
      fs.copyFileSync(DB_FILE, safetyPath);

      fs.copyFileSync(filePath, DB_FILE);

      // 内存里的 sql.js 实例还持有旧数据，必须重新加载，否则接口返回的仍是恢复前的内容
      await initDatabase();

      ok(res, {
        message: `已从备份恢复，恢复前的数据已自动保存为 ${safetyName}`,
        data: { safetyBackup: safetyName },
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '恢复失败：' + error.message);
    }
  }));

  return router;
};