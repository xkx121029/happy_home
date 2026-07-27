# HappyHome Bug 统计报告

---

## 🔴 未解决 - 紧急

| ID | 描述 | 位置 |
|----|------|------|
| *无* | | |

---

## 🟡 未解决 - 中优先级

| ID | 描述 | 位置 |
|----|------|------|
| *无* | | |

---

## 🟢 未解决 - 低优先级

| ID | 描述 | 位置 |
|----|------|------|
| **BUG-066** | 多处使用dangerouslySetInnerHTML未做XSS防护 | 多个文件 |

---

## ✅ 已修复 Bug 列表

| ID | 描述 | 位置 |
|----|------|------|
| BUG-001 | 管理后台缺少认证保护 | `src/App.jsx` |
| BUG-002 | 代码块插入逻辑错误 | `src/components/RichTextEditor.jsx:182` |
| BUG-003 | 联系邮箱地址拼写错误 | `src/contexts/DataContext.jsx:33` |
| BUG-004 | 编辑器打开弹窗时也会触发内容更新 | `src/components/RichTextEditor.jsx:53-80` |
| BUG-005 | 登录状态未持久化 | `src/pages/Login.jsx:27-31` |
| BUG-006 | 媒体文件数量硬编码为3 | `src/pages/Dashboard.jsx:12` |
| BUG-007 | 主题保存逻辑错误 | `src/pages/Themes.jsx:105-117` |
| BUG-008 | Help页面联系邮箱拼写错误 | `src/pages/Help.jsx:350` |
| BUG-009 | UserEditor使用未定义的CSS类 | `src/pages/UserEditor.jsx:66` |
| BUG-010 | 通知设置开关未绑定状态 | `src/pages/Settings.jsx:546-556` |
| BUG-011 | dataStore.js中联系邮箱拼写错误 | `src/utils/dataStore.js:30` |
| BUG-013 | Pages.jsx内容截取可能因空值报错 | `src/pages/Pages.jsx:96` |
| BUG-014 | PublicSite未使用的导入图标 | `src/pages/PublicSite.jsx:1` |
| BUG-015 | App.jsx未使用的导入useParams | `src/App.jsx:2` |
| BUG-016 | Settings.jsx handleChange使用闭包问题 | `src/pages/Settings.jsx:260` |
| BUG-017 | dangerouslySetInnerHTML存在XSS风险 | `src/pages/public/PublicPostDetail.jsx:75` |
| BUG-018 | 用户密码以明文形式存储 | `src/utils/dataStore.js:54` |
| BUG-019 | 注册成功后未保存登录状态 | `src/pages/Login.jsx:64` |
| BUG-020 | JSON.parse缺少错误处理 | `src/contexts/DataContext.jsx:111-115` |
| BUG-021 | React Key使用index反模式 | `src/pages/public/PublicHome.jsx:62` |
| BUG-022 | 渲染函数中调用new Date()导致不必要重渲染 | `src/pages/UserEditor.jsx:179` |
| BUG-023 | PublicPostDetail的XSS防护不完整 | `src/pages/public/PublicPostDetail.jsx` |
| BUG-024 | 密码重置功能只是模拟 | `src/pages/ResetPassword.jsx` |
| BUG-025 | 忘记密码功能只是模拟 | `src/pages/ForgotPassword.jsx` |
| BUG-026 | PublicHeader JSON.parse缺少错误处理 | `src/components/PublicHeader.jsx:15` |
| BUG-027 | 使用原生alert/confirm影响用户体验 | 多个文件 |
| BUG-029 | PasswordStrength组件使用未定义变量 | `src/components/PasswordStrength.jsx:60` |
| BUG-030 | Analytics.jsx使用未定义的CSS类 | `src/pages/Analytics.jsx:116` |
| BUG-031 | Menus.jsx handleDeleteMenu逻辑问题 | `src/pages/Menus.jsx:42` |
| BUG-032 | ForgotPassword.jsx setInterval未清理 | `src/pages/ForgotPassword.jsx:36-44` |
| BUG-033 | Media.jsx progressInterval清理不完整 | `src/pages/Media.jsx:43-51` |
| BUG-034 | Analytics.jsx monthlyViews数据不完整 | `src/pages/Analytics.jsx:38` |
| BUG-035 | server.js分析数据total计算逻辑错误 | `backend/server.js:1338` |
| BUG-036 | usersService.js密码未真正哈希处理 | `src/services/usersService.js:1-2` |
| BUG-037 | UserEditor.jsx编辑用户时密码处理不当 | `src/pages/UserEditor.jsx:35` |
| BUG-038 | server.js登录API只支持用户名登录 | `backend/server.js:140` |
| BUG-039 | App.jsx存在潜在的无限循环问题 | `src/App.jsx:82-98` |
| BUG-040 | localStorage数据解析缺少错误处理 | 多个文件 |
| BUG-041 | App.jsx自定义JS执行XSS风险 | `src/App.jsx:267` |
| BUG-042 | 多个组件重复注册网络状态监听器 | 多个文件 |
| BUG-043 | Header组件点击外部事件监听缺少清理 | `src/components/Header.jsx:60` |
| BUG-044 | CustomCSS页面DOMContentLoaded监听时机问题 | `src/pages/CustomCSS.jsx:100` |
| BUG-045 | App.jsx未正确解构loadAllData函数 | `src/App.jsx:82` |
| BUG-054 | PostEditor.jsx中parseInt缺少基数参数 | `src/pages/PostEditor.jsx:34` |
| BUG-055 | Settings.jsx中parseInt缺少基数参数 | `src/pages/Settings.jsx:374` |
| BUG-062 | Dashboard.jsx中嵌套map导致性能问题 | `src/pages/Dashboard.jsx:146` |
| BUG-063 | Analytics.jsx中重复计算maxDailyViews | `src/pages/Analytics.jsx:61` |
| BUG-046 | Login.jsx中setInterval缺少清理（内存泄漏） | `src/pages/Login.jsx:63` |
| BUG-047 | ErrorContext.jsx中JSON.parse缺少try-catch | `src/contexts/ErrorContext.jsx:205` |
| BUG-048 | PermissionGuard.jsx中JSON.parse缺少try-catch | `src/components/PermissionGuard.jsx:6` |
| BUG-049 | Notification.jsx中handleClose内的setTimeout缺少清理 | `src/components/Notification.jsx:147` |
| BUG-050 | ErrorContext和NetworkContext使用不同的离线队列key | `src/contexts/ErrorContext.jsx:205` |
| BUG-052 | ErrorContext.jsx:373处JSON.parse缺少try-catch | `src/contexts/ErrorContext.jsx:373` |
| BUG-053 | useActionLog.js:82处JSON.parse缺少try-catch | `src/hooks/useActionLog.js:82` |
| BUG-056 | Menus.jsx中多处Number()转换未处理NaN | `src/pages/Menus.jsx:200` |
| BUG-057 | Widgets.jsx中Number()转换未处理NaN | `src/pages/Widgets.jsx:212` |
| BUG-059 | 多处使用charAt(0)未检查字符串是否为空 | 多个文件 |
| BUG-051 | 多处使用原生alert/confirm影响用户体验 | 多个文件 |
| BUG-058 | CustomCSS页面DOMContentLoaded监听时机问题 | `src/pages/CustomCSS.jsx:100` |
| BUG-060 | Notification.jsx中直接修改notifications数组 | `src/components/Notification.jsx:386` |
| BUG-061 | Widgets.jsx中直接修改locationWidgets数组 | `src/pages/Widgets.jsx:91-92` |
| BUG-064 | 多处使用substring未检查字符串长度 | 多个文件 |
| BUG-065 | 多处使用index作为React key | 多个文件 |
| BUG-067 | 多处使用console.log未清理 | 多个文件 |

