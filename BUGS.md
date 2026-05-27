# Bug 统计报告

## 概览
本文件记录 HappyHome 项目中发现的所有 bug 和问题。

---

## Bug 列表

### 🔴 高优先级

| ID | 描述 | 位置 | 状态 |
|----|------|------|------|
| BUG-001 | 管理后台缺少认证保护，任何人可直接访问 | `src/App.jsx` | ✅ 已修复 |
| BUG-017 | dangerouslySetInnerHTML存在XSS安全风险 | `src/pages/public/PublicPostDetail.jsx:75` | ✅ 已修复 |
| BUG-018 | 用户密码以明文形式存储 | `src/utils/dataStore.js:54` | ✅ 已修复 |
| BUG-024 | 密码重置功能只是模拟，没有实际验证 | `src/pages/ResetPassword.jsx` | 🔍 待修复 |
| BUG-025 | 忘记密码功能只是模拟，没有实际发送邮件 | `src/pages/ForgotPassword.jsx` | 🔍 待修复 |

### 🟡 中等优先级

| ID | 描述 | 位置 | 状态 |
|----|------|------|------|
| BUG-002 | 代码块插入逻辑错误，空内容也会插入 | `src/components/RichTextEditor.jsx:182` | ✅ 已修复 |
| BUG-003 | 联系邮箱地址拼写错误（happpyhome → happyhome） | `src/contexts/DataContext.jsx:33` | ✅ 已修复 |
| BUG-004 | 编辑器打开弹窗时也会触发内容更新 | `src/components/RichTextEditor.jsx:53-80` | ✅ 已修复 |
| BUG-005 | 登录状态未持久化，刷新后需重新登录 | `src/pages/Login.jsx:27-31` | ✅ 已修复 |
| BUG-007 | 主题保存逻辑错误，自定义颜色被覆盖 | `src/pages/Themes.jsx:105-117` | ✅ 已修复 |
| BUG-008 | Help页面联系邮箱拼写错误 | `src/pages/Help.jsx:350` | ✅ 已修复 |
| BUG-009 | UserEditor使用未定义的CSS类 | `src/pages/UserEditor.jsx:66` | ✅ 已修复 |
| BUG-010 | 通知设置开关未绑定状态 | `src/pages/Settings.jsx:546-556` | ✅ 已修复 |
| BUG-015 | App.jsx未使用的导入useParams | `src/App.jsx:2` | ✅ 已修复 |
| BUG-016 | Settings.jsx handleChange使用闭包可能导致状态不同步 | `src/pages/Settings.jsx:260` | ✅ 已修复 |
| BUG-019 | 注册成功后未保存登录状态 | `src/pages/Login.jsx:64` | ✅ 已修复 |
| BUG-020 | JSON.parse缺少错误处理 | `src/contexts/DataContext.jsx:111-115` | ✅ 已修复 |
| BUG-026 | PublicHeader JSON.parse缺少错误处理 | `src/components/PublicHeader.jsx:15` | 🔍 待修复 |
| BUG-027 | 使用原生alert/confirm影响用户体验 | 多个文件 | ✅ 已修复 |
| **BUG-029** | PasswordStrength组件使用未定义变量color | `src/components/PasswordStrength.jsx:60` | ✅ 已修复 |
| **BUG-030** | Analytics.jsx使用未定义的CSS类.card | `src/pages/Analytics.jsx:116` | ✅ 已修复 |
| **BUG-031** | Menus.jsx handleDeleteMenu使用删除前的menus长度 | `src/pages/Menus.jsx:42` | ✅ 已修复 |
| **BUG-032** | ForgotPassword.jsx setInterval未清理导致内存泄漏 | `src/pages/ForgotPassword.jsx:36-44` | ✅ 已修复 |
| **BUG-033** | Media.jsx progressInterval清理不完整 | `src/pages/Media.jsx:43-51` | ✅ 已修复 |

### 🟢 低优先级

