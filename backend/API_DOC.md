# HappyHome 开放 API 文档

HappyHome 的后端从「只给本站 SPA 用」改造成了对外开放的 API：同样的端点，
外部客户端（Android 端、第三方集成）带上 **API 密钥** 就能调用。

本文档按「调用方需要知道什么」组织：先讲清认证与授权怎么用，再列端点，
最后是版本策略与迁移映射。

---

## 一、基础信息

| 项 | 值 |
|---|---|
| 基址 | `http://localhost:3002/api/v1` |
| 响应格式 | JSON |
| 认证 | `X-API-Key: hhk_…` 或 `Authorization: Bearer <JWT>` |
| 版本前缀 | 写在服务端 `server.js` 一处，业务端点全部在 `/api/v1` 下 |

**刻意不版本化的三个地址**（它们不属于业务 API）：

| 地址 | 用途 |
|---|---|
| `GET /api/health` | 存活探针。版本化会打断已有监控配置 |
| `GET /feed.xml` | RSS 2.0 订阅源，给阅读器与爬虫 |
| `GET /sitemap.xml` | 站点地图，给搜索引擎 |

### 响应信封

成功：

```json
{ "success": true, "data": { ... } }
```

失败（形状固定，只有 `message`，个别情况多一个 `hint`）：

```json
{ "success": false, "message": "错误信息" }
```

> 列表类端点在 `data` 之外还会带 `count`；分页模式另外带
> `total` / `page` / `perPage` / `totalPages`。

### 字段命名：一律 snake_case

**资源对象直接是数据库原始行，字段名是 `snake_case`** ——
`created_at`、`updated_at`、`post_id`、`parent_id`、`order_num`、`key_prefix` …
调用方请按这个写解析代码。

唯一的例外是**站点设置**（`/settings`）：它是键值表，键名本来就是
`siteName`、`postsPerPage` 这种 camelCase，原样返回。

有几处值的类型要留意：

| 字段 | 实际情况 |
|---|---|
| `posts.sticky` | **整数 `0` / `1`**，不是布尔 |
| `widgets.enabled` | 真正的布尔 `true` / `false` |
| `menus.items` / `widgets.config` | 已解析好的数组 / 对象，不是 JSON 字符串 |

> 本站的 SPA 在前端做了一层 camelCase 归一，所以它的代码里读的是
> `post.createdAt`。**那层转换只存在于 SPA 内部**，外部客户端拿到的
> 是上面这些 snake_case 字段名，不要照抄 SPA 的字段名。

### 请求体是 camelCase，响应是 snake_case

这一点容易踩：**读回来的字段是 `created_at`，写进去的字段却是 `publishDate`。**

| | 命名 |
|---|---|
| 请求体（POST / PUT 的 JSON） | 多数是 camelCase：`publishDate`、`postId`、`parentId`、`expiresAt` |
| 响应体（`data` 里的资源） | 一律 snake_case：`publish_date`、`post_id`、`parent_id`、`expires_at` |

少数请求体字段本来就是 snake 的（如小工具的 `order_num`）——
请求体的字段名就是后端从 `req.body` 解构出来的那几个名字，改造前后没动过
（动了会让站内 SPA 一起坏）。以各端点的请求体示例为准。

---

## 二、认证与授权

这是本套 API 最需要先理解的部分：**「你是谁」与「你能做什么」是两件事**。

服务端用两个中间件把它们拆开：

- `authenticate` —— 只做**身份识别**，永不直接拒绝。识别结果有三类：
  匿名 / JWT 用户 / API Key。
- `requireAccess(scope, { roles, anonymous })` —— 做**授权**，
  是唯一会返回 401/403 的地方。

好处是同一个端点可以同时面对三种调用方，而不必在每个路由里重写三分支判断。

### 2.1 三种身份

| 身份 | 凭据 | 授权依据 | 能看到什么 |
|---|---|---|---|
| 匿名 | 无 | 一张很短的只读白名单 | 只有已发布内容 |
| 登录用户 | JWT | 角色（role） | 按角色 |
| API Key | `hhk_…` | scope 列表 | 按密钥被授予的权限 |

**授权来源会落在 `req.auth.level` 上**，这是一条重要约定：

- `full` —— 角色或密钥命中，可以看到全部数据
- `public` —— 走的是匿名白名单，处理函数**必须自己做行级过滤**
  （例如文章端点强制 `status = 'published'`）

### 2.2 API Key 认证

在请求头里二选一：

