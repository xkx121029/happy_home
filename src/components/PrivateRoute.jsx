import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    // 未登录，重定向到登录页面
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