| ID | 描述 | 位置 | 状态 |
|----|------|------|------|
| BUG-006 | 媒体文件数量硬编码为3，应使用实际数据 | `src/pages/Dashboard.jsx:12` | ✅ 已修复 |
| BUG-011 | dataStore.js中联系邮箱拼写错误 | `src/utils/dataStore.js:30` | ✅ 已修复 |
| BUG-012 | TutorialSystem导入路径可能不正确 | `src/components/TutorialSystem.jsx:8` | ✅ 已确认无误 |
| BUG-013 | Pages.jsx内容截取可能因空值报错 | `src/pages/Pages.jsx:96` | ✅ 已修复 |
| BUG-014 | PublicSite未使用的导入图标 | `src/pages/PublicSite.jsx:1` | ✅ 已修复 |
| BUG-021 | React Key使用index反模式 | `src/pages/public/PublicHome.jsx:62` | ✅ 已修复 |
| BUG-022 | 渲染函数中调用new Date()导致不必要重渲染 | `src/pages/UserEditor.jsx:179` | ✅ 已修复 |
| BUG-023 | PublicPostDetail的XSS防护不完整 | `src/pages/public/PublicPostDetail.jsx` | ✅ 已修复 |
| BUG-028 | mockData.js中用户数据缺少密码字段 | `src/data/mockData.js:95` | 🔍 待修复 |
| **BUG-034** | Analytics.jsx monthlyViews数据不完整（只有9个月） | `src/pages/Analytics.jsx:38` | ✅ 已修复 |

---

## Bug 详细信息

### BUG-001: 管理后台缺少认证保护 ✅

**问题描述**: 所有 `/admin/*` 路由没有任何认证保护，未登录用户可以直接访问管理后台。

**修复方案**:
- 创建 `PrivateRoute` 组件作为路由守卫
- 检查 `localStorage` 中的 `isLoggedIn` 状态
- 未登录用户自动重定向到登录页面

**修复文件**:
- `src/components/PrivateRoute.jsx` (新建)
- `src/App.jsx` (更新)

---

### BUG-002: 代码块插入逻辑错误 ✅

**问题描述**: 条件判断 `codeContent !== undefined` 无法正确阻止空代码块插入，因为空字符串不等于 `undefined`。

**修复前**:
```javascript
if (codeContent !== undefined) {
```

**修复后**:
```javascript
if (codeContent && codeContent.trim()) {
```

---

### BUG-003: 联系邮箱地址拼写错误 ✅

**问题描述**: 联系邮箱 `contact@happpyhome.com` 多了一个字母 'p'。

**修复内容**:
- 修复前: `contact@happpyhome.com`
- 修复后: `contact@happyhome.com`

---

### BUG-004: 编辑器内容更新逻辑问题 ✅

**问题描述**: 点击插入链接/图片/代码块按钮时，只是打开弹窗，但此时也会调用 `onChange` 导致内容被不必要地更新。

**修复方案**: 在 `executeCommand` 函数中，对于只是打开弹窗的命令（createLink、insertImage、insertCodeBlock），添加 `return` 语句，不触发内容更新。

---

### BUG-005: 登录状态未持久化 ✅

**问题描述**: 用户登录成功后没有保存登录状态，刷新页面后需要重新登录。

**修复方案**:
- 登录成功时保存 `isLoggedIn` 和 `currentUser` 到 `localStorage`
- 在 `PrivateRoute` 中检查登录状态

**修复代码**:
```javascript
// 在 Login.jsx 的 handleLogin 中
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('currentUser', JSON.stringify(result.user));
```

---

### BUG-006: 媒体文件数量硬编码 ✅

**问题描述**: 仪表盘上媒体文件数量显示为硬编码的 `3`，应使用实际数据。

**修复方案**:
- 在 Dashboard 组件添加 `media` prop
- 使用 `media.length` 代替硬编码的 `3`
- 在 App.jsx 中传递 `media` 数据

**修复前**:
```javascript
{ label: '媒体文件', value: 3, icon: Image, color: 'bg-pink-500' }
```

**修复后**:
```javascript
{ label: '媒体文件', value: media.length, icon: Image, color: 'bg-pink-500' }
```

---

### BUG-007: 主题保存逻辑错误 ✅

**问题描述**: 在 `handleSave` 函数中，`activeTheme` 从 `themes` 数组中查找，但这包含自定义主题而非默认主题的配色方案。

