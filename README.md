# Happy Home - 博客内容管理系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-blue)](https://github.com/xkx/happy_home)

一个现代化的博客内容管理系统（CMS），基于 React + Vite + TailwindCSS 构建，提供直观的后台管理界面和优雅的前端展示。

## ✨ 功能特性

### 后台管理
- **仪表盘** - 实时数据概览和快速操作入口
- **文章管理** - 创建、编辑、发布博客文章，支持定时发布（按站点时区判断到点）
- **修订历史** - 保存文章时自动留快照，可并排对比两个版本、一键回滚
- **页面管理** - 创建和管理静态页面
- **媒体库** - 图片和文件上传管理
- **用户管理** - 用户权限和角色管理
- **数据分析** - 访问统计和数据可视化
- **主题设置** - 中性色系 / 强调色 / 圆角 / 字体四个维度自由组合，强调色会自动校准到可读
- **系统设置** - 站点标识、内容、用户、安全、评论、邮件、备份、日志

### 前端展示
- **响应式设计** - 完美适配桌面和移动设备
- **文章列表** - 按分类、标签浏览文章
- **文章详情** - 优雅的阅读体验
- **订阅与收录** - 内置 `/feed.xml`（RSS 2.0）与 `/sitemap.xml`
- **富文本编辑器** - Markdown支持的内容编辑
- **教程系统** - 交互式引导教程

## 🎨 设计系统

全站颜色、圆角、字体都走语义 token（`src/styles/tokens.css`），组件里不写死色值：

```jsx
// 不要这样写
<div className="bg-white border-gray-200 text-gray-500 dark:bg-gray-800" />

// 这样写，明暗与换肤自动生效
<div className="bg-surface border-line text-muted" />
```

可用的 token：`bg` / `surface` / `surface-2` / `fg` / `muted` / `line` / `accent(-fg/-50/-100/-200/-700)`
/ `success` / `warning` / `danger` / `info`（后四者另有 `-fg` 用于实心底上的文字）。

`npm run lint` 里挂了一道护栏（`scripts/check-tokens.mjs`），新增调色板类名或 `dark:`
颜色变体会直接报错。理由见 `src/styles/tokens.css` 的注释：token 化的意义在于
「同一处改动全站生效」，混着硬编码就会退化回逐个文件改。

正文排版用 `.rich-text`（定义在 `src/styles/base.css`），不要再用 `prose` 类 ——
本项目没有安装 `@tailwindcss/typography`，那些类名不会生成任何规则。

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
│   │   ├── ui/              # 无业务原语（Button / Form / Card / Table / StatusBadge ...）
│   │   ├── layout/          # 顶栏、侧栏、前台导航
│   │   └── widgets/         # 前台侧栏小工具
│   ├── pages/               # 页面（按路由懒加载，各自独立 chunk）
│   │   └── public/          # 前台展示页面
│   ├── state/               # 全局状态（Auth / SiteSettings / Theme）
│   ├── contexts/            # 实体数据与错误/网络上下文
│   ├── hooks/
│   ├── lib/                 # http / storage / format / sanitize / cn / diff / tones
│   ├── config/settings.js   # 站点设置的唯一真源（表单与白名单都由它派生）
│   ├── theme/               # 主题数据与强调色推导（apply.js 负责对比度校准）
│   ├── styles/              # 设计变量（tokens.css）与基础样式
│   └── services/api.js      # 端点声明层
├── scripts/
│   └── check-tokens.mjs     # 防回潮护栏，挂在 npm run lint 上
├── backend/
│   ├── server.js            # 仅装配中间件与挂载模块路由
│   ├── db.js                # sql.js 生命周期 + 迁移
│   ├── API_DOC.md
│   ├── scripts/smoke.mjs    # 冒烟测试（含契约形状比对）
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

### 2026-09-24

**开放式 API 改造（把只能给本站 SPA 用的后端，做成可供外部客户端调用的开放 API）：**

- ✅ 端点统一版本化到 `/api/v1` 下，版本号只写在 `server.js` 一处；
  `/api/health`、`/feed.xml`、`/sitemap.xml` 刻意不版本化。
  迁移前的旧地址一律 404，响应里带 `hint` 指明新路径（不构成兼容层）。