```
X-API-Key: hhk_a1b2c3d4_9f8e7d6c5b4a39281706f5e4d3c2b1a0
```

```
Authorization: Bearer hhk_a1b2c3d4_9f8e7d6c5b4a39281706f5e4d3c2b1a0
```

> 前缀 `hhk_` 是用来与 JWT 区分的 —— 两者都走 `Authorization: Bearer`，
> 没有这个标记就没法判断该按密钥查库还是该验签。

校验流程：按 8 位前缀索引查 `api_keys`（未撤销）→ bcrypt 比对哈希 →
检查有效期。

**几条硬性约束：**

1. **密钥优先于 JWT，且失败不回退。** 两者同时出现时只看密钥；
   密钥无效就直接 403，不会「悄悄改用 JWT 放行」。
   否则「拿错钥匙」会静默变成「用另一把钥匙进门」，出问题时无从排查。
2. **密钥不能管理密钥。** `/api-keys/*` 一律要求 `administrator` 角色，
   而密钥的 `req.user.role` 固定为 `'api'`，命中不了任何按角色授权的路由。
3. **密钥进不了通知端点。** `notifications/*` 全部声明了 `allowKey: false` ——
   通知是按用户隔离的，密钥没有对应的用户身份，放它进去只能看到创建者的通知，
   语义上就是错的。所以 scope 目录里也刻意没有 `notifications:*`。
4. **明文只出现一次。** 库里存的是 bcrypt 哈希，只有创建与轮换的响应里
   带明文。之后任何端点都取不回来。

### 2.3 JWT 认证

```
Authorization: Bearer <token>
```

登录成功后拿到。注意带 `hhk_` 前缀的 token 会被当作 API 密钥处理。

### 2.4 角色

| 角色 | 权限 |
|---|---|
| `administrator` | 全部 |
| `editor` | 内容域读写（文章、页面、分类、标签、菜单、小工具、媒体、评论审核） |
| `author` | 同上（内容域读写） |
| `contributor` / `subscriber` | 只能调 `ROLE_ANY` 的端点（评论、通知、自身信息） |

**已登录但角色不够时不返回 403，而是退到匿名待遇** —— 例如 subscriber 读文章列表，
他能看到的不会比访客更多，直接拒掉反而多余。

### 2.5 Scope 目录

密钥的权限标签。`GET /api-keys/scopes` 会返回完整目录（后台新建密钥页
直接按它渲染复选框，所以这份目录既是白名单也是界面数据源）。

**内容**

| scope | 说明 |
|---|---|
| `posts:read` / `posts:write` | 读取 / 创建·修改·删除文章 |
| `pages:read` / `pages:write` | 读取 / 管理页面 |
| `categories:read` / `categories:write` | 读取 / 管理分类 |
| `tags:read` / `tags:write` | 读取 / 管理标签 |
| `media:read` / `media:write` | 读取 / 上传·删除媒体 |
| `revisions:read` / `revisions:write` | 读取 / 回滚·删除修订 |

**站点结构**

| scope | 说明 |
|---|---|
| `menus:read` / `menus:write` | 读取 / 管理菜单 |
| `widgets:read` / `widgets:write` | 读取 / 管理小工具 |

**互动**

| scope | 说明 |
|---|---|
| `comments:read` | 读取评论 |
| `comments:write` | 发表评论 |
| `comments:moderate` | 审核 / 删除评论 |
| `analytics:read` | 读取统计数据 |
| `analytics:write` | 上报访问量 |

**系统（高危）**

| scope | 说明 |
|---|---|
| `users:read` / `users:write` | 读取 / 创建·修改·删除用户 |
| `settings:read` / `settings:write` | 读取 / 修改站点设置 |
| `smtp:write` | 测试 / 刷新 SMTP 配置 |
| `backups:read` / `backups:write` / `backups:restore` | 下载 / 创建·删除 / 从备份恢复 |
| `apikeys:read` / `apikeys:write` | 读取 / 创建·撤销密钥 |

另外有一个通配 scope **`admin`**，等价于全部权限。授予它需要二次确认。

**默认只读。** 新建密钥默认勾选「只读全集」（所有 `*:read`），
写权限与高危项需要有人主动勾选 —— 密钥是长期凭据，泄露的代价与它的权限成正比，
而绝大多数外部集成本来就只需要读。

---

## 三、API 密钥管理

> 全部要求管理员，且密钥本身不能调用（见 2.2）。

### 3.1 列出密钥

```
GET /api/v1/api-keys
```