**修复方案**:
- 检查是否有激活的预设主题
- 如果有，使用预设主题的配色
- 如果没有（使用自定义），使用自定义配色

**修复代码**:
```javascript
const handleSave = () => {
  const activePreset = themes.find(t => t.active);
  let colorsToSave;

  if (activePreset) {
    colorsToSave = activePreset.colors;
  } else {
    colorsToSave = customTheme.colors;
  }

  const newSettings = {
    ...settings,
    theme: {
      name: activePreset ? activePreset.name : 'custom',
      ...customTheme,
      colors: colorsToSave,
    },
  };
  if (onSave) {
    onSave(newSettings);
    setHasChanges(false);
  }
};
```

---

### BUG-008: Help页面联系邮箱拼写错误 ✅

**问题描述**: Help页面中的联系邮箱拼写错误：`support@happpyhome.com`。

**修复内容**:
- 修复前: `support@happpyhome.com`
- 修复后: `support@happyhome.com`

**修复文件**: `src/pages/Help.jsx:350`

---

### BUG-009: UserEditor使用未定义的CSS类 ✅

**问题描述**: UserEditor 组件使用了未定义的 CSS 类 `btn-primary`。

**修复方案**: 将 `btn-primary` 替换为标准的 Tailwind CSS 类。

**修复前**:
```html
<button className="btn-primary flex items-center gap-2">
```

**修复后**:
```html
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
```

**修复文件**: `src/pages/UserEditor.jsx:66`

---

### BUG-010: 通知设置开关未绑定状态 ✅

**问题描述**: toggle 开关的 `onClick` 处理器使用 `!value`，但当 `value` 为 `undefined` 时，`!undefined` 返回 `true`，导致初始状态显示不正确。

**修复方案**: 使用空值合并运算符（`??`）提供默认值，确保 `toggleValue` 总是一个布尔值。

**修复代码**:
```javascript
case 'toggle':
  const toggleValue = value ?? setting.defaultValue ?? false;
  return (
    <button
      key={setting.key}
      onClick={() => handleChange(setting.key, !toggleValue)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggleValue ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggleValue ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
```

**修复文件**: `src/pages/Settings.jsx:546-556`

---

## Bug 详细信息（续）

### BUG-011: dataStore.js中联系邮箱拼写错误 ✅

**问题描述**: `dataStore.js` 第30行的默认页面数据中，联系方式邮箱拼写错误：`contact@happpyhome.com` 应为 `contact@happyhome.com`。

**问题代码**:
```javascript
{
  id: 2,
  title: '联系我们',
  content: '<h2>联系我们</h2>...<li>邮箱：contact@happpyhome.com</li>...',
  slug: 'contact',
  ...
}
```

**修复方案**: 将 `contact@happpyhome.com` 改为 `contact@happyhome.com`

---

### BUG-012: TutorialSystem导入路径可能不正确 ✅

**问题描述**: `TutorialSystem.jsx` 第8行导入 `tutorialAPI` 的路径是 `../utils/dataStore`，但实际文件在 `src/utils/dataStore.js`，而 TutorialSystem 在 `src/components/` 目录下。如果 `src/utils/` 目录不存在或路径不正确，会导致运行时错误。

**问题代码**:
```javascript
import { tutorialAPI } from '../utils/dataStore';
```

**修复方案**: 确认 `src/utils/dataStore.js` 文件是否存在，如不存在则需要创建或调整导入路径。

---

### BUG-013: Pages.jsx内容截取可能因空值报错 ✅

**问题描述**: `Pages.jsx` 第96行在截取页面内容摘要时，直接调用 `page.content.replace()`，但如果 `page.content` 为 `null` 或 `undefined`，会导致运行时错误。

**问题代码**:
```javascript
<p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
  {page.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
</p>
```

**修复方案**: 添加空值检查：
```javascript
{page.content ? page.content.replace(/<[^>]*>/g, '').substring(0, 100) : ''}...
```

---

### BUG-014: PublicSite未使用的导入图标 ✅

**问题描述**: `PublicSite.jsx` 第1行导入了多个图标组件，但实际代码中并未使用这些图标，造成不必要的代码膨胀。

