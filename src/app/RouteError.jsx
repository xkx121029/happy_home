import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

/**
 * 路由级错误边界。
 *
 * 原来全站只有一个 ErrorBoundary，挂在整个应用最外层：
 * 任何一个页面抛错都会把整个界面替换成错误页（侧边栏、导航全没了），
 * 用户只能刷新。挂在路由上之后，出错只影响当前页面的内容区。
 */
export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = '页面出错了';
  let detail = '发生了未知错误，请稍后重试。';

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? '页面不存在' : `请求失败（${error.status}）`;
    detail = error.statusText || detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-fg mb-2">{title}</h1>
        <p className="text-sm text-muted mb-6 break-words">{detail}</p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate(0)}
            className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium active:scale-[0.97]"
          >
            重新加载
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-fg hover:bg-surface-2"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}