响应不含 `key_hash`，也不会返回明文：

```json
{
  "success": true,
  "data": [
    {
      "id": "412fbe5f-75b3-4a97-80bb-c6e3610642e1",
      "name": "Android 客户端",
      "key_prefix": "4359f087",
      "scopes": ["posts:read", "categories:read"],
      "expires_at": null,
      "last_used_at": "2026-09-24 03:12:00",
      "request_count": 128,
      "created_by": "a47b6187-449f-49bd-a470-427c41ff3556",
      "created_at": "2026-09-24 02:00:00",
      "revoked_at": null
    }
  ],
  "count": 1
}
```

注意 `scopes` 是**已解析的数组**（库里存的是 JSON 字符串），
而其余字段是原始列名。`request_count` 与 `last_used_at` 有 60 秒写回节流 ——
否则每个请求都要落盘一次。

### 3.2 创建密钥

```
POST /api/v1/api-keys
```

```json
{
  "name": "Android 客户端",
  "scopes": ["posts:read", "categories:read"],
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | ✅ | 备注名，最长 100 字符 |
| `scopes` | ✅ | 至少一项，不认识的标签会被过滤掉 |
| `expiresAt` | | 留空表示永不过期；必须晚于当前时间 |

**创建成功后明文只返回这一次：**

```json
{
  "success": true,
  "message": "密钥创建成功，请立即保存明文，此后再无法查看",
  "data": {
    "id": "412fbe5f-…",
    "name": "Android 客户端",
    "key_prefix": "4359f087",
    "scopes": ["posts:read"],
    "expires_at": null,
    "last_used_at": null,
    "request_count": 0,
    "created_by": "a47b6187-…",
    "created_at": "2026-09-24 12:42:02",
    "revoked_at": null,
    "key": "hhk_4359f087_12472d1d0901fcd951d66b618b427d11"
  }
}
```

`data.key` 只在创建与轮换的响应里出现。**其余任何端点都不会返回它。**

### 3.3 轮换

```
POST /api/v1/api-keys/:id/rotate
```

生成新的前缀与明文，旧明文**立即失效**（不需要额外的失效名单，因为哈希被替换了）。
`requestCount` 与 `lastUsedAt` 会一起清零。响应里同样带一次性明文。

### 3.4 撤销

```
POST /api/v1/api-keys/:id/revoke
```

软删：写 `revokedAt`，保留审计痕迹。已撤销的密钥无法轮换。

### 3.5 删除

```
DELETE /api/v1/api-keys/:id
```

真删，连同使用记录一起消失。**只想停用请用撤销。**

### 3.6 scope 目录

```
GET /api/v1/api-keys/scopes
```

```json
{
  "success": true,
  "data": {
    "groups": [
      { "id": "content", "label": "内容", "scopes": [{ "id": "posts:read", "label": "读取文章" }] },
      { "id": "system", "label": "系统（高危）", "highRisk": true, "scopes": [] }
    ],
    "defaults": ["posts:read", "pages:read", "..."],
    "highRisk": ["users:write", "settings:write", "smtp:write", "..."],
    "wildcard": "admin"
  }
}
```

---

## 四、端点清单

下述路径全部省略基址 `/api/v1`。

「认证」列的含义：**匿名** = 无需凭据；**已知** = 需凭据；
括号里是该端点要求的 scope / 角色。

### 4.1 认证

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/auth/login` | 匿名 | 登录，返回 JWT |
| POST | `/auth/register` | 匿名 | 注册（受设置里的注册开关控制） |
| POST | `/auth/send-register-code` | 匿名 | 发送注册验证码 |
| POST | `/auth/verify` | 匿名 | 校验注册验证码 |
| POST | `/auth/resend-verification` | 匿名 | 重发验证邮件 |
| GET | `/auth/me` | 已知 | 当前用户（`users:read`，**不接受密钥**） |

> `auth/*` 不挂 `requireAccess` 的角色限制 —— 登录注册本来就该匿名可调。
> 但 `/auth/me` 是按用户取信息，密钥没有用户身份，所以 `allowKey: false`。

**登录请求 / 响应：**

```json
{ "username": "admin", "password": "…" }
```

```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOi…",
  "user": { "id": "…", "username": "admin", "email": "…", "role": "administrator", "status": "active" }
}
```

> `username` 字段同时接受用户名与邮箱。

### 4.2 密码重置

三步：发验证码 → 校验 → 改密码。

