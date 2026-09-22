/**
 * HappyHome API 冒烟测试 / 契约基线
 *
 * 这是整个重构的契约门禁：拆后端时必须保证响应契约不漂移。
 *
 *   node scripts/smoke.mjs            运行并校验（存在基线时自动 diff）
 *   node scripts/smoke.mjs --save     运行并把当前响应存为基线
 *   node scripts/smoke.mjs --verbose  打印完整响应体
 *
 * 环境变量：
 *   API_BASE         默认 http://localhost:3002/api
 *   ADMIN_USER       默认 admin
 *   ADMIN_PASS       默认读 backend/.env 的 SMOKE_ADMIN_PASS，最后回退 admin123
 *                    （管理员口令已轮换过，正常情况下应写在 .env 里）
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, 'baseline.json');
const ENV_PATH = join(__dirname, '..', '.env');

// 从 backend/.env 取冒烟用的口令，避免把口令硬编码进版本库
function readEnvFile() {
  if (!existsSync(ENV_PATH)) return {};
  const result = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) result[match[1]] = match[2].trim();
  }
  return result;
}

const fileEnv = readEnvFile();
const BASE = process.env.API_BASE || 'http://localhost:3002/api';
const ADMIN_USER = process.env.ADMIN_USER || fileEnv.SMOKE_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || fileEnv.SMOKE_ADMIN_PASS || 'admin123';

const ARGS = new Set(process.argv.slice(2));
const SAVE = ARGS.has('--save');
const VERBOSE = ARGS.has('--verbose');

const MARK = `smoke-${Date.now()}`;
const results = [];
const cleanup = [];

// ---------------------------------------------------------------- http 封装

async function call(method, path, { body, token, headers = {} } = {}) {
  const url = `${BASE}${path}`;
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (token) opts.headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { __nonJson: text.slice(0, 200) };
    }
    return { status: res.status, body: parsed };
  } catch (err) {
    return { status: 0, body: { __transportError: err.message } };
  }
}

// -------------------------------------------------------------- 契约归一化

/**
 * 把响应体压成「契约形状」：保留 success 与结构，叶子值只留类型。
 * 这样 diff 能捕捉到「字段消失 / 字段改名 / 类型变了」，但不会被
 * 每次运行都不同的 id、时间戳、计数干扰。
 */
function shape(value, depth = 0) {
  if (depth > 6) return '…';
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return value.length === 0 ? ['[]'] : [shape(value[0], depth + 1)];
  }
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = shape(value[key], depth + 1);
    }
    return out;
  }
  if (typeof value === 'boolean') return `bool:${value}`;
  return typeof value;
}

const VOLATILE_KEYS = new Set(['__nonJson', '__transportError']);

function stableShape(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      out[key] = stableShape(value[key]);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? [] : [stableShape(value[0])];
  }
  if (typeof value === 'boolean') return `bool:${value}`;
  if (value === null) return 'null';
  return typeof value;
}

// -------------------------------------------------------------------- 用例

async function record(name, fn) {
  const { res, expect } = await fn();
  const pass = expect === undefined || res.status === expect;
  results.push({
    name,
    status: res.status,
    expect,
    pass,
    message: res.body?.message,
    shape: stableShape(res.body),
    body: VERBOSE ? res.body : undefined,
  });
  return res;
}

function printResults() {
  const width = Math.max(...results.map((r) => r.name.length), 10);
  console.log('');
  for (const r of results) {
    const flag = r.pass ? 'PASS' : 'FAIL';
    const expect = r.expect === undefined ? '' : ` (期望 ${r.expect})`;
    console.log(`  ${flag}  ${r.name.padEnd(width)}  ${r.status}${expect}`);
    if (!r.pass) {
      console.log(`        响应: ${JSON.stringify(r.body ?? {}, null, 0).slice(0, 400)}`);
    }
    if (VERBOSE && r.body) {
      console.log(`        ${JSON.stringify(r.body).slice(0, 600)}`);
    }
  }
}