---

## 📊 Bug 统计

| 分类 | 数量 |
|------|------|
| 🔴 紧急 | 0 |
| 🟡 中优先级 | 0 |
| 🟢 低优先级 | 1 |
| ✅ 已修复 | 62 |
| **总计** | **63** |

---

## 📋 未修复 Bug 详情

### BUG-041: App.jsx自定义JS执行存在XSS风险 🔴

**位置**: `src/App.jsx:243`

**问题代码**:
```javascript
{customJS && <script dangerouslySetInnerHTML={{ __html: customJS }} />}
```

**安全风险**: 直接执行用户输入的JavaScript代码，可能导致XSS攻击。

**修复方案**: 移除自定义JS功能或使用沙箱隔离。

---

### BUG-042: 多个组件重复注册网络状态监听器 ✅

**位置**: 多个文件

**问题代码**:
```javascript
// src/App.jsx:65-66
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// src/services/enhancedApi.js:558-559
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// src/contexts/ErrorContext.jsx:204-205
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// src/components/NetworkStatus.jsx:30-31, 170-171
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

**问题**: 同一事件被多次监听，可能导致重复处理、内存泄漏和性能问题。

**修复方案**:
- 创建统一的 `NetworkContext` 管理网络状态（只注册一次监听器）
- 移除 `enhancedApi.js` 中的 `useOfflineStatus` hook 的监听器注册
- 移除 `ErrorContext.jsx` 中的网络状态监听器，使用 `useNetwork` hook
- 修复 `NetworkStatus.jsx` 中的重复监听器，使用 `useNetwork` hook
- 更新 `App.jsx` 使用 `NetworkProvider` 和 `useNetwork` hook

**修复文件**:
- `src/contexts/NetworkContext.jsx` (新建)
- `src/App.jsx`
- `src/services/enhancedApi.js`
- `src/contexts/ErrorContext.jsx`
- `src/components/NetworkStatus.jsx`

---

### BUG-043: Header组件点击外部事件监听缺少清理 🟡

**位置**: `src/components/Header.jsx:60-64`

**问题代码**:
```javascript
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
```

**问题**: 如果 `handleClickOutside` 是内联函数，每次渲染会创建新函数，导致清理失效。

**修复方案**: 使用 `useCallback` 稳定函数引用。

---

### BUG-044: CustomCSS页面DOMContentLoaded监听时机问题 🟢

**位置**: `src/pages/CustomCSS.jsx:100`

**问题代码**:
```javascript
document.addEventListener('DOMContentLoaded', function() {
  // ...
});
```

**问题**: `DOMContentLoaded` 事件在页面加载完成后只触发一次，组件后挂载时监听器不会触发。

**修复方案**: 检查 `document.readyState` 或使用 `useEffect`。

---

### BUG-045: App.jsx使用未从useData解构的loadAllData函数 🟡

**位置**: `src/App.jsx:48-54`

**问题代码**:
```javascript
const AppContent = ({ children }) => {
  const { posts, pages, media, users, settings, loadAllData } = useData();

  useEffect(() => {
    loadAllData();  // 函数可能未正确定义
  }, []);

  // ...
};
```

**影响**: 应用初始化时无法加载数据，导致白屏。

**修复方案**: 确保 `loadAllData` 在 `useData` hook 中正确返回。

---

### BUG-046: Login.jsx中setInterval缺少清理（内存泄漏） 🟡

**位置**: `src/pages/Login.jsx:63`

**问题代码**:
```javascript
const timer = setInterval(() => {
  setCodeCountdown(prev => {
    if (prev <= 1) {
      clearInterval(timer);
      setCodeButtonText('获取验证码');
      setCodeButtonDisabled(false);
      return 0;
    }
    setCodeButtonText(`${prev - 1}秒后重新获取`);
    return prev - 1;
  });
}, 1000);
```

**问题**: 在函数内部创建的 `setInterval` 没有在组件卸载时清理。虽然倒计时结束时会调用 `clearInterval`，但如果用户在倒计时结束前离开页面，定时器将继续运行，导致内存泄漏。

**修复方案**: 使用 `useRef` 存储定时器ID，并在 `useEffect` 清理函数中清理。

---

### BUG-047: ErrorContext.jsx中JSON.parse缺少try-catch 🟡

**位置**: `src/contexts/ErrorContext.jsx:205`

**问题代码**:
```javascript
const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
```

**问题**: 缺少try-catch错误处理，如果localStorage中的数据格式损坏，会导致应用崩溃。

**修复方案**: 添加try-catch包裹。

---

### BUG-048: PermissionGuard.jsx中JSON.parse缺少try-catch 🔴

**位置**: `src/components/PermissionGuard.jsx:6`

**问题代码**:
```javascript
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
```

**问题**: 缺少try-catch错误处理，如果localStorage中的数据格式损坏，会导致整个组件渲染失败。

**修复方案**: 添加try-catch包裹。

---

### BUG-049: Notification.jsx中handleClose内的setTimeout缺少清理 🟡

**位置**: `src/components/Notification.jsx:147`

**问题代码**:
```javascript
const handleClose = useCallback(() => {
  setIsExiting(true);
  setTimeout(() => {
    onClose(id);
  }, 300);
}, [id, onClose]);
```

**问题**: 如果通知组件在动画完成前被卸载，内部的 `setTimeout` 将继续执行，可能导致调用已卸载组件的回调函数。

**修复方案**: 使用 `useRef` 存储timeout ID，并在组件卸载时清理。

---

### BUG-050: ErrorContext和NetworkContext使用不同的离线队列key 🟡

**位置**: `src/contexts/ErrorContext.jsx:205` 和 `src/contexts/NetworkContext.jsx:38`

**问题代码**:
```javascript
// ErrorContext.jsx:205
const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');