| 方法 | 路径 | 认证 |
|---|---|---|
| POST | `/auth/send-verification-code` | 匿名 |
| POST | `/auth/verify-code` | 匿名 |
| POST | `/auth/reset-password` | 匿名 |

### 4.3 文章

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/posts` | 匿名可读（`posts:read`） |
| GET | `/posts/:id` | 匿名可读（`posts:read`） |
| POST | `/posts` | 内容角色 / `posts:write` |
| PUT | `/posts/:id` | 内容角色 / `posts:write` |
| DELETE | `/posts/:id` | 内容角色 / `posts:write` |
| GET | `/posts/:id/comments` | 匿名 |

**`GET /posts` 有两种模式，由参数显式切换：**

| 参数 | 说明 |
|---|---|
| `page`, `perPage` | 分页模式（默认）。`perPage` 上限 100 |
| `all=1` | 全量模式，供后台列表页使用。**要求非匿名身份**，否则 403 |
| `search` | 关键词 |
| `category` | 按分类过滤 |
| `status` | 状态过滤（`published` / `draft` / `future`） |

分页模式响应：

```json
{ "success": true, "data": [], "count": 10, "total": 137, "page": 1, "perPage": 20, "totalPages": 7 }
```

全量模式响应（形状与改造前一致，供后台列表页消费）：

```json
{ "success": true, "data": [], "count": 137 }
```

> **为什么用显式 `?all=1` 而不是「不传 page 就不分页」**：
> 同一个 URL 出现两种响应形状会让契约没法写文档，也让客户端没法预期。
> 显式参数虽然多一个字符，但形状是确定的。
>
> 全量模式有 1000 条的硬上限（`ALL_POSTS_LIMIT`），不是「真的全量」。

**匿名调用的过滤规则：**

- `GET /posts` 强制 `status = 'published'`，并且会**忽略传入的 `?status`**
  —— 否则任何人都能用 `?status=draft` 把草稿列出来。
- `GET /posts/:id` 对未发布文章返回 **404 而不是 403**，避免通过状态码
  探测出「存在一篇草稿」这件事。

**创建 / 更新请求体：**

```json
{
  "title": "文章标题",
  "content": "<p>正文 HTML</p>",
  "excerpt": "摘要",
  "category": "分类名",
  "status": "published",
  "tags": ["标签1"],
  "author": "作者名",
  "sticky": false,
  "publishDate": "2026-10-01T02:00:00.000Z"
}
```

> `PUT` 支持部分更新，只传要改的字段。`publishDate` 一律存 UTC ISO ——
> 历史上存的是没有时区的墙上时间，被当成 UTC 解析，
> `Asia/Shanghai` 下定时发布会提前 8 小时触发。

**修订快照**由后端在保存文章时自动写入（只在标题/正文/摘要真的变了时才记），
客户端不需要（也不能）手动创建修订。

### 4.4 修订

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/posts/:id/revisions` | `revisions:read` |
| GET | `/revisions/:id` | `revisions:read` |
| POST | `/revisions/:id/restore` | `revisions:write` |
| DELETE | `/revisions/:id` | `revisions:write` |

修订列表**刻意不返回 `content`**：一篇文章可能存了几十个版本，
每个版本带上完整正文会让响应膨胀到几百 KB，而列表根本用不到。
只给 `content_length` 让界面能显示「这一版改了多少」。

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "post_id": "string",
      "title": "string",
      "excerpt": "string",
      "author": "string",
      "created_at": "string",
      "content_length": 1024
    }
  ],
  "count": 3
}
```

修订详情会一并带上当前版本（是完整的 post 行），对比视图不必再发一次请求：

```json
{
  "success": true,
  "data":    { "id": "…", "post_id": "…", "content": "<p>改之前的正文</p>" },
  "current": { "id": "…", "content": "<p>现在的正文</p>", "status": "published" }
}
```

回滚会把标题、正文、摘要覆盖回该版本。**回滚前会先把当前版本留一份快照** ——
否则「回滚」这个动作本身不可撤销，点错一次就再也回不到刚才的样子。

> `revisions` 模块在路由装配顺序上必须排在 `posts` 之后：
> `/posts/:id/revisions` 与 `/posts/:id` 前缀相同，顺序反了会被前面的路由先匹配走。

### 4.5 页面

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/pages` | 匿名可读（`pages:read`） |
| GET | `/pages/:id` | 匿名可读（`pages:read`） |
| POST | `/pages` | 内容角色 / `pages:write` |
| PUT | `/pages/:id` | 内容角色 / `pages:write` |
| DELETE | `/pages/:id` | 内容角色 / `pages:write` |

