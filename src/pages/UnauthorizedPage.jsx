import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, LogIn, Home, RefreshCw } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl overflow-hidden">
        {/* 顶部渐变区域 */}
        <div className="bg-danger px-8 py-10 text-center text-danger-fg">
          <div className="w-20 h-20 bg-danger-fg/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            访问受限
          </h1>
          <p className="text-danger-fg/80 text-sm">
            您需要登录才能访问此页面
          </p>
        </div>

        {/* 主体内容 */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-fg mb-2">
              401 未授权
            </h2>
            <p className="text-muted">
              您的登录状态已过期或您没有权限访问此页面。
              请重新登录以继续。
            </p>
          </div>

          {/* 提示信息卡片 */}
          <div className="bg-warning/14  rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">
                  原因可能是：
                </p>
                <ul className="text-xs text-warning mt-1 space-y-1">
                  <li>• 登录会话已过期</li>
                  <li>• Token无效或已被撤销</li>
                  <li>• 需要更高权限的用户角色</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={handleGoLogin}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-danger hover:bg-danger text-danger-fg rounded-xl font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              立即登录
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface-2 hover:bg-line text-fg rounded-xl font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              返回主页
            </button>

            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-line text-muted  hover:bg-surface-2 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新尝试
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