function diffAgainstBaseline() {
  if (!existsSync(BASELINE_PATH)) return null;
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const byName = new Map(baseline.results.map((r) => [r.name, r]));
  const diffs = [];

  for (const r of results) {
    const old = byName.get(r.name);
    if (!old) {
      diffs.push(`${r.name}: 基线中不存在（新增用例）`);
      continue;
    }
    if (old.status !== r.status) {
      diffs.push(`${r.name}: 状态码 ${old.status} → ${r.status}`);
    }
    const a = JSON.stringify(old.shape);
    const b = JSON.stringify(r.shape);
    if (a !== b) {
      diffs.push(`${r.name}: 响应形状漂移\n      基线: ${a}\n      现在: ${b}`);
    }
  }
  for (const old of baseline.results) {
    if (!results.some((r) => r.name === old.name)) {
      diffs.push(`${old.name}: 基线中存在但本次未执行`);
    }
  }
  return diffs;
}

// ---------------------------------------------------------------------- 主流程

function saveBaseline() {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true });
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        savedAt: new Date().toISOString(),
        apiBase: BASE,
        note: 'shape 字段是契约形状（叶子值只留类型）；message 仅供参考不参与 diff',
        results: results.map(({ name, status, expect, shape, message }) => ({
          name,
          status,
          expect,
          shape,
          message,
        })),
      },
      null,
      2
    )
  );
}

