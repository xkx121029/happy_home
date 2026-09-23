import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      // 模拟验证 token
      setTimeout(() => {
        setIsValidating(false);
        setIsValidToken(true);
      }, 1000);
    } else {
      setIsValidating(false);
      setIsValidToken(false);
    }
  }, [searchParams]);

  const handleResetPassword = () => {
    setError('');

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 模拟密码重置成功
    setSuccess('密码重置成功！');
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  if (isValidating) {
    return (
      <div className="w-full">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-fg text-2xl font-bold">H</span>
          </div>
          <p className="text-muted">正在验证链接...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="w-full">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-danger/12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-2">链接已失效</h2>
          <p className="text-muted mb-6">
            此密码重置链接已过期或无效，请重新申请密码重置。
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
          >
            重新申请
          </Link>
          <div className="mt-4">
            <Link to="/login" className="text-sm text-accent hover:text-accent">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-fg text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-fg">HappyHome</h1>
          <p className="text-muted mt-1">设置新密码</p>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </Link>

        {error && (
          <div className="mb-4 p-3 bg-danger/12 text-danger rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-success/12 text-success rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">新密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                className="w-full pl-10 pr-12 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-2">确认新密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            className="w-full py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
          >
            重置密码
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-accent hover:text-accent">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