// NetworkContext.jsx:38
const queue = JSON.parse(localStorage.getItem('happyhome_offline_queue') || '[]');
```

**问题**: 两个context使用不同的localStorage key存储离线队列，导致数据不同步。

**修复方案**: 统一使用相同的key，或定义一个常量来管理。

---

### BUG-059: 多处使用charAt(0)未检查字符串是否为空 🟢

**位置**: 多个文件

**问题代码**:
```javascript
// Comments.jsx:69
{author.charAt(0).toUpperCase()}

// PublicPostDetail.jsx:244
{author.charAt(0).toUpperCase()}

// RecentCommentsWidget.jsx:34
{comment.author.charAt(0).toUpperCase()}
```

**问题**: 如果author为空字符串，charAt(0)会返回空字符串，toUpperCase()不会报错但会显示空内容。

**修复方案**: 添加空字符串检查，如 `author?.charAt(0)?.toUpperCase() || '?'`。

---

### BUG-060: Notification.jsx中直接修改notifications数组 🟢

**位置**: `src/components/Notification.jsx:386`

**问题代码**:
```javascript
notifications.push({ id: Date.now(), message, type, ...options });
```

**问题**: 直接修改props中的数组，违反React不可变数据原则。

**修复方案**: 使用setNotifications更新状态。

---

### BUG-061: Widgets.jsx中直接修改locationWidgets数组 🟢

**位置**: `src/pages/Widgets.jsx:91-92`

**问题代码**:
```javascript
locationWidgets.splice(draggedIndex, 1);
locationWidgets.splice(targetIndex, 0, draggedWidget);
```

**问题**: 直接修改数组，违反React不可变数据原则。

**修复方案**: 使用数组展开运算符创建新数组。

---

### BUG-062: Dashboard.jsx中嵌套map导致性能问题 🟢

**位置**: `src/pages/Dashboard.jsx:146`

**问题代码**:
```javascript
analytics.dailyData.map((day, index) => {
  const maxCount = Math.max(...analytics.dailyData.map(d => d.count), 1);
  const height = (day.count / maxCount) * 100;
  // ...
})
```

**问题**: 在map内部再次map整个数组，导致O(n²)时间复杂度，性能差。

**修复方案**: 将maxCount计算移到map外部。

---

### BUG-063: Analytics.jsx中重复计算maxDailyViews 🟢

**位置**: `src/pages/Analytics.jsx:61`

**问题代码**:
```javascript
const maxDailyViews = data.dailyData.length > 0 ? Math.max(...data.dailyData.map(d => d.count), 1) : 1;
```

**问题**: 每次渲染都重新计算，可以使用useMemo优化。

**修复方案**: 使用useMemo缓存计算结果。

---

### BUG-064: 多处使用substring未检查字符串长度 🟢

**位置**: 多个文件

**问题代码**:
```javascript
// PostEditor.jsx:86
excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',

