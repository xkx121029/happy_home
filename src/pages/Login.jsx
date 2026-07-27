import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { authAPI } from '../services/api';

export default function Login() {
  const { settings, login } = useData();
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [codeButtonText, setCodeButtonText] = useState('获取验证码');
  const [codeButtonDisabled, setCodeButtonDisabled] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('请输入用户名和密码');
      setLoading(false);
      return;
    }

    try {
      await login({ username, password });
      navigate('/admin');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRegisterCode = async () => {
    if (!email) {
      setError('请先输入邮箱地址');
      return;
    }

    setResendLoading(true);
    try {
      const result = await authAPI.sendRegisterCode({ email });
      if (result.success) {
        setError('');
        setCodeButtonText('60秒后重新获取');
        setCodeButtonDisabled(true);
        setCodeCountdown(60);
        
        timerRef.current = setInterval(() => {
          setCodeCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setCodeButtonText('获取验证码');
              setCodeButtonDisabled(false);
              return 0;
            }
            setCodeButtonText(`${prev - 1}秒后重新获取`);
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setResendLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !email || !password || !confirmPassword || !verificationCode) {
      setError('请填写所有字段，包括验证码');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      setLoading(false);
      return;
    }

    try {
      const result = await authAPI.register({ username, email, password, code: verificationCode });
      if (result.success) {
        await login({ token: result.token });
        navigate('/admin');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.verify({ userId, code: verificationCode });
      if (result.success) {
        await login({ token: result.token });
        navigate('/admin');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const result = await authAPI.resendVerification({ userId });
      if (result.success) {
        setVerificationMessage('验证邮件已重新发送，请查收邮箱');
        setError('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || '发送失败');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HappyHome</h1>
          <p className="text-gray-500 mt-1">欢迎回来</p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              登录
            </button>

            {settings?.showQuickLoginButton !== false && (
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="w-full py-3 mt-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                快速登录管理员
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入邮箱验证码"
                  className="w-full pl-10 pr-32 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleGetRegisterCode}
                  disabled={codeButtonDisabled || resendLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? '发送中...' : codeButtonText}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              注册
            </button>
          </form>
        )}

        {showVerification && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">注册成功！</p>
                  <p className="text-xs text-green-600 mt-1">{verificationMessage}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入邮箱中的验证码"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              完成验证
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  重新发送验证码
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center space-y-2">
          {isLogin ? (
            <>
              <p className="text-sm text-gray-500">
                还没有账户？{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  立即注册
                </button>
              </p>
              <p className="text-sm text-gray-500">
                忘记密码？{' '}
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  找回密码
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              已有账户？{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即登录
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