- ✅ 合并「公开端点」与「后台端点」：不再有 `/api/public/posts` 与 `/api/posts`
  两套路径，同一个端点按身份决定返回什么 —— 匿名只读到已发布内容。
  后台列表页用显式 `?all=1` 走全量模式，不用「有没有传 page」去嗅探，
  因为同一个 URL 出现两种响应形状会让契约无法文档化。
- ✅ 统一鉴权模型：`authenticate` 只做身份识别（匿名 / JWT 用户 / API Key），
  授权交给 `requireAccess(scope, { roles, anonymous })`。
  scope 目录集中在 `backend/src/lib/permissions.js`，路由里不再散落角色字面量。
- ✅ **API 密钥**：格式 `hhk_<前缀>_<随机>`，bcrypt 存哈希，明文只在创建/轮换
  响应里出现一次；支持有效期、轮换、撤销（软删保留审计痕迹）。
  新建密钥默认只读，写权限与高危 scope 需手动勾选并在界面红字说明后果；
  **密钥不能管理密钥**，也永远进不了按用户隔离的通知端点。
- ✅ 后台新增「API 密钥」管理页（系统 → API 密钥，仅管理员可见）。
- ✅ 顺带堵掉一个既有权限洞：`GET /settings` 此前只要求「已登录」，
  author 角色就能读到 `smtpPass`。现在按身份三分支裁剪返回的键。
- ✅ 修掉若干既有问题：访客侧栏小工具一直为空（4 个需 token 的端点让
  `Promise.all` 整体 reject）、`/reset-password` 是一页重复且伪造的实现（已删除）。
- ✅ 冒烟测试扩到 82 项，覆盖 API 密钥的越权边界（只读密钥写要 403、
  轮换后旧明文立即失效、密钥不能管理密钥）。

### 2026-09-23

**让设置真正生效（此前 66 个可保存键只有约 12 个被代码读取，其余是「能保存、能刷新、
什么都不发生」的假设置）：**

- ✅ 设置清单收敛为单一真源（`src/config/settings.js`），白名单由表单定义派生，不可能再漂移
- ✅ 接线：每页文章数、摘要长度、评论开关与审核、注册开关、新用户默认角色、
  登录限流、会话时长、时区、统计脚本注入
- ✅ 删掉 10 个空概念设置项（压缩 / 缓存 / Gzip / SSL / 懒加载 / 调试等）与 6 个重复入口
- ✅ 修掉「重置设置」会连登录令牌一起抹掉的问题

**新增能力：**

- ✅ 定时发布的时区修复 —— 此前晚 8 小时触发（上海选 10:00 要等到 18:00 才发）
- ✅ RSS 2.0 订阅源 `/feed.xml` 与 `/sitemap.xml`
- ✅ 文章修订：保存时自动留快照、并排对比、一键回滚（此前 revisions 表建了但无人写入）
- ✅ 修订对比视图：行级 diff，自写实现不引依赖
- ✅ 后台日志中心

**界面统一：**

- ✅ 全站约 1500 处硬编码颜色换成语义 token，52 个文件
- ✅ 正文排版补齐 —— 此前用的 `prose` 类从未生成过任何规则，文章正文一直没有排版
- ✅ 顺带修掉三类既有 bug：71 处 className 拼接漏空格（徽标一直没有颜色）、
  `/12` 与 `/14` 不在 Tailwind 透明度刻度里（所有淡色徽标底色未生成）、
  `duration-160` 不在时长刻度里
- ✅ 对比度全部校准到 WCAG AA 以上（含 73 个主题组合 × 明暗两种模式）
- ✅ ESLint 清零

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

### 尚未实现（有界面但后端没有对应端点）

- **菜单项的增删改与拖拽排序**：菜单本身可以创建/重命名/删除，
  但菜单项级别的写接口还没有，相关按钮点下去只会提示「暂未实现」。

补充说明：曾经还有一个独立的 `/reset-password` 页，它只校验「链接里带没带 token」，
提交后并不会真的改密码 —— 那是一页重复且伪造的实现。真正的流程在
`/forgot-password`：发送验证码 → 校验验证码 → 改密码，后端端点
（`/auth/send-verification-code`、`/auth/verify-code`、`/auth/reset-password`）齐全。
重复的那一页连同它的路由登记已删除。

欢迎反馈问题和建议！

