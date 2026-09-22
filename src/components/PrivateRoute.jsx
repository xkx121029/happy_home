import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { LoadingState } from '../components/StateViews';

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, loading } = useData();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setChecking(false);
    }
  }, [loading]);

  if (checking || loading) {
    // 正在加载状态
    return <LoadingState message="正在验证身份..." fullPage />;
  }

  // 只看 isAuthenticated —— 它来自 /auth/me 对 token 的真实校验。
  // 原来还额外信任 localStorage 里的 isLoggedIn 标记：只要那个键是 'true'
  // （可能来自上个版本的残留、也可能被手工写入），即使 token 已失效或根本不存在，
  // 页面照样放行，随后每个请求都 403 —— 是最隐蔽的一处鉴权漏洞。
  if (!isAuthenticated) {
    // 未登录应去登录页并记住来路，而不是跳到一个没有出口的 /unauthorized
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
