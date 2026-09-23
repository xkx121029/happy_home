// 临时验证脚本：跑一遍修订功能的真实链路，用完即删。
const BASE = process.env.API_BASE || 'http://localhost:3002';

// 用前端真正的那套归一化，才能验到 current 是否被规整
const { normalizeResponse } = await import('../src/services/api.js');

const j = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`非 JSON 响应 (${res.status}): ${text.slice(0, 200)}`);
  }
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await j(res);
  if (!res.ok || payload.success === false) {
    throw new Error(`${method} ${path} → ${res.status} ${payload.message || ''}`);
  }
  return normalizeResponse(payload);
};

const main = async () => {
  const login = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: process.env.ADMIN_PASS || 'WCgKdPS8qar4U2LZlusJ' },
  });
  const token = login.token;
  console.log('登录 ok');

  // 找一篇已有文章
  const list = await call('GET', '/api/posts?limit=1', { token });
  const post = (list.data || [])[0];
  if (!post) throw new Error('库里没有文章，无法测试');
  console.log(`选中文章 #${post.id} ${post.title}`);

  const stamp = Date.now();
  // 改两次正文，每次都应留一份快照
  await call('PUT', `/api/posts/${post.id}`, {
    token,
    body: { title: post.title, content: `<p>版本A ${stamp}</p><p>第二段</p>`, excerpt: 'A' },
  });
  await call('PUT', `/api/posts/${post.id}`, {
    token,
    body: {
      title: post.title,
      content: `<p>版本B ${stamp}</p><p>第二段</p><p>新增第三段</p>`,
      excerpt: 'B',
    },
  });
  console.log('两次保存 ok');

  const revs = await call('GET', `/api/posts/${post.id}/revisions`, { token });
  console.log(`列表：${revs.count} 条`);
  const top = revs.data[0];
  console.log('  首条字段:', Object.keys(top).join(', '));
  if (top.content !== undefined) throw new Error('列表不应带 content');
  console.log(`  首条：title=${top.title} author=${top.author} createdAt=${top.createdAt} contentLength=${top.contentLength}`);

  const detail = await call('GET', `/api/revisions/${top.id}`, { token });
  console.log('详情 ok，含 current:', !!detail.current);
  if (!detail.current) throw new Error('详情应带上 current');
  console.log('  current 字段:', Object.keys(detail.current).join(', '));
  if (detail.current.updatedAt === undefined) throw new Error('current.updatedAt 缺失 —— 前端归一化没生效');
  console.log(`  该版本正文: ${detail.data.content.slice(0, 40)}`);
  console.log(`  当前正文  : ${detail.current.content.slice(0, 40)}`);

  // 回滚到「版本A」，应当把当前版本（版本B）先留档
  const beforeCount = revs.count;
  const restored = await call('POST', `/api/revisions/${top.id}/restore`, { token });
  console.log(`回滚 ok，标题=${restored.data.title} 正文=${restored.data.content.slice(0, 40)}`);

  const after = await call('GET', `/api/posts/${post.id}/revisions`, { token });
  console.log(`回滚后修订数：${beforeCount} → ${after.count}（应 +1，因为回滚前也留档）`);
  if (after.count !== beforeCount + 1) throw new Error('回滚前应自动留档');

  // 删掉刚回滚时留下的那条，确认删除端点可用
  const victim = after.data[0];
  await call('DELETE', `/api/revisions/${victim.id}`, { token });
  const final = await call('GET', `/api/posts/${post.id}/revisions`, { token });
  console.log(`删除后修订数：${final.count}`);
  if (final.count !== after.count - 1) throw new Error('删除端点没生效');

  console.log('\n全部通过');
  process.exit(0);
};

main().catch((err) => {
  console.error('失败：', err.message);
  process.exit(1);
});
