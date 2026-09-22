# Happy Home - 博客内容管理系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-blue)](https://github.com/xkx/happy_home)

一个现代化的博客内容管理系统（CMS），基于 React + Vite + TailwindCSS 构建，提供直观的后台管理界面和优雅的前端展示。

## ✨ 功能特性

### 后台管理
- **仪表盘** - 实时数据概览和快速操作入口
- **文章管理** - 创建、编辑、发布博客文章
- **页面管理** - 创建和管理静态页面
- **媒体库** - 图片和文件上传管理
- **用户管理** - 用户权限和角色管理
- **数据分析** - 访问统计和数据可视化
- **主题设置** - 自定义网站外观
- **系统设置** - 站点配置管理

### 前端展示
- **响应式设计** - 完美适配桌面和移动设备
- **文章列表** - 按分类、标签浏览文章
- **文章详情** - 优雅的阅读体验
- **富文本编辑器** - Markdown支持的内容编辑
- **教程系统** - 交互式引导教程

## 🛠️ 技术栈

- **框架**: React 19
- **构建工具**: Vite 6
- **样式**: TailwindCSS 3
- **路由**: React Router 7
- **图标**: Lucide React
- **语言**: JavaScript (ES6+)

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/xkx/happy_home.git

# 进入项目目录
cd happy_home

# 安装依赖
npm install
```

## 🚀 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 📖 使用说明

### 开发环境

启动开发服务器后，访问 `http://localhost:5173` 即可看到应用。

### 登录凭证

管理员用户名固定为 `admin`，**密码不再是固定的演示口令**。

首次初始化数据库时会自动生成一个随机口令，并在后端控制台打印一次：

```
====================================================
  已创建初始管理员账号
  用户名：admin
  初始口令：<随机生成>
  请登录后立即修改，或在 .env 里设置 INITIAL_ADMIN_PASSWORD
====================================================
```

也可以在执行初始化前，于 `backend/.env` 中显式指定 `INITIAL_ADMIN_PASSWORD`。

> 早期版本在代码与本文档里硬编码了 `admin123`，并随仓库一并公开。该口令已被轮换，
> 相关的快捷登录入口也已移除。

### 项目结构

```
happy_home/
├── src/
│   ├── app/                 # 应用装配（App / providers / RouteError）
│   ├── routes/              # 路由表、路径常量、鉴权守卫、页面懒加载
│   ├── layouts/             # AdminLayout / PublicLayout / AuthLayout
│   ├── components/
│   │   ├── ui/              # 无业务原语（Button / Form / Card / Table ...）
│   │   ├── layout/          # 顶栏、侧栏、前台导航
│   │   └── widgets/         # 前台侧栏小工具
│   ├── pages/               # 页面（按路由懒加载，各自独立 chunk）
│   │   └── public/          # 前台展示页面
│   ├── state/               # 全局状态（Auth / SiteSettings / Theme）
│   ├── contexts/            # 实体数据与错误/网络上下文
│   ├── hooks/
│   ├── lib/                 # http / storage / format / sanitize / cn
│   ├── styles/              # 设计变量与基础样式
│   └── services/api.js      # 端点声明层
├── backend/
│   ├── server.js            # 仅装配中间件与挂载模块路由
│   ├── db.js                # sql.js 生命周期 + 迁移
│   └── src/
│       ├── config/ db/ lib/ middleware/
│       ├── modules/<domain>/routes.js   # 按业务域拆分
│       └── mailer/
└── package.json
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👤 作者

**xkx**

- GitHub: [@xkx](https://github.com/xkx)

---

**Happy Home** - 让博客管理更简单快乐！

---

## 📝 更新日志

### v0.1.0-alpha (2026-05-28)

**修复的问题:**
- ✅ 密码重置功能实现 - 现在支持真实的验证码验证和密码重置
- ✅ 忘记密码功能实现 - 支持发送验证码和验证流程
- ✅ PublicHeader JSON.parse错误处理 - 添加了try-catch错误处理
- ✅ mockData用户数据完善 - 添加了密码字段
- ✅ 内存泄漏修复 - 修复了定时器和事件监听器的清理问题

**安全改进:**
- ✅ XSS防护增强 - 使用DOMPurify清理HTML内容
- ✅ 密码哈希存储 - 使用bcrypt对密码进行哈希处理
- ✅ 登录状态持久化 - 使用localStorage保存登录状态

**功能完善:**
- ✅ 管理后台认证保护 - 添加PrivateRoute路由守卫
- ✅ 通知系统轮询优化 - 添加了定时器清理
- ✅ 主题保存逻辑修复 - 正确处理自定义配色方案

## 🚧 Alpha 测试版

当前版本为 Alpha 测试版，可能存在以下已知问题：

- 数据存储使用本地内存（SQLite），刷新页面后数据会保持
- 部分功能可能不稳定
- 移动端适配正在优化中

欢迎反馈问题和建议！

