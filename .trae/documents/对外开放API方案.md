# 对外开放整套 API — 实施方案

## Context

现在这个后端只有本站 SPA 能用：路由写死全路径 `/api/xxx`，鉴权只有「JWT 登录用户」一种，
没有任何对外集成的入口。要让它能被外部客户端（Android 端、第三方集成）调用，
需要一套版本化、有独立凭据、有明确权限边界的 API。

**已确认的三个决定**（来自你的选择，不在本方案里重新讨论）：

1. **暴露全量能力** —— 内容、用户管理、站点设置全部开放，不只是只读内容
2. **两种认证都支持** —— API Key（长期密钥）+ 复用现有 JWT 登录
3. **迁移而非并存** —— 旧路径直接 404，不做兼容层
4. **端点合并** —— `/api/public/posts` 与 `/api/posts` 合并成单一契约
5. **新密钥默认只读** —— 写权限、用户管理、备份等高危项必须手动勾选

---

## 先纠正两处我之前说错/漏掉的事

在调研过程中核实到两件事与我在上一轮汇报里说的不符，需要先说明，方案里也会一并处理。

### 1. 密码重置的后端**是存在的**，我说错了

我上一轮说「后端 auth 模块根本没有重置端点」—— **不成立**。三条路由确实存在，
只是不在 auth 模块，而在 [smtp/routes.js](file:///d:/xkx/xkx_appproj/happy_home/backend/src/modules/smtp/routes.js)（因为要发信，当时放进了 SMTP 模块）：

- `POST /api/auth/send-verification-code`（L16）
- `POST /api/auth/verify-code`（L57）
- `POST /api/auth/reset-password`（L90）

而 [ForgotPassword.jsx](file:///d:/xkx/xkx_appproj/happy_home/src/pages/ForgotPassword.jsx)
**完整调用了这三条**（L38 / L90 / L121），三步流程（填邮箱 → 填验证码 → 设新密码）是通的。

真正的问题是另一个：[ResetPassword.jsx](file:///d:/xkx/xkx_appproj/happy_home/src/pages/ResetPassword.jsx)
是**重复且伪造**的一页 —— 它被路由在 `/reset-password`，但只判断「链接里有没有 token」，
提交后直接弹「密码重置成功」并跳登录，不调任何接口。真正能用的流程在 `/forgot-password`。

所以：**我要改的是 README（我上一轮往里写了错误结论），以及删掉这个重复页**，
而不是「补一个不存在的后端端点」。

### 2. 访客态前台有一处 401，导致侧栏部件全空

[DataContext.jsx](file:///d:/xkx/xkx_appproj/happy_home/src/contexts/DataContext.jsx#L85-L103)
的 `loadPublicData` 在**访客未登录**时调用了四个需要 token 的端点
（`pagesAPI.getAll` / `categoriesAPI.getAll` / `tagsAPI.getAll` / `widgetsAPI.getAll`），
`Promise.all` 整体 reject → 被 catch 吞掉 → `posts/pages/categories/tags/widgets` **全部保持空数组**。

[SidebarWidgets.jsx](file:///d:/xkx/xkx_appproj/happy_home/src/components/SidebarWidgets.jsx#L19-L22)
的 widgets 正是从 Context 自取，所以**访客看到的前台侧栏没有任何小工具**。

这次做「匿名可读」时顺带修掉：把 `Promise.all` 换成 `allSettled`（一个失败不该清空全部），
并让这几个端点在匿名下做行级过滤（pages 只 published、widgets 只 enabled、categories 只已用到的）。

---

## 一、路径迁移

统一规则：**所有 `/api/X` → `/api/v1/X`**，三个例外保持不动：

| 保持不动 | 理由 |
|---|---|
| `/api/health` | 存活探针属于基础设施，版本化没有意义，且会打断已有的监控配置 |
| `/feed.xml`、`/sitemap.xml` | 挂在站点根路径，是给爬虫与阅读器的公开约定 |

**实现方式**：把 18 个模块里的 80 处 `router.xxx('/api/…')` 改成**相对路径**
（`/api/posts` → `/posts`），然后在 [server.js](file:///d:/xkx/xkx_appproj/happy_home/backend/server.js)
里按前缀挂载：

```js
app.use('/api/v1', authenticate);            // 版本前缀 + 身份识别，只写这一次
app.use('/api/v1', require('./src/modules/posts/routes')(deps));
app.use('/api/v1', require('./src/modules/revisions/routes')(deps)); // 仍在 posts 之后
// …
app.use('/api/health', require('./src/modules/health/routes')(deps)); // 不版本化
```

好处是版本号只出现在一处，将来要开 `/api/v2` 不必再动 80 个文件。

**前端只需改一行**：[env.js](file:///d:/xkx/xkx_appproj/happy_home/src/lib/env.js#L11)
的 `API_BASE_URL` 默认值 `/api` → `/api/v1`。
（已核实：前端源码里没有任何硬编码的 `/api/...` 真实调用，只有注释；媒体 `url` 是客户端传的
字符串，后端没有静态文件服务，所以迁移不会打断已存的图片地址。）

例外：`healthAPI.check()` 要走不带版本的路径，给 `rawRequest` 加一个 `root: true` 选项跳过前缀。

---

## 二、认证与授权

### `authenticate`（新中间件，替代 `optionalAuth` 的位置）

只做身份识别，**永不直接返回 401/403**，把结果放进 `req.auth`：

| 判定顺序 | 条件 | 结果 |
|---|---|---|
| 1 | `X-API-Key: hhk_…` 或 `Authorization: Bearer hhk_…` | 按前缀查 `api_keys`（未撤销）→ bcrypt 比对 → `req.auth = { type:'key', scopes }` |
| 2 | `Authorization: Bearer <jwt>` | 验签 → `req.auth = { type:'user' }` + `req.user` |
| 3 | 都没有 | `req.auth = { type:'anonymous' }` |

**Key 优先于 JWT**，两者同时出现只看 Key。Key 校验失败**不回退 JWT**（避免「拿错钥匙反而用另一把进门」）。

### `requireAccess(scope, { roles, anonymous })`

取代现有的 `requireRole`，通过条件三选一：

- `type === 'invalid'` → 403（保住现有「验签失败返回 403」的契约）
- `type === 'key'` → `scopes` 含该 scope（或含通配 `admin`），否则 403
- `type === 'user'` → 回查 `users` 表取实时角色，命中 `roles`，否则 403
- `type === 'anonymous'` → 仅当 `anonymous === true`，否则 **401**（「未授权」与「权限不足」要分得清）

### scope 命名（`<资源>:<动作>`）

```
posts:read|write        pages:read|write       categories:read|write
tags:read|write         menus:read|write       widgets:read|write
media:read|write        comments:read|write|moderate
revisions:read|write    notifications:read|write
users:read|write        settings:read|write
analytics:read|write    smtp:write
backups:read|write|restore
apikeys:read|write
admin                    ← 通配，等价于全部
```

### 匿名可读集合（硬编码在 `backend/src/lib/permissions.js`）

`posts:read`（仅 published）、`pages:read`（仅 published）、`categories:read`、`tags:read`、
`menus:read`、`widgets:read`（仅 enabled）、`comments:read`（仅 approved）、
`settings:read`（仅公开白名单）。

**写操作，以及 users / media / backups / smtp / notifications 一律不匿名。**
每个匿名端点必须**显式**写 `anonymous: true`，不做默认放行 —— 默认放行是这类改造最容易出洞的地方。

### 顺带修掉一个既有泄漏

`GET /api/settings` 现在只挂 `authenticateToken`，返回原始 `getSettings()`，
**包含 `smtpPass`** —— 也就是任何登录用户（包括 `author`）都能读到 SMTP 密码。API Key 会踩同一个洞。

改成三分支，形状一致（都是键的子集）：

| 身份 | 返回 |
|---|---|
| 匿名 | `PUBLIC_SETTING_KEYS`（沿用现有白名单） |
| 登录但非 administrator | 全量 **减去** `SENSITIVE_SETTING_KEYS`（至少 `smtpPass`、`smtpUser`、`smtpHost`） |
| administrator | 全量 |

---

## 三、合并端点的行为规格

### `GET /api/v1/posts`

| 身份 | 状态过滤 | 分页 |
|---|---|---|
| 匿名 | 强制 `status='published'` | 默认分页 |
| 有身份 | 可用 `?status=` 筛；不传则全部状态 | 默认分页，或 `?all=1` 取全量（上限 1000） |

- **默认分页模式**：`?page=1&perPage=20`；`perPage` 回退链
  `query.perPage → settings.postsPerPage → 10`，上限 100；
  响应 `{ success, data, count, total, page, perPage, totalPages }`
- **全量模式**：`?all=1`，响应 `{ success, data, count }`（**不含分页字段**，与今天
  `/api/posts` 的形状完全一致）

**刻意不用「有没有传 page」来切换形状** —— 同一个 URL 两种响应形状对外部客户端是契约毒药，
而且 `page=1` 这种无意义参数会改变语义，也没法写进文档。用显式的 `all=1`。

前端配套改动两处：
- [api.js](file:///d:/xkx/xkx_appproj/happy_home/src/services/api.js#L101) 的 `postsAPI.getAll`
  改为 `apiRequest(\`/posts${toQuery({ all: 1, ...params })}\`)` —— 后台列表页与 DataContext 全部无感
- `postsAPI.getPublicAll` 改为默认分页；DataContext 里访客那一路只要已发布，靠行级过滤

### 其余四个合并点

| 端点 | 规格 |
|---|---|
| `GET /api/v1/posts/:id` | 匿名或无 `posts:read` → 强制 `status='published'`，否则 404；有权限 → 任意状态 |
| `GET /api/v1/pages/:idOrSlug` | `WHERE id = ? OR slug = ?`（uuid 与 slug 不会互撞）；匿名加 `status='published'` |
| `GET /api/v1/categories` | **统一返回分类行对象**（今天 public 返回的是 `string[]`，这是唯一的真冲突）；`?usedOnly=1` 复刻旧语义。前端 [PublicPosts.jsx](file:///d:/xkx/xkx_appproj/happy_home/src/pages/public/PublicPosts.jsx) 的下拉要跟着改 |
| `POST /api/v1/comments` | 合并成一个端点：`authenticate` + 匿名走 `checkCommentRate`（键：登录 `user:<id>`，匿名 `ip:<ip>`） |

---

## 四、`api_keys` 表与迁移

追加到 [db.js](file:///d:/xkx/xkx_appproj/happy_home/backend/db.js) 的 `MIGRATIONS` 数组（id: 5），
照现有 `{ id, name, up(db) }` 风格：

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,               -- 备注名，如「Android 客户端」
  key_hash      TEXT NOT NULL,               -- bcrypt，明文不落库
  key_prefix    TEXT NOT NULL,               -- 前 8 位，列表里辨认用
  scopes        TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
  expires_at    TEXT,                        -- 可空
  last_used_at  TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_by    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at    TEXT                         -- 软删
);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
```

- 明文格式 `hhk_<8位前缀>_<32位随机>`，**只在创建响应里返回一次**
- `last_used_at` / `request_count` 做节流写入（同一把 key 60 秒内只写一次），
  否则每个请求都要 `saveDatabase()` 落盘
- 撤销用软删（`revoked_at`），保留审计痕迹

---

## 五、后台「API 密钥」管理页

新增 `src/pages/ApiKeys.jsx`，按现有四件套接线：

1. [paths.js](file:///d:/xkx/xkx_appproj/happy_home/src/routes/paths.js) —— `ADMIN_PATHS.apiKeys` + 在 system 分组加一项 + `Sidebar` 的 `ICONS` 登记图标
2. `src/routes/lazyPages.jsx` —— `wrap(() => import('../pages/ApiKeys'))`
3. `src/routes/router.jsx` —— 加一条路由
4. 新建页面文件

交互：

- **列表**：备注名 / 前缀 / scope（按域分组展示）/ 最后使用时间 / 请求数 / 状态徽标（有效·已撤销·已过期）
- **新建**：scope 按域分组复选，顶部两个预设（「只读全集」= 默认选中 / 「完全访问」需二次确认）；
  高危 scope（`backups:*`、`smtp:write`、`apikeys:*`、`users:write`）勾选时红字说明后果；
  可选有效期
- **创建后**：用一次性横幅展示完整明文 + 「仅此一次，请立即保存」，不提供再次查看
- **行内操作**：撤销 / 轮换（生成新明文、旧 key 立即失效）/ 删除

视觉走语义 token（`bg-surface` / `border-line` / `text-muted` / `bg-accent`），
入场只允许自下而上，文案中文 —— `npm run lint` 里的 `check-tokens.mjs` 会拦住硬编码颜色。

---

## 六、逐路由的中间件改写规则

因为身份识别已经上移到 `app.use('/api/v1', authenticate)`，**各模块路由不再写 `authenticateToken`**。

| 规则 | 适用范围 | 改成 |
|---|---|---|
| A | 只要求「已登录」的约 60 处 | 什么都不加（挂载层已经识别身份） |
| B | `authenticateToken, requireRole('administrator')`（约 10 处：settings PUT、users 全部、backups、smtp） | `requireAccess('<域>:write', { roles: ['administrator'] })` |
| C | 内容域 GET（posts / pages / categories / tags / menus / widgets / media） | `requireAccess('<域>:read', { roles: [...内容角色], anonymous: true })` |

**例外（必须单独处理）**：

1. `notifications/*`（8 处）—— 必须按 `req.user.id` 过滤；API Key 没有对应的用户身份，
   明确拒绝 Key 访问通知
2. `backups/:id/download` —— 现在是「登录即可下载整库」，收紧到 `roles: ['administrator']`
3. `analytics/track` —— 前台浏览量采集要能匿名调，加 IP 限流
4. `auth/*`（9 处）—— 不挂 `requireAccess`；`/api/v1/auth/me` 允许任意登录角色但不允许 Key
5. `revisions` 仍必须挂在 `posts` 之后（现有装配顺序约束）
6. `health` / `feed` / `sitemap` —— 路径不动，不经过 `authenticate`

新增模块 `backend/src/modules/apiKeys/routes.js`：
`GET|POST /api-keys`、`POST /api-keys/:id/revoke`、`POST /api-keys/:id/rotate`、`DELETE /api-keys/:id`，
全部 `requireAccess('apikeys:*', { roles: ['administrator'] })`，**Key 本身不能管理 Key**。

---

## 七、顺带清理

- 删除 `src/pages/ResetPassword.jsx` 及其在 `paths.js` / `lazyPages.jsx` / `router.jsx` 的登记
  （重复且伪造的一页，真正能用的流程在 `/forgot-password`）。删前确认没有站内链接指向 `/reset-password`。
- 修正 README：删掉我上一轮写进去的错误结论（「后端没有重置密码端点」），
  改成「后端端点齐全，但 `/reset-password` 这一页是重复的、已删除」。
- `DataContext.loadPublicData`：`Promise.all` → `allSettled`。

---

## 八、实施批次（每批独立可验证、可回滚）

| 批次 | 内容 | 验证 |
|---|---|---|
| 1 | 纯路径搬迁：80 处改相对路径 + server.js 按前缀挂载 + 前端 `env.js`/`http.js` + smoke 路径 | `npm run smoke` 全绿；前台/后台手工点一遍无回归 |
| 2 | 认证层：`middleware/authenticate.js`、`lib/permissions.js`、`requireAccess`，逐路由替换 | 匿名 401、JWT 行为与旧一致、settings 敏感键过滤生效 |
| 3 | 合并端点：posts / pages / categories / comments / settings 五处 + `all=1` + 前端配套 | 后台列表条数正确、前台分页正确、匿名看不到草稿 |
| 4 | API Key：迁移 id:5 + apiKeys 模块 + 后台页面 | 创建/撤销/轮换、越权 403、匿名越权 401 |
| 5 | 文档与收尾：API_DOC 全量路径重写 + 新增认证/密钥/弃用映射三章 + 旧路径 404 提示 + 上面第七节 | 通读一遍路径无误 |

---

## 九、风险清单

| 风险 | 应对 |
|---|---|
| **API Key 泄露（全量开放的放大效应）** | 新密钥默认只读；高危 scope 勾选时红字提示；Key 不继承管理员角色、永不可达 `/api-keys`；明文只存哈希；`request_count`/`last_used_at` 可视化以便发现异常 |
| 匿名可读集合被写错，意外扩大暴露面 | 集合硬编码为常量；每个匿名端点必须显式 `anonymous: true`，不做默认放行 |
| 合并端点导致后台列表只显示一页 | 后台调用显式带 `all=1`；冒烟里加「后台列表条数 = 库里总数」的断言 |
| 部署环境 `.env` 里已有 `VITE_API_BASE_URL=/api` | 迁移批次里显式改 `.env` / `.env.example`，并在启动日志打印实际 base |
| 已接入旧地址的第三方或监控探针 | 旧路径 404 是刻意行为；404 响应体带 `hint` 字段给出新路径；`/api/health` 不动 |
| smoke 基线大面积变红 | 批次 1 完成后立刻 `npm run smoke:save` 重写基线，**逐条 review diff**，只接受「路径改名 / 新增信封字段 / 新增用例」三类变化。注意 `smoke:save` 会触发 nodemon 重启，存完要等几秒再复跑 |
| 前台访客数据从「全空」变成「有数据」 | 这是修 bug，但要在批次 3 单独验证前台首页，确认只出现已启用部件与已发布页面 |

---

## 十、验证方式

不依赖肉眼看页面（你的规则：不要操作浏览器）。

| 编号 | 手段 | 抓什么 |
|---|---|---|
| V1 | `npm run build` | 前端语法与构建失败 |
| V2 | `npm run lint` | ESLint + token 护栏（0 problems） |
| V3 | `npm run smoke`（后端） | 路径迁移、鉴权矩阵、契约形状 diff |
| V4 | 新增冒烟用例 | 匿名 `/api/v1/posts` 只有 published 且是分页信封；匿名 `?all=1` → 401；匿名与 author 读 settings 都不含 `smtpPass`、管理员含；无 Key 写 → 401；Key 缺 `posts:write` → 403；已撤销 Key → 403；`/api/settings` → 404；`/api/health` → 200 |
| V5 | 一次性脚本（用完即删） | 建 Key → 带 Key 调读接口 → 越权调写接口 → 撤销 → 再调确认 403 |

---

## 关键文件

**后端**
- `backend/server.js` —— 挂载层（版本前缀 + `authenticate`）
- `backend/src/middleware/auth.js` —— 现有 `authenticateToken`/`optionalAuth`/`requireRole`
- `backend/src/middleware/rateLimit.js` —— 现有 `checkCommentRate` 等（普通函数，非中间件）
- `backend/src/lib/permissions.js`（新）—— scope 定义、匿名可读集合、角色映射
- `backend/src/middleware/authenticate.js`（新）
- `backend/src/modules/apiKeys/routes.js`（新）
- `backend/src/modules/*/routes.js` —— 18 个文件、80 处路径与中间件
- `backend/db.js` —— 迁移 id:5
- `backend/scripts/smoke.mjs` + `baseline.json`
- `backend/API_DOC.md`

**前端**
- `src/lib/env.js`、`src/lib/http.js`
- `src/services/api.js`
- `src/contexts/DataContext.jsx`
- `src/pages/public/PublicPosts.jsx`
- `src/pages/ApiKeys.jsx`（新）、`src/routes/{paths.js,lazyPages.jsx,router.jsx}`
