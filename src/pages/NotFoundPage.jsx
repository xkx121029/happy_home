import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 数字动画 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] font-extrabold text-line leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-accent/12  rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-accent" />
            </div>
          </div>
        </div>

        {/* 标题和消息 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-fg mb-3">
            页面未找到
          </h2>
          <p className="text-muted">
            抱歉，您访问的页面 <span className="font-mono text-muted bg-surface-2  px-2 py-0.5 rounded">{location.pathname}</span> 不存在。
          </p>
        </div>

        {/* 可能的原因 */}
        <div className="bg-surface-2  rounded-xl p-5 mb-8 text-left">
          <h3 className="text-sm font-semibold text-fg mb-3">
            可能的原因：
          </h3>
          <ul className="text-sm text-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              页面地址输入错误
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              页面已被删除或移动
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              页面正在维护中
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>

          <button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-2 hover:bg-line text-fg rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
}