// Pages.jsx:86
{page.content ? page.content.replace(/<[^>]*>/g, '').substring(0, 100) : ''}...

// Help.jsx:318
<li key={stepIndex}>{step.substring(3)}</li>
```

**问题**: 如果字符串长度小于substring的起始位置，会返回空字符串。

**修复方案**: 添加长度检查或使用slice替代。

---

### BUG-065: 多处使用index作为React key 🟢

**位置**: 多个文件

**问题代码**:
```javascript
// Analytics.jsx:143
{data.dailyData.map((count, index) => (
  <div key={index} className="flex-1 flex flex-col items-center gap-2">

// RichTextEditor.jsx:293
{toolbarButtons.map((btn, index) => (

// Notification.jsx:199
{actions.map((action, index) => (
```

**问题**: 使用index作为key在列表项可能重新排序时会导致性能问题和状态不一致。

**修复方案**: 使用唯一标识符作为key。

---

### BUG-066: 多处使用dangerouslySetInnerHTML未做XSS防护 🟢

**位置**: 多个文件

**问题代码**:
```javascript
// Revisions.jsx:214
<div dangerouslySetInnerHTML={{ __html: selectedRevision.content }} />

// PublicSite.jsx:101
dangerouslySetInnerHTML={{ __html: post.content }}

// PublicPageDetail.jsx:40
dangerouslySetInnerHTML={{ __html: page.content }}

// ContentPreview.jsx:25
dangerouslySetInnerHTML={{ __html: content }}
```

**问题**: 直接渲染用户输入的HTML内容，存在XSS攻击风险。

**修复方案**: 使用DOMPurify等库清理HTML内容。

---

### BUG-067: 多处使用console.log未清理 🟢

**位置**: 多个文件

**问题代码**:
```javascript
// NetworkContext.jsx:17
console.log('网络已连接');

// ErrorContext.jsx:378
console.log('[ActionLog]', log);

// enhancedApi.js:246
console.log(`[API] Retrying request to ${endpoint} in ${retryDelay}ms`);
```

**问题**: 生产环境中保留console.log会影响性能，可能泄露敏感信息。

**修复方案**: 使用环境变量控制日志输出，或使用专业的日志库。

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
| 2026-05-28 | 修复BUG-024~028（共5个bug） | AI Assistant |
| 2026-06-02 | 发现并记录多个新bug (BUG-035~045) | AI Assistant |
| 2026-06-02 | 修复BUG-035~040 | AI Assistant |
| 2026-06-02 | 重新整理BUGS.md排版，添加BUG-041~045详情 | AI Assistant |
| 2026-06-03 | 修复BUG-041~045（全部剩余bug），所有bug已修复完成 | AI Assistant |
| 2026-06-03 | 发现并记录5个新bug (BUG-046~050) | AI Assistant |
| 2026-06-03 | 发现并记录8个新bug (BUG-051~058)，总计已发现53个bug | AI Assistant |
| 2026-06-03 | 发现并记录6个新bug (BUG-059~064)，总计已发现59个bug | AI Assistant |
| 2026-06-03 | 发现并记录3个新bug (BUG-065~067)，总计已发现62个bug | AI Assistant |
| 2026-07-27 | 修复BUG-051~053、BUG-046~050、BUG-056、BUG-057、BUG-059、BUG-060~061、BUG-064~065、BUG-067（共16个bug） | AI Assistant |
