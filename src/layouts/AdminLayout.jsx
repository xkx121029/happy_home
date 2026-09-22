import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

/**
 * 后台外壳：顶栏 + 侧边栏 + 内容区。
 *
 * 原来是 App.jsx 里的 renderAdminLayout(content) 函数，并且被 28 个
 * 「在组件体内定义的 AdminXxx 组件」逐个调用：
 *
 *   const AdminPosts = () => renderAdminLayout(<Posts ... />);
 *
 * 在组件体内定义组件，等于每次渲染都产生一个新的组件类型，
 * React 会认为整棵子树换了个东西，于是全部卸载重建 —— 输入框失焦、
 * 内部状态丢失、性能暴跌。改成布局路由 + <Outlet /> 后这类问题从根上消失。
 *
 * 另外 PageEditor / UserEditor 当时绕过这个函数自己又写了一遍 Header 布局，
 * 现在统一由本组件承担。
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}