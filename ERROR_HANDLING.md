# 错误处理与未授权页面使用说明

## 文件结构

```
src/
├── pages/
│   ├── UnauthorizedPage.jsx  # 401 未授权页面
│   └── NotFoundPage.jsx      # 404 未找到页面
├── components/
│   └── PrivateRoute.jsx      # 更新的私有路由组件
├── contexts/
│   └── DataContext.jsx       # 更新的登录/登出逻辑
└── App.jsx                   # 添加错误路由
```

## 功能说明

### 1. 401 未授权页面 (`/unauthorized`)

- 当用户访问受保护的 `/admin/*` 子路由时，如果未登录或Token过期，会自动跳转到该页面
- 提供三个操作按钮：
  - **立即登录** - 带来源跳转回登录页
  - **返回主页** - 返回公共首页
  - **重新尝试** - 重新加载当前页

### 2. 404 未找到页面 (`*`)

- 访问不存在的路由时显示
- 提供"返回首页"和"返回上页"功能

### 3. 私有路由增强 (`PrivateRoute.jsx`)

- 添加加载状态显示
- 先检查 `localStorage.isLoggedIn`，然后检查 `DataContext.isAuthenticated`
- 验证失败时跳转 `/unauthorized`

## 使用示例

### 模拟未登录访问测试

```javascript
// 在浏览器控制台执行
localStorage.removeItem('isLoggedIn')
localStorage.removeItem('auth_token')
// 然后刷新页面访问 /admin
```

### 测试404错误

直接访问不存在的路径，如 `/some-invalid-path`

## 工作流程

```
访问 /admin/* 子路由
        ↓
PrivateRoute 检查认证
        ↓
    ┌─────────────────┐
    │ 已登录？        │
    └──────┬──────────┘
           │ No
           ↓
    显示加载状态 ("正在验证身份...")
           ↓
    验证完成，未通过
           ↓
    跳转 /unauthorized
           ↓
    显示未授权页面
           ↓
        用户选择:
    ┌───────────────┐
  [立即登录]  → /login (带from参数)
    └───────────────┘
  [返回主页]  → /
    └───────────────┘
  [重新尝试] → 刷新
    └───────────────┘
```