**问题代码**:
```javascript
import { Home, FileText, Image, User, Search, Menu, X, ArrowRight } from 'lucide-react';
```

**实际使用的图标**: `Menu`, `X`, `ArrowRight`, `User` (第1行导入但实际只用了部分)

**修复方案**: 删除未使用的导入：
```javascript
import { User, Menu, X, ArrowRight } from 'lucide-react';
```

---

### BUG-015: App.jsx未使用的导入useParams ✅

**问题描述**: `App.jsx` 第2行导入了 `useParams` from 'react-router-dom'，但在 AppContent 组件中并未使用该 hook。

**问题代码**:
```javascript
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
```

**修复方案**: 删除未使用的导入：
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
```

---

### BUG-016: Settings.jsx handleChange不能处理嵌套对象 ✅

**问题描述**: `Settings.jsx` 第260行的 `handleChange` 函数只是简单地设置 `formData[key] = value`，但如果 `key` 是嵌套的如 "theme.colors.primary"，这不会正确工作。

**问题代码**:
```javascript
const handleChange = (key, value) => {
  setFormData({ ...formData, [key]: value });
  setHasChanges(true);
};
```

**修复方案**: 支持嵌套对象的处理：
```javascript
const handleChange = (key, value) => {
  if (key.includes('.')) {
    const [parent, child] = key.split('.');
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [child]: value,
      },
    });
  } else {
    setFormData({ ...formData, [key]: value });
  }
  setHasChanges(true);
};
```

---

### BUG-017: dangerouslySetInnerHTML存在XSS安全风险 ✅

**问题描述**: 多个组件使用 `dangerouslySetInnerHTML` 渲染用户输入的内容，但没有进行HTML清理，存在跨站脚本攻击（XSS）风险。

**受影响文件**:
- `src/pages/public/PublicPostDetail.jsx:75`
- `src/pages/public/PublicPageDetail.jsx:40`
- `src/pages/PublicSite.jsx:101`
- `src/components/ContentPreview.jsx:25`

**问题代码**:
```javascript
<div dangerouslySetInnerHTML={{ __html: post.content }} />
```

**修复方案**: 使用 DOMPurify 等库对HTML内容进行清理后再渲染，或者使用更安全的富文本渲染方式。

---

### BUG-018: 用户密码以明文形式存储 ✅

**问题描述**: 用户密码以明文形式存储在 localStorage 中，存在严重的安全风险。如果 localStorage 数据被窃取，用户密码将直接泄露。

**问题代码**:
```javascript
// dataStore.js:54
password: 'admin123',