**`GET /pages/:id` 的 `:id` 同时接受 id 与 slug** —— 路径段名叫 `:id`
只是因为合并前 `/pages/:id` 与 `/public/pages/:slug` 是两条路径，
合并后没必要再分成两个端点。匿名调用同样只返回已发布页面。

### 4.6 分类与标签

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/categories` | 匿名可读（`categories:read`） |
| GET | `/categories?usedOnly=1` | 同上，只返回已被**已发布**文章用到的分类 |
| POST/PUT/DELETE | `/categories`、`/categories/:id` | 内容角色 / `categories:write` |
| GET | `/tags` | 匿名可读（`tags:read`） |
| POST/PUT/DELETE | `/tags`、`/tags/:id` | 内容角色 / `tags:write` |

> `GET /categories` **统一返回分类行对象**。合并前这个端点在匿名下返回的是
> 分类名字符串数组 —— 同一个路径两种形状没法写文档，已统一。

### 4.7 评论

| 方法 | 路径 | 认证 |
|---|---|---|
| POST | `/comments` | 匿名可提交（`comments:write`），按身份限流 |
| GET | `/comments` | 已知（`comments:read`）—— 后台列表，含待审核 |
| GET | `/posts/:id/comments` | 匿名，只返回已审核 |
| GET | `/comments/recent` | 匿名，已发布文章下的已审核评论 |
| PUT | `/comments/:id/status` | 内容角色（`comments:moderate`） |
| DELETE | `/comments/:id` | 内容角色（`comments:moderate`） |

**提交评论：**

```json
{
  "postId": "uuid",
  "parentId": null,
  "author": "昵称",
  "email": "you@example.com",
  "content": "评论内容"
}
```

校验与限制：

| 规则 | 值 |
|---|---|
| 邮箱格式 | 必须合法 |
| 昵称长度 | ≤ 50 字符 |
| 内容长度 | ≤ 5000 字符 |
| 文章必须存在 | 否则 404（匿名时也是 404，不泄露草稿是否存在） |
| 是否需审核 | 由设置 `commentsModeration` 决定，默认需审核 |
| 评论总开关 | 设置 `enableComments` 为 `false` 时返回 403 |

**限流按身份分流**：登录用户按账号计数（`user:<id>`），
匿名按 IP 与邮箱两个维度（`ip:…` + `email:…`）。超限返回 **429**。
公开写接口没有限流等于开放刷库通道，所以限流与端点必须同时存在。

> `GET /posts/:id/comments` 只选子集列（不含 `email`）——
> 邮箱不该出现在任何公开响应里。`GET /comments/recent` 会 join 文章表，
> 只取已发布文章下的评论，避免把草稿标题泄露出去。

### 4.8 菜单与小工具

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/menus` | 匿名可读（`menus:read`） |
| POST/PUT/DELETE | `/menus`、`/menus/:id` | 内容角色 / `menus:write` |
| GET | `/widgets` | 匿名可读（`widgets:read`），只返回 `enabled = 1` 的 |
| POST/PUT/DELETE | `/widgets`、`/widgets/:id` | 内容角色 / `widgets:write` |

> 菜单项的增删改与拖拽排序**后端还没有对应端点**，后台里的相关按钮
> 点下去只会提示「暂未实现」。

### 4.9 媒体

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/media` | 内容角色 / `media:read` |
| POST | `/media` | 内容角色 / `media:write` |
| DELETE | `/media/:id` | 内容角色 / `media:write` |

### 4.10 用户

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/users` | **管理员**（`users:read`） |
| GET | `/users/:id` | 任意登录角色（`users:read`） |
| POST | `/users` | **管理员**（`users:write`） |
| PUT | `/users/:id` | **管理员**（`users:write`） |
| DELETE | `/users/:id` | **管理员**（`users:write`） |