async function main() {
  console.log(`\nHappyHome API 冒烟测试 → ${BASE}`);

  // 1. 健康检查
  await record('GET  /health', async () => ({ res: await call('GET', '/health'), expect: 200 }));

  // 2. 鉴权
  const login = await record('POST /auth/login', async () => ({
    res: await call('POST', '/auth/login', { body: { username: ADMIN_USER, password: ADMIN_PASS } }),
    expect: 200,
  }));
  const token = login.body?.data?.token || login.body?.token;
  if (!token) {
    console.error('\n登录失败，无法取得 token。后续用例跳过。');
    console.error(`响应: ${JSON.stringify(login.body)}`);
    printResults();
    process.exit(1);
  }

  await record('GET  /auth/me', async () => ({ res: await call('GET', '/auth/me', { token }), expect: 200 }));
  await record('GET  /auth/me (无 token)', async () => ({ res: await call('GET', '/auth/me'), expect: 401 }));

  // 3. 只读列表
  const reads = [
    ['GET  /posts', '/posts'],
    ['GET  /pages', '/pages'],
    ['GET  /categories', '/categories'],
    ['GET  /tags', '/tags'],
    ['GET  /menus', '/menus'],
    ['GET  /widgets', '/widgets'],
    ['GET  /media', '/media'],
    ['GET  /comments', '/comments'],
    ['GET  /users', '/users'],
    ['GET  /settings', '/settings'],
    ['GET  /notifications', '/notifications'],
    ['GET  /notifications/count', '/notifications/count'],
    ['GET  /analytics/stats', '/analytics/stats'],
  ];
  for (const [name, path] of reads) {
    await record(name, async () => ({ res: await call('GET', path, { token }), expect: 200 }));
  }

  // 4. 公开端点（无需 token）
  const publics = [
    ['GET  /public/posts', '/public/posts'],
    ['GET  /public/pages', '/public/pages'],
    ['GET  /public/settings', '/public/settings'],
  ];
  for (const [name, path] of publics) {
    await record(name, async () => ({ res: await call('GET', path), expect: 200 }));
  }

  // 5. 写路径：建 → 部分改 → 删。建完登记清理。
  //    这里刻意用「只传一个字段」的部分更新做 PUT —— sql.js 无法绑定 undefined，
  //    历史上这类调用会把所有 PUT 端点打成 500，必须由冒烟守住。
  const resources = [
    {
      name: 'posts',
      path: '/posts',
      create: { title: `${MARK} 标题`, content: '<p>内容</p>', category: '未分类', status: 'draft' },
      patch: { sticky: true },
    },
    {
      name: 'pages',
      path: '/pages',
      create: { title: `${MARK} 页面`, content: '<p>页面内容</p>', status: 'draft' },
      patch: { title: `${MARK} 页面已改` },
    },
    {
      name: 'categories',
      path: '/categories',
      create: { name: MARK, slug: MARK, description: '冒烟测试' },
      patch: { description: '冒烟测试已改' },
    },
    {
      name: 'tags',
      path: '/tags',
      create: { name: MARK, slug: MARK },
      patch: { name: `${MARK}-已改` },
    },
    {
      name: 'media',
      path: '/media',
      create: { name: `${MARK}.png`, url: 'https://example.com/x.png', size: '1 KB', type: 'image/png' },
      patch: null,
    },
  ];

  for (const r of resources) {
    const created = await record(`POST ${r.path}`, async () => ({
      res: await call('POST', r.path, { token, body: r.create }),
      expect: 201,
    }));

    const id = created.body?.data?.id;
    if (!id) continue;
    cleanup.push(['delete', `${r.path}/${id}`, token]);

    if (r.patch) {
      await record(`PUT  ${r.path}/:id (部分字段)`, async () => ({
        res: await call('PUT', `${r.path}/${id}`, { token, body: r.patch }),
        expect: 200,
      }));
    }
  }

  // 菜单：部分更新不得清空 items（历史上会写成 []）
  const menuCreated = await record('POST /menus', async () => {
    const res = await call('POST', '/menus', {
      token,
      body: { title: MARK, location: 'primary', items: [{ label: '首页', url: '/' }] },
    });
    if (res.body?.data?.id) cleanup.push(['delete', `/menus/${res.body.data.id}`, token]);
    return { res, expect: 201 };
  });
  const menuId = menuCreated.body?.data?.id;
  if (menuId) {
    await record('PUT  /menus/:id (只改标题，items 应保留)', async () => {
      const res = await call('PUT', `/menus/${menuId}`, { token, body: { title: `${MARK} 已改` } });
      const items = res.body?.data?.items;
      if (res.status === 200 && (!Array.isArray(items) || items.length === 0)) {
        return { res: { status: -1, body: { message: `items 被清空了: ${JSON.stringify(items)}` } }, expect: 200 };
      }
      return { res, expect: 200 };
    });
  }

  // 部件：创建时故意不传 location（历史上未传会因 undefined 绑定而 500），
  // 随后切换 enabled（同样历史上会 500）
  const widgetCreated = await record('POST /widgets (不传 location)', async () => {
    const res = await call('POST', '/widgets', {
      token,
      body: { name: MARK, type: 'recent_posts', config: {} },
    });
    if (res.body?.data?.id) cleanup.push(['delete', `/widgets/${res.body.data.id}`, token]);
    return { res, expect: 201 };
  });
  const widgetId = widgetCreated.body?.data?.id;
  if (widgetId) {
    await record('PUT  /widgets/:id (切换 enabled)', async () => ({
      res: await call('PUT', `/widgets/${widgetId}`, { token, body: { enabled: false } }),
      expect: 200,
    }));
  }

  await record('POST /notifications/demo', async () => ({
    res: await call('POST', '/notifications/demo', { token }),
    expect: 200,
  }));

  // 6. 权限：非管理员不得访问用户管理。
  //    这是必须守住的回归点 —— requireRole 曾经存在逻辑旁路，任何登录用户都能通过。
  const editorName = `${MARK}-editor`;
  const editorPass = 'EditorPass123';
  await record('POST /users 建 editor 账号', async () => {
    const res = await call('POST', '/users', {
      token,
      body: { username: editorName, email: `${MARK}@example.com`, password: editorPass, role: 'editor', status: 'active' },
    });
    if (res.body?.data?.id) cleanup.push(['delete', `/users/${res.body.data.id}`, token]);
    return { res, expect: 201 };
  });

  const editorLogin = await record('POST /auth/login (editor)', async () => ({
    res: await call('POST', '/auth/login', { body: { username: editorName, password: editorPass } }),
    expect: 200,
  }));
  const editorToken = editorLogin.body?.token;
  if (editorToken) {
    await record('GET  /users (editor 应 403)', async () => ({
      res: await call('GET', '/users', { token: editorToken }),
      expect: 403,
    }));
    await record('POST /backups (editor 应 403)', async () => ({
      res: await call('POST', '/backups', { token: editorToken }),
      expect: 403,
    }));
    // 普通登录用户仍应能读写内容
    await record('GET  /posts (editor 应 200)', async () => ({
      res: await call('GET', '/posts', { token: editorToken }),
      expect: 200,
    }));
  }

  // 7. 公开评论：访客没有 token 也必须能提交
  const commentTarget = await call('POST', '/posts', {
    token,
    body: { title: `${MARK} 评论目标`, content: '<p>x</p>', category: '未分类', status: 'published' },
  });
  const targetPostId = commentTarget.body?.data?.id;
  if (targetPostId) {
    cleanup.push(['delete', `/posts/${targetPostId}`, token]);

    const guestComment = await record('POST /public/comments (匿名)', async () => ({
      res: await call('POST', '/public/comments', {
        body: { postId: targetPostId, author: '访客', email: `${MARK}@example.com`, content: '这是一条冒烟评论' },
      }),
      expect: 201,
    }));
    if (guestComment.body?.data?.id) {
      cleanup.push(['delete', `/comments/${guestComment.body.data.id}`, token]);
    }

    await record('POST /public/comments 邮箱非法', async () => ({
      res: await call('POST', '/public/comments', {
        body: { postId: targetPostId, author: '访客', email: 'not-an-email', content: 'x' },
      }),
      expect: 400,
    }));

    await record('GET  /public/posts/:id/comments', async () => ({
      res: await call('GET', `/public/posts/${targetPostId}/comments`),
      expect: 200,
    }));

    // 定时发布字段是否真的能落库（历史上 posts 表根本没有这一列）
    await record('PUT  /posts/:id 写入 publishDate', async () => ({
      res: await call('PUT', `/posts/${targetPostId}`, {
        token,
        body: { status: 'future', publishDate: '2099-01-01T00:00:00.000Z' },
      }),
      expect: 200,
    }));
    await record('PUT  /posts/:id 清空 publishDate', async () => ({
      res: await call('PUT', `/posts/${targetPostId}`, {
        token,
        body: { status: 'draft', publishDate: null },
      }),
      expect: 200,
    }));
  }

  // 8. 备份
  const backupCreated = await record('POST /backups', async () => ({
    res: await call('POST', '/backups', { token }),
    expect: 201,
  }));
  await record('GET  /backups', async () => ({
    res: await call('GET', '/backups', { token }),
    expect: 200,
  }));
  const backupId = backupCreated.body?.data?.id;
  if (backupId) {
    await record('DELETE /backups/:id', async () => ({
      res: await call('DELETE', `/backups/${encodeURIComponent(backupId)}`, { token }),
      expect: 200,
    }));
  }
  await record('DELETE /backups/:id 非法 id', async () => ({
    res: await call('DELETE', '/backups/..%2F..%2Fpackage.json', { token }),
    expect: 404,
  }));

  // 9. 校验失败路径
  await record('POST /posts 缺字段', async () => ({
    res: await call('POST', '/posts', { token, body: { title: '' } }),
    expect: 400,
  }));
  await record('POST /auth/login 错误密码', async () => ({
    res: await call('POST', '/auth/login', { body: { username: ADMIN_USER, password: 'definitely-wrong' } }),
    expect: 401,
  }));

  // 10. 清理，放在最后（用户要在评论等资源之前删掉）
  for (const [method, path, tk] of cleanup) {
    await call(method === 'delete' ? 'DELETE' : 'GET', path, { token: tk });
  }
  await record('DELETE /notifications/clear', async () => ({
    res: await call('DELETE', '/notifications/clear', { token }),
    expect: 200,
  }));

  // ------------------------------------------------------------------ 输出
  printResults();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n合计 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`);

  if (SAVE) {
    saveBaseline();
    console.log(`\n基线已保存 → ${BASELINE_PATH}`);
  } else {
    const diffs = diffAgainstBaseline();
    if (diffs === null) {
      console.log('\n未找到基线文件（先用 --save 生成），跳过契约 diff。');
    } else if (diffs.length === 0) {
      console.log('\n契约 diff：与基线完全一致 ✓');
    } else {
      console.log(`\n契约 diff：发现 ${diffs.length} 处漂移 ✗`);
      for (const d of diffs) console.log(`  - ${d}`);
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n冒烟脚本自身异常:', err);
  process.exit(1);
});