// Login.jsx:30
localStorage.setItem('currentUser', JSON.stringify(result.user));
```

**修复方案**:
- 使用 bcrypt 或其他密码哈希算法对密码进行哈希处理
- 登录时验证哈希值而非明文密码
- 不要将密码存储在 localStorage 中

---

### BUG-019: 注册成功后未保存登录状态 ✅

**问题描述**: 在 `handleRegister` 函数中，注册成功后直接跳转到 `/admin`，但没有保存登录状态到 localStorage。这意味着用户注册成功后刷新页面会失去登录状态。

**问题代码**:
```javascript
const handleRegister = (e) => {
  // ...验证逻辑...
  if (result.success) {
    navigate('/admin');  // 缺少登录状态保存
  }
};
```

**修复方案**: 在注册成功后添加登录状态保存：
```javascript
if (result.success) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(result.user));
  navigate('/admin');
}
```

---

### BUG-020: JSON.parse缺少错误处理 ✅

**问题描述**: 在 `DataContext.jsx` 中，从 localStorage 读取数据时使用 `JSON.parse`，但没有 try-catch 错误处理。如果 localStorage 中的数据格式不正确，会导致应用崩溃。

**问题代码**:
```javascript
setPosts(savedPosts ? JSON.parse(savedPosts) : initialPosts);
setPages(savedPages ? JSON.parse(savedPages) : initialPages);
setUsers(savedUsers ? JSON.parse(savedUsers) : initialUsers);
setMedia(savedMedia ? JSON.parse(savedMedia) : initialMedia);
setSettings(savedSettings ? JSON.parse(savedSettings) : initialSettings);
```

**修复方案**: 添加 try-catch 错误处理：
```javascript
try {
  setPosts(savedPosts ? JSON.parse(savedPosts) : initialPosts);
  // ...其他解析...
} catch (error) {
  console.error('Failed to parse localStorage data:', error);
  // 使用默认数据
  setPosts(initialPosts);
  // ...其他默认值...
}
```

---

### BUG-021: React Key使用index反模式 ✅

**问题描述**: 多个组件使用数组索引(index)作为React元素的key，这是React的反模式。当数组顺序变化或元素被删除时，会导致不必要的重新渲染和状态丢失。

**受影响文件**:
- `src/pages/public/PublicHome.jsx:62` - `key={idx}`
- `src/pages/Dashboard.jsx:27` - `key={index}`
- `src/pages/Dashboard.jsx:105` - `key={index}`
- `src/pages/Themes.jsx:229` - `key={index}`
- `src/pages/Analytics.jsx:217` - `key={index}`
- `src/pages/Analytics.jsx:258` - `key={index}`
- `src/pages/Analytics.jsx:358` - `key={index}`
- `src/pages/Help.jsx:308` - `key={index}`

**问题代码示例**:
```javascript
{features.map((feature, idx) => {
  return (
    <div key={idx} className="bg-white rounded-2xl p-8">
      ...
    </div>
  );
})}
```

**修复方案**:
- 对于静态数据（如功能列表），使用稳定的唯一标识符
- 对于动态数据，使用数据项的id作为key
- 对于无法获取唯一id的情况，考虑使用 `crypto.randomUUID()` 生成唯一key

---

### BUG-022: 渲染函数中调用new Date()导致不必要重渲染 ✅

**问题描述**: 在组件的渲染函数中直接调用 `new Date().toISOString()`，这会导致每次组件渲染时都创建新的日期对象，可能导致不必要的重新渲染和性能问题。

**受影响文件**:
- `src/pages/UserEditor.jsx:179`
- `src/pages/PostEditor.jsx:220`
- `src/pages/PostEditor.jsx:224`

**问题代码**:
```javascript
<div>{new Date().toISOString().split('T')[0]}</div>
```

**修复方案**: 使用 `useState` 和 `useEffect` 在组件挂载时初始化日期，或使用 `useMemo` 缓存日期值。

```javascript
const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

// 或者使用 useMemo
const currentDate = useMemo(() => new Date().toISOString().split('T')[0], []);
```

---

### BUG-023: PublicPostDetail的XSS防护不完整 ✅

**问题描述**: `PublicPostDetail.jsx` 虽然有一些XSS防护措施（移除script标签和事件处理器），但防护不完整。没有对其他潜在危险的HTML属性（如 `href="javascript:"`）进行全面清理，且清理逻辑只在渲染时执行，没有在数据存储时进行。

**问题代码**:
```javascript
// 只移除了部分危险属性
if (element.href && element.href.toLowerCase().startsWith('javascript:')) {
  element.removeAttribute('href');
}
```

**修复方案**: 使用专业的HTML清理库（如DOMPurify）进行全面的HTML清理，确保所有潜在的XSS攻击向量都被移除。

---

### BUG-024: 密码重置功能只是模拟

**问题描述**: `ResetPassword.jsx` 中的密码重置逻辑只是模拟的，没有实际验证token或更新密码。这意味着用户无法真正重置密码，存在安全风险。

**问题代码**:
```javascript
// 模拟验证 token
setTimeout(() => {
  setIsValidating(false);
  setIsValidToken(true);
}, 1000);

// 模拟密码重置成功
setSuccess('密码重置成功！');
```

**修复方案**: 实现真正的密码重置逻辑：
- 后端验证token有效性
- 调用API更新用户密码
- 处理各种错误情况（token过期、无效等）

---

### BUG-025: 忘记密码功能只是模拟

**问题描述**: `ForgotPassword.jsx` 中的忘记密码逻辑只是模拟的，没有实际发送验证码邮件。这意味着用户无法真正收到验证码，功能不可用。

**问题代码**:
```javascript
// 模拟发送验证码
setSuccess('验证码已发送到您的邮箱');
setStep(2);