### 4.11 站点设置

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/settings` | 匿名可读（`settings:read`），**按身份裁剪** |
| PUT | `/settings` | **管理员**（`settings:write`） |

`GET /settings` 返回的键按身份分三档：

| 调用方 | 返回内容 |
|---|---|
| 匿名 / 角色不够 | 前台白名单（站点名、描述、主题、自定义 CSS/JS、每页条数…） |
| 管理员 | 全量 |
| 其余登录用户 | 全量**剔除 SMTP 凭据** |

**SMTP 凭据（`smtpHost` / `smtpUser` / `smtpPass`）只有管理员能读到。**
改造前这个端点只要求「已登录」，author 角色就能读到 `smtpPass` ——
那三个键拼起来就是一台可用的发信机，泄露即可被拿去发钓鱼邮件。

### 4.12 通知

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/notifications` | 任意登录角色，**不接受密钥** |
| GET | `/notifications/unread` | 同上 |
| GET | `/notifications/count` | 同上 |
| PUT | `/notifications/:id/read` | 同上 |
| PUT | `/notifications/read-all` | 同上 |
| DELETE | `/notifications/:id` | 同上 |
| DELETE | `/notifications/clear` | 同上 |
| POST | `/notifications/demo` | 同上（造一条演示通知） |

### 4.13 统计

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/analytics/stats` | 任意登录角色（`analytics:read`） |
| POST | `/analytics/track` | 匿名（`analytics:write`），按 IP 限流 |

> `analytics/track` 是唯一一个匿名可写的端点。它当前只把请求体写进日志，
> 但仍加了 IP 限流 —— 不限流的话任何人都能靠它把日志刷爆、把磁盘写满。
> `analytics/stats` 目前返回的是演示数据（随机数）。

### 4.14 SMTP

| 方法 | 路径 | 认证 |
|---|---|---|
| POST | `/smtp/test` | **管理员**（`smtp:write`） |
| POST | `/smtp/refresh` | **管理员**（`smtp:write`） |

### 4.15 备份

| 方法 | 路径 | 认证 |
|---|---|---|
| GET | `/backups` | **管理员**（`backups:read`） |
| POST | `/backups` | **管理员**（`backups:write`） |
| GET | `/backups/:id/download` | **管理员**（`backups:read`） |
| DELETE | `/backups/:id` | **管理员**（`backups:write`） |
| POST | `/backups/:id/restore` | **管理员**（`backups:restore`） |

> 备份以**文件系统为唯一真源**（`backend/backups/`），不写进数据库的 backups 表 ——
> 备份的意义就是在数据库本身损坏时还能救回来，把它存进同一个库是自我循环。
>
> `:id` 是文件名，服务端用白名单正则挡住 `../` 之类的路径穿越。
>
> `restore` 会先把当前状态存一份（`-auto.db`），误操作还有回头路。

### 4.16 密钥管理

见第三章。

### 4.17 探针与订阅源

| 方法 | 路径 | 版本化 | 认证 |
|---|---|---|---|
| GET | `/api/health` | ❌ | 匿名 |
| GET | `/feed.xml` | ❌ | 匿名 |
| GET | `/sitemap.xml` | ❌ | 匿名 |

---

## 五、版本策略与弃用映射

### 5.1 版本化规则

- 业务端点全部在 **`/api/v1`** 下。
- 版本号只出现在 `server.js` 的 `API_PREFIX` 一处 ——
  各模块的路由声明写的是相对路径（`/posts`、`/pages/:id`），
  将来要开 `/api/v2` 不必再动十几个模块文件。
- 三个不版本化的例外见第一章的表。

### 5.2 弃用映射

迁移前的地址**已全部 404**，不提供兼容层。旧地址的调用方会收到一条带
`hint` 的 404，指明新路径：

```json
{
  "success": false,
  "message": "接口不存在",
  "hint": "公开端点已并入对应资源路径，请改用 /api/v1/posts、/api/v1/pages 等；匿名调用同一个端点只会读到已发布内容。"
}
```

| 迁移前 | 现在 | 备注 |
|---|---|---|
| `GET /api/posts` | `GET /api/v1/posts` | |
| `GET /api/posts?all=1` | 后台列表用 | 原来「不传 page 即全量」的隐式行为已改成显式参数 |
| `GET /api/public/posts` | `GET /api/v1/posts` | 合并，匿名只读已发布 |
| `GET /api/public/posts?page=1` | `GET /api/v1/posts?page=1` | 分页从公开端点搬到这里 |
| `GET /api/public/posts/:id` | `GET /api/v1/posts/:id` | |
| `GET /api/public/pages` | `GET /api/v1/pages` | |
| `GET /api/public/pages/:slug` | `GET /api/v1/pages/:id` | 同一个端点接受 id 与 slug |
| `GET /api/public/settings` | `GET /api/v1/settings` | 按身份裁剪返回的键 |
| `GET /api/public/categories` | `GET /api/v1/categories?usedOnly=1` | 返回值从字符串数组统一为行对象 |
| `POST /api/public/comments` | `POST /api/v1/comments` | 保留更严的那套校验 |
| `GET /api/public/posts/:id/comments` | `GET /api/v1/posts/:id/comments` | |
| `GET /api/public/comments/recent` | `GET /api/v1/comments/recent` | |
| 其余 `/api/xxx` | `/api/v1/xxx` | 统一加版本前缀 |

### 5.3 旧地址的 404 是刻意的

不做兼容层是个明确的取舍：**并存期间「两套路径都要维护、都要写文档、
都要跑冒烟」的成本会一直付下去**，而收益只是让调用方晚几天改代码。
旧地址直接 404 加上 `hint`，能在一次请求内让调用方明白该改什么。

---

## 六、错误码

| 状态码 | 含义 | 典型场景 |
|---|---|---|
| 400 | 请求参数错误 | 缺少必填字段、邮箱格式不对、有效期早于当前时间 |
| 401 | 未授权访问 | 匿名调用需要凭据的端点 |
| 403 | 权限不足 / 凭据无效 | 密钥缺 scope、角色不够、无效令牌、密钥被撤销或过期 |
| 404 | 资源不存在 | 含「匿名访问未发布内容」与「旧路径已迁移」两种情况 |
| 429 | 请求过于频繁 | 评论提交与访问上报的限流 |
| 500 | 服务器错误 | |

> **无效凭据返回 403 而不是 401**，这是改造前就有的行为，为兼容保留。
> 401 表示「你什么都没带」，403 表示「你带的东西不行或不够」。

---

## 七、快速开始

### 7.1 用 JWT（站内 / 自用脚本）

```bash
# 登录
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<你的管理员口令>"}'

