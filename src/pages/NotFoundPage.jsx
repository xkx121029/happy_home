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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 数字动画 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] font-extrabold text-gray-200 dark:text-gray-800 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* 标题和消息 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            页面未找到
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            抱歉，您访问的页面 <span className="font-mono text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{location.pathname}</span> 不存在。
          </p>
        </div>

        {/* 可能的原因 */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-8 text-left">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            可能的原因：
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              页面地址输入错误
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              页面已被删除或移动
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              页面正在维护中
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>

          <button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
}