// 模拟验证通过
setStep(3);
```

**修复方案**: 实现真正的忘记密码逻辑：
- 集成邮件发送服务
- 生成并验证真正的验证码
- 设置验证码过期时间

---

### BUG-026: PublicHeader JSON.parse缺少错误处理

**问题描述**: `PublicHeader.jsx` 第15行使用 `JSON.parse(savedMenus)` 但没有错误处理，如果 localStorage 中的数据格式不正确，会导致运行时错误。

**问题代码**:
```javascript
const savedMenus = localStorage.getItem('happyhome_menus');
if (savedMenus) {
  const menus = JSON.parse(savedMenus);  // 可能抛出异常
  const headerMenuData = menus.find(m => m.location === 'header');
  setHeaderMenu(headerMenuData);
}
```

**修复方案**: 添加 try-catch 错误处理：
```javascript
try {
  const savedMenus = localStorage.getItem('happyhome_menus');
  if (savedMenus) {
    const menus = JSON.parse(savedMenus);
    const headerMenuData = menus.find(m => m.location === 'header');
    setHeaderMenu(headerMenuData);
  }
} catch (error) {
  console.error('Error loading menus:', error);
}
```

---

### BUG-027: 使用原生alert/confirm影响用户体验

**问题描述**: 多个文件使用原生的 `alert()` 和 `window.confirm()` 对话框，这在现代Web应用中不是最佳实践，会影响用户体验和UI一致性。

**受影响文件**:
- `src/App.jsx:84, 98, 112, 122, 153, 157, 159`
- `src/pages/Posts.jsx:45`
- `src/pages/Revisions.jsx:20, 27, 34`
- `src/pages/PostEditor.jsx:98, 102, 106, 130`
- `src/pages/CustomCSS.jsx:191`
- `src/pages/public/PublicPostDetail.jsx:211, 229`
- `src/pages/Backup.jsx:66, 69`
- `src/pages/SocialShare.jsx:86`

**问题代码示例**:
```javascript
if (window.confirm('确定要删除这篇文章吗？')) {
  postsAPI.delete(id);
}
alert('设置已保存！');
```

**修复方案**: 创建自定义的模态框/通知组件替代原生对话框，提供更好的用户体验和UI一致性。

---

### BUG-028: mockData.js中用户数据缺少密码字段

**问题描述**: `src/data/mockData.js` 中的用户数据缺少 `password` 字段，这会导致登录功能无法正常工作，因为登录验证需要密码。

**问题代码**:
```javascript
export const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'administrator',
    status: 'active',
    createdAt: '2024-01-01',
  },
  // ...其他用户也没有password字段
];
```

**修复方案**: 为每个用户添加密码字段（应该使用哈希值而非明文）：
```javascript
export const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed_password_here',  // 添加密码字段
    role: 'administrator',
    status: 'active',
    createdAt: '2024-01-01',
  },
  // ...
];
```

---

## 修复进度

| 修复阶段 | Bug数量 |
|----------|---------|
| 待修复 | 5 |
| 修复中 | 0 |
| 已修复 | 29 |
| 已确认无误 | 1 |

---

## 更新记录

| 日期 | 更新内容 | 作者 |
|------|----------|------|
| 2026-05-21 | 初始创建，记录6个bug | 系统 |
| 2026-05-21 | 修复全部6个bug | AI Assistant |
| 2026-05-21 | 发现并记录4个新bug | AI Assistant |
| 2026-05-21 | 修复所有10个bug | AI Assistant |
| 2026-05-21 | 发现并记录4个额外bug (BUG-011~014) | AI Assistant |
| 2026-05-21 | 修复BUG-011~014（共4个bug） | AI Assistant |
| 2026-05-22 | 修复登录状态持久化问题（BUG-015, BUG-016） | AI Assistant |
| 2026-05-22 | 修复BUG-017~020（XSS防护、密码哈希、JSON错误处理等） | AI Assistant |
| 2026-05-22 | 修复BUG-021~023（React Key优化、性能优化、增强XSS防护） | AI Assistant |
| 2026-05-22 | 发现并记录5个新bug (BUG-024~028) | AI Assistant |
