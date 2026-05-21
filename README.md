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

默认管理员账户（演示数据）：
- 用户名: `admin`
- 密码: `admin123`

### 项目结构

```
happy_home/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Header.jsx       # 头部导航
│   │   ├── Sidebar.jsx      # 侧边栏菜单
│   │   ├── RichTextEditor.jsx # 富文本编辑器
│   │   └── ...
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.jsx    # 仪表盘
│   │   ├── Posts.jsx        # 文章管理
│   │   ├── Pages.jsx        # 页面管理
│   │   ├── Users.jsx        # 用户管理
│   │   ├── Analytics.jsx    # 数据分析
│   │   └── public/          # 前端展示页面
│   ├── data/                # 模拟数据
│   ├── utils/               # 工具函数
│   └── App.jsx              # 主应用组件
├── public/                  # 静态资源
├── dist/                    # 构建输出
└── package.json             # 项目配置
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

## 🚧 Alpha 测试版

当前版本为 Alpha 测试版，可能存在以下已知问题：

- 数据存储使用本地内存，刷新页面后数据会重置
- 部分功能可能不稳定
- 移动端适配正在优化中

欢迎反馈问题和建议！

