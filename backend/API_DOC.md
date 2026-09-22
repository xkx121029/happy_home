# HappyHome RESTful API 文档

## 概述

HappyHome API 提供完整的内容管理系统接口，支持文章、页面、用户、媒体文件和设置的管理。所有接口返回统一的 JSON 格式响应。

## 基础信息

- **API 地址**: `http://localhost:3001/api`
- **认证方式**: JWT Token（Bearer Authentication）
- **响应格式**: JSON

## 认证机制

### JWT Token

登录成功后获取 Token，在后续请求的 `Authorization` 头中携带：

```
Authorization: Bearer <your_token>
```

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

---

## 认证接口

### 1. 用户登录

**POST** `/api/auth/login`

请求体：
```json
{
  "username": "admin",
  "password": "<你的管理员口令>"
}
```

> **说明**: `username` 字段支持用户名或邮箱登录

响应示例：
```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@example.com",
    "role": "administrator",
    "status": "active"
  }
}
```

### 2. 用户注册

**POST** `/api/auth/register`

请求体：
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

### 3. 获取当前用户信息

**GET** `/api/auth/me`

需要认证：✅

---

## 文章管理接口

### 4. 获取文章列表

**GET** `/api/posts`

需要认证：✅

参数：
| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 可选，过滤状态（published/draft） |
| category | string | 可选，按分类过滤 |
| search | string | 可选，搜索关键词 |

响应示例：
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### 5. 获取单篇文章

**GET** `/api/posts/:id`

需要认证：✅

### 6. 创建文章

**POST** `/api/posts`

需要认证：✅

请求体：
```json
{
  "title": "文章标题",
  "content": "<p>文章内容</p>",
  "excerpt": "文章摘要",
  "category": "分类",
  "status": "published",
  "tags": ["标签1", "标签2"],
  "author": "作者名",
  "sticky": false
}
```

### 7. 更新文章

**PUT** `/api/posts/:id`

需要认证：✅

请求体：与创建文章相同，所有字段可选

### 8. 删除文章

**DELETE** `/api/posts/:id`

需要认证：✅

---

## 页面管理接口

### 9. 获取页面列表

**GET** `/api/pages`

参数：
| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 可选，过滤状态 |
| search | string | 可选，搜索关键词 |

### 10. 获取单页

**GET** `/api/pages/:id`

### 11. 创建页面

**POST** `/api/pages`

需要认证：✅

请求体：
```json
{
  "title": "页面标题",
  "content": "<p>页面内容</p>",
  "slug": "page-slug",
  "status": "published"
}
```

### 12. 更新页面

**PUT** `/api/pages/:id`

需要认证：✅

### 13. 删除页面

**DELETE** `/api/pages/:id`

需要认证：✅

---

## 用户管理接口

### 14. 获取用户列表

**GET** `/api/users`

需要认证：✅ (管理员)

参数：
| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 可选，过滤状态 |
| search | string | 可选，搜索关键词 |

### 15. 获取单个用户

**GET** `/api/users/:id`

需要认证：✅

### 16. 创建用户

**POST** `/api/users`

需要认证：✅ (管理员)

请求体：
```json
{
  "username": "username",
  "email": "email@example.com",
  "password": "password123",
  "role": "author",
  "status": "active"
}
```

### 17. 更新用户

**PUT** `/api/users/:id`

需要认证：✅ (管理员)

### 18. 删除用户

**DELETE** `/api/users/:id`

需要认证：✅ (管理员)

---

## 媒体管理接口

### 19. 获取媒体列表

**GET** `/api/media`

需要认证：✅

### 20. 上传媒体

**POST** `/api/media`

需要认证：✅

请求体：
```json
{
  "name": "image.jpg",
  "url": "https://example.com/image.jpg",
  "size": "256 KB",
  "type": "image/jpeg"
}
```

### 21. 删除媒体

**DELETE** `/api/media/:id`

需要认证：✅

---

## 设置接口

### 22. 获取设置

**GET** `/api/settings`

需要认证：✅

### 23. 更新设置

**PUT** `/api/settings`

需要认证：✅ (管理员)

请求体：
```json
{
  "siteName": "HappyHome",
  "siteDescription": "描述",
  "adminEmail": "admin@example.com"
}
```

---

## 公开接口（无需认证）

### 24. 获取公开文章列表

**GET** `/api/public/posts`

参数：
| 参数 | 类型 | 说明 |
|------|------|------|
| search | string | 可选，搜索关键词 |

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "文章标题",
      "excerpt": "文章摘要...",
      "category": "分类",
      "author": "作者",
      "createdAt": "2024-01-01",
      "updatedAt": "2024-01-01"
    }
  ],
  "count": 10
}
```

### 25. 获取公开文章详情

**GET** `/api/public/posts/:id`

响应示例：
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "文章标题",
    "content": "<p>文章内容</p>",
    "excerpt": "文章摘要",
    "category": "分类",
    "tags": ["标签1", "标签2"],
    "author": "作者",
    "sticky": false,
    "createdAt": "2024-01-01",
    "updatedAt": "2024-01-01"
  }
}
```

