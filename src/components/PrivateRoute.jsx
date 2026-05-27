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

  // 先检查localStorage的简单登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (checking || loading) {
    // 正在加载状态
    return <LoadingState message="正在验证身份..." fullPage />;
  }

  // 如果没有认证，则跳转到401页面
  if (!isAuthenticated && !isLoggedIn) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}