# 带 token 访问
curl http://localhost:3002/api/v1/posts \
  -H "Authorization: Bearer <your_token>"
```

### 7.2 用 API 密钥（外部客户端）

先在后台「系统 → API 密钥」建一把：

1. 填备注名（例如「Android 客户端」）
2. 权限保持默认的「只读全集」，或按需勾选
3. 创建后**立刻保存明文**，关掉页面就再也看不到了

```bash
# 只读密钥读已发布文章
curl http://localhost:3002/api/v1/posts \
  -H "X-API-Key: hhk_a1b2c3d4_9f8e7d6c5b4a39281706f5e4d3c2b1a0"

# 读站点设置（匿名拿前台白名单，密钥按 scope 拿）
curl http://localhost:3002/api/v1/settings \
  -H "X-API-Key: hhk_…"
```

---

## 八、Android 端集成参考

### Retrofit

```kotlin
interface HappyHomeApi {
    // 密钥认证：把 X-API-Key 做成 OkHttp 拦截器统一注入
    @GET("api/v1/posts")
    suspend fun getPosts(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<PaginatedResponse<Post>>

    @GET("api/v1/posts/{id}")
    suspend fun getPost(@Path("id") id: String): Response<SingleResponse<Post>>

    @GET("api/v1/pages/{idOrSlug}")
    suspend fun getPage(@Path("idOrSlug") idOrSlug: String): Response<SingleResponse<Page>>

    @POST("api/v1/comments")
    suspend fun postComment(@Body request: CommentRequest): Response<SingleResponse<Comment>>
}
```

### 密钥拦截器

```kotlin
class ApiKeyInterceptor(private val apiKey: String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
            .newBuilder()
            .addHeader("X-API-Key", apiKey)
            .build()
        return chain.proceed(request)
    }
}
```

> 自用客户端建议用 API 密钥而不是内嵌 JWT：密钥可以随时撤销、能限制权限范围、
> 还能单独轮换，而 JWT 一旦泄露只能等它过期。

### 响应模型

字段名是 snake_case，所以要用 `@SerializedName` 映射成 Kotlin 的命名习惯：

```kotlin
data class PaginatedResponse<T>(
    val success: Boolean,
    val data: List<T>,
    val count: Int,
    // 信封字段本来就是 camelCase，不需要 @SerializedName
    val total: Int? = null,
    val page: Int? = null,
    val perPage: Int? = null,
    val totalPages: Int? = null
)

data class SingleResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T
)

data class Post(
    val id: String,
    val title: String,
    val content: String,
    val excerpt: String?,
    val category: String?,
    val status: String,
    val author: String,
    val sticky: Int,          // 0 / 1，不是布尔
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("publish_date") val publishDate: String? = null
)