### 26. 获取公开页面列表

**GET** `/api/public/pages`

### 27. 获取公开页面详情

**GET** `/api/public/pages/:slug`

### 28. 获取公开设置

**GET** `/api/public/settings`

响应示例：
```json
{
  "success": true,
  "data": {
    "siteName": "HappyHome",
    "siteDescription": "网站描述",
    "siteUrl": "http://localhost:5173",
    "seo": {
      "siteTitle": "网站标题",
      "siteDescription": "SEO描述",
      "siteKeywords": "关键词1,关键词2"
    }
  }
}
```

### 29. 健康检查

**GET** `/api/health`

响应示例：
```json
{
  "success": true,
  "message": "OK",
  "timestamp": 1704067200000
}
```

---

## 分类管理接口

### 30. 获取分类列表

**GET** `/api/categories`

需要认证：✅

### 31. 创建分类

**POST** `/api/categories`

需要认证：✅

请求体：
```json
{
  "name": "分类名称",
  "slug": "category-slug",
  "description": "分类描述"
}
```

### 32. 更新分类

**PUT** `/api/categories/:id`

需要认证：✅

### 33. 删除分类

**DELETE** `/api/categories/:id`

需要认证：✅

---

## 标签管理接口

### 34. 获取标签列表

**GET** `/api/tags`

需要认证：✅

### 35. 创建标签

**POST** `/api/tags`

需要认证：✅

请求体：
```json
{
  "name": "标签名称",
  "slug": "tag-slug"
}
```

### 36. 更新标签

**PUT** `/api/tags/:id`

需要认证：✅

### 37. 删除标签

**DELETE** `/api/tags/:id`

需要认证：✅

---

## 评论管理接口

### 38. 获取评论列表

**GET** `/api/comments`

需要认证：✅

参数：
| 参数 | 类型 | 说明 |
|------|------|------|
| postId | string | 可选，按文章ID过滤 |
| status | string | 可选，过滤状态（approved/pending） |

### 39. 创建评论

**POST** `/api/comments`

请求体：
```json
{
  "postId": "1",
  "author": "评论者",
  "email": "email@example.com",
  "content": "评论内容",
  "parentId": null
}
```

### 40. 更新评论

**PUT** `/api/comments/:id`

需要认证：✅

### 41. 删除评论

**DELETE** `/api/comments/:id`

需要认证：✅

---

## 数据分析接口

### 42. 获取统计数据

**GET** `/api/analytics/stats`

需要认证：✅

响应示例：
```json
{
  "success": true,
  "data": {
    "totalPosts": 100,
    "totalPages": 10,
    "totalUsers": 50,
    "totalComments": 200,
    "totalMedia": 150,
    "dailyData": [
      {"date": "2024-01-01", "count": 10},
      {"date": "2024-01-02", "count": 15}
    ],
    "monthlyViews": [
      {"month": "1月", "views": 1000},
      {"month": "2月", "views": 1200}
    ],
    "topPosts": [...],
    "topCategories": [...]
  }
}
```

### 43. 跟踪页面访问

**POST** `/api/analytics/track`

请求体：
```json
{
  "page": "/posts/1",
  "referrer": "https://example.com"
}
```

---

## 权限说明

| 角色 | 权限 |
|------|------|
| administrator | 全部权限 |
| editor | 管理文章、页面、媒体 |
| author | 创建和编辑自己的文章 |

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务器

```bash
npm start
```

### 3. 测试 API

```bash
# 登录获取 Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<你的管理员口令>"}'

# 使用 Token 访问受保护的接口
curl -X GET http://localhost:3001/api/posts \
  -H "Authorization: Bearer <your_token>"
```

---

## Android 端集成建议

### Retrofit 示例

```kotlin
interface HappyHomeApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/posts")
    suspend fun getPosts(@Header("Authorization") token: String): Response<PostsResponse>

    @POST("api/posts")
    suspend fun createPost(
        @Header("Authorization") token: String,
        @Body request: CreatePostRequest
    ): Response<PostResponse>
}
```

### OkHttp 拦截器

```kotlin
class AuthInterceptor(private val token: String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
            .newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()
        return chain.proceed(request)
    }
}
```

---

## 数据模型

### Post
```json
{
  "id": "string",
  "title": "string",
  "content": "string (HTML)",
  "excerpt": "string",
  "category": "string",
  "status": "string (published/draft)",
  "author": "string",
  "createdAt": "ISO8601 string",
  "updatedAt": "ISO8601 string"
}
```

### Page
```json
{
  "id": "string",
  "title": "string",
  "content": "string (HTML)",
  "slug": "string",
  "status": "string",
  "author": "string",
  "createdAt": "ISO8601 string",
  "updatedAt": "ISO8601 string"
}
```

### User
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "string (administrator/editor/author)",
  "status": "string (active/pending/disabled)",
  "createdAt": "ISO8601 string",
  "updatedAt": "ISO8601 string"
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
  "uploadedAt": "ISO8601 string"
}
```
