import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 全局错误边界组件
 * 捕获子组件树的JavaScript错误，显示备用的UI而不是崩溃整个应用
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false,
    };
  }

  static getDerivedStateFromError(error) {
    // 更新state使下一次渲染能够显示备用UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({ errorInfo });
    
    // 调用自定义错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 可以在这里将错误日志上报到服务器
    this.logErrorToServer(error, errorInfo);
  }

  logErrorToServer = (error, errorInfo) => {
    const errorLog = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // 尝试发送到服务器（如果配置了错误收集服务）
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary] Error logged:', errorLog);
      // 可以在这里添加错误上报逻辑，如 Sentry
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorLog) });
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ isExpanded: !prev.isExpanded }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, isExpanded } = this.state;
      
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* 主要错误卡片 */}
            <div className="bg-surface rounded-2xl shadow-xl overflow-hidden">
              {/* 头部 - 警告图标和标题 */}
              <div className="bg-danger p-6 text-danger-fg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">出现了一些问题</h1>
                    <p className="text-danger-fg/80 mt-1">应用程序遇到了一个意外错误</p>
                  </div>
                </div>
              </div>

              {/* 错误信息 */}
              <div className="p-6">
                {/* 用户友好的错误消息 */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-fg mb-2">
                    发生了什么？
                  </h2>
                  <p className="text-muted">
                    {error?.message || '一个未知的错误发生了，请尝试刷新页面或返回首页。'}
                  </p>
                </div>

                {/* 建议操作 */}
                <div className="bg-bg  rounded-xl p-4 mb-6">
                  <h3 className="font-medium text-fg mb-3">您可以尝试：</h3>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>刷新当前页面，获取最新数据</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>返回首页，从首页重新进入</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      <span>如果问题持续存在，请联系管理员</span>
                    </li>
                  </ul>
                </div>

                {/* 技术详情 - 可展开 */}
                {import.meta.env.DEV && errorInfo && (
                  <div className="mb-6">
                    <button
                      onClick={this.toggleDetails}
                      className="flex items-center gap-2 text-sm text-muted hover:text-fg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? '隐藏' : '显示'}技术详情
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-3">
                        <div className="bg-surface-2  rounded-lg p-4 overflow-auto max-h-60">
                          <p className="text-xs font-mono text-danger whitespace-pre-wrap">
                            {error?.stack}
                          </p>
                        </div>
                        {errorInfo?.componentStack && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted mb-1">Component Stack:</p>
                            <div className="bg-surface-2  rounded-lg p-4 overflow-auto max-h-40">
                              <p className="text-xs font-mono text-muted  whitespace-pre-wrap">
                                {errorInfo.componentStack}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    刷新页面
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 hover:bg-line text-fg rounded-xl font-medium transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    返回首页
                  </button>
                </div>
              </div>
            </div>

            {/* 错误ID - 用于支持 Tickets */}
            <p className="text-center text-xs text-muted mt-4">
              如果问题持续存在，请记录此错误ID并联系技术支持
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 异步错误处理包装器
 * 用于捕获异步操作中的错误
 */
export const withAsyncErrorHandler = (asyncFn, errorHandler) => {
  return (...args) => asyncFn(...args).catch(error => {
    if (typeof errorHandler === 'function') {
      errorHandler(error);
    } else {
      console.error('[AsyncError]', error);
    }
    throw error;
  });
};

/**
 * 错误边界配置
 */
export const errorBoundaryConfig = {
  // 是否在开发环境显示详细错误
  showDetailsInDev: true,
  
  // 是否将错误上报到服务器
  reportToServer: false,
  
  // 自定义错误页面标题
  pageTitle: '出错了 - HappyHome',
};
