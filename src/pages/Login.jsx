import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { authAPI } from '../services/api';

export default function Login() {
  const { settings } = useSiteSettings();
  const { login, loginWithToken } = useAuth();
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
        // 注册成功后端会直接下发 token。原来调的是 login({ token })，
        // 而 login 会把它当用户名密码去请求 /auth/login（请求体里没有 username），
        // 后端返回 400 —— 注册完根本进不去。
        await loginWithToken(result.token);
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
        // 同上：验证通过后端也直接下发 token
        await loginWithToken(result.token);
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
    <div className="w-full">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-fg text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-fg">HappyHome</h1>
          <p className="text-muted mt-1">欢迎回来</p>
        </div>

        <div className="flex bg-surface-2 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors${
              isLogin ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors${
              !isLogin ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/12 text-danger rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
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
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              登录
            </button>
            {/* 这里原本有一个「快速登录管理员」按钮，点一下就把 admin / admin123 填进表单。
                两个问题：一是把凭据直接印在登录页上，任何访问者都能看见并拿去尝试；
                二是该口令已随公开仓库泄露并且已被轮换，按钮早已失效。
                演示用的快捷入口不应该出现在这个位置，已整体移除。 */}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">验证码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入邮箱验证码"
                  className="w-full pl-10 pr-32 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={handleGetRegisterCode}
                  disabled={codeButtonDisabled || resendLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-surface-2 text-muted rounded-lg hover:bg-line transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? '发送中...' : codeButtonText}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              注册
            </button>
          </form>
        )}

        {showVerification && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-4 bg-success/12 border border-success/40 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-success font-medium">注册成功！</p>
                  <p className="text-xs text-success mt-1">{verificationMessage}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">验证码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入邮箱中的验证码"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-success text-success-fg rounded-lg font-medium hover:bg-success transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              完成验证
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full py-3 bg-surface-2 text-muted rounded-lg font-medium hover:bg-line transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              <p className="text-sm text-muted">
                还没有账户？{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-accent hover:text-accent font-medium"
                >
                  立即注册
                </button>
              </p>
              <p className="text-sm text-muted">
                忘记密码？{' '}
                <Link
                  to="/forgot-password"
                  className="text-accent hover:text-accent font-medium"
                >
                  找回密码
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              已有账户？{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-accent hover:text-accent font-medium"
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