// 请求体是 camelCase，与响应不同（见第一章说明）
data class CommentRequest(
    val postId: String,
    val author: String,
    val email: String,
    val content: String,
    val parentId: String? = null
)
```

> 分页模式的信封里 `perPage` / `totalPages` 确实是 camelCase ——
> 信封字段（`success` / `count` / `total` / `page` / `perPage` / `totalPages`）
> 是处理函数手写的，资源对象才是数据库行。这两套命名在同一个响应里共存。

---

## 九、数据模型

> 字段名一律 snake_case（原始列名），见第一章「字段命名」。
> 下列形状由冒烟测试的形状比对守着，字段消失或改名会被立刻发现。

### Post

```json
{
  "id": "string",
  "title": "string",
  "content": "string (HTML)",
  "excerpt": "string",
  "category": "string",
  "status": "published | draft | future",
  "author": "string",
  "sticky": 0,
  "created_at": "YYYY-MM-DD HH:MM:SS",
  "updated_at": "YYYY-MM-DD HH:MM:SS",
  "publish_date": "UTC ISO8601 | null（仅 status=future 时有值）"
}
```

### Page

```json
{
  "id": "string",
  "title": "string",
  "content": "string (HTML)",
  "slug": "string",
  "status": "published | draft",
  "author": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

### Comment

```json
{
  "id": "string",
  "post_id": "string",
  "author": "string",
  "email": "string（仅后台列表与提交响应返回，公开读接口不含）",
  "content": "string",
  "status": "approved | pending | spam",
  "parent_id": "string | null",
  "created_at": "string",
  "updated_at": "string"
}
```

### Category

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "parent": "string | null",
  "count": 0,
  "created_at": "string"
}
```

### Menu

```json
{
  "id": "string",
  "title": "string",
  "location": "string",
  "items": "array（已解析）",
  "created_at": "string",
  "updated_at": "string"
}
```

### Widget

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "location": "string",
  "order_num": 1,
  "enabled": true,
  "config": "object（已解析）",
  "created_at": "string"
}
```

### Media

```json
{
  "id": "string",
  "name": "string",
  "url": "string",
  "size": "string",
  "type": "string",
  "uploaded_at": "string"
}
```

### Revision

```json
{
  "id": "string",
  "post_id": "string",
  "title": "string",
  "content": "string (HTML，仅详情接口返回)",
  "excerpt": "string",
  "author": "string",
  "created_at": "string"
}
```

列表接口还会额外带 `content_length`（正文长度），详情接口带 `content`。

### User

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "administrator | editor | author | contributor | subscriber",
  "status": "active | pending | disabled",
  "created_at": "string",
  "updated_at": "string"
}
```

### ApiKey

```json
{
  "id": "string",
  "name": "string",
  "key_prefix": "string（8 位）",
  "key": "string（仅创建/轮换响应里出现一次）",
  "scopes": ["string"],
  "expires_at": "string | null",
  "last_used_at": "string | null",
  "request_count": 0,
  "created_by": "string | null",
  "created_at": "string",
  "revoked_at": "string | null"
}
```

### Settings

键值对，键名是 camelCase（与资源对象的 snake_case 不同）：

```json
{
  "siteName": "HappyHome",
  "siteDescription": "…",
  "siteUrl": "http://localhost:3000",
  "timezone": "Asia/Shanghai",
  "language": "zh-CN",
  "postsPerPage": 10,
  "commentsModeration": true,
  "registrationEnabled": true,
  "customCSS": "",
  "customJS": "",
  "headCode": "",
  "footerCode": "",
  "theme": { "presetId": "sage-pine", "neutral": "sage", "accent": "#2F6B4F" },
  "smtpHost": "（仅管理员可见）",
  "smtpUser": "（仅管理员可见）",
  "smtpPass": "（仅管理员可见）"
}
```

---

## 十、契约测试

后端有一套冒烟测试兼契约门禁，改动端点后必须跑通：

```bash
cd backend
npm run smoke           # 运行并与 baseline.json 做形状 diff
npm run smoke:save      # 把当前响应存为新基线（需逐条 review diff）
```

它校验三件事：状态码断言、响应形状（字段消失 / 改名 / 类型变化都会被抓住）、
以及权限边界（只读密钥越权要 403、轮换后旧明文立即失效、密钥不能管理密钥、
匿名读设置越出白名单、editor 不得看到 SMTP 凭据）。

> 访客评论限流（429）不在冒烟里覆盖：验证它必须把当前 IP 的额度打满，
> 之后所有用例都会被限流，破坏脚本的可重复性。需要验证时用低阈值临时启动：
> `COMMENT_RATE_LIMIT_MAX=3 node server.js`