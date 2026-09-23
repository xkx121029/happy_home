import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Send, CheckCircle, Eye, EyeOff } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';
import { passwordResetAPI } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码, 3: 设置新密码
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const handleSendCode = async () => {
    setError('');

    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      // 原来这里是裸 fetch('/api/auth/send-verification-code')。
      // 相对路径在开发环境下会打到 Vite 自己的地址，而 dev server 当时没有配代理，
      // 于是重置密码的三步流程全部 404。统一走 api 层后既修掉这个问题，
      // 也不再重复维护一份请求头与错误处理。
      const result = await passwordResetAPI.sendCode(email);

      if (result.success) {
        setSuccess('验证码已发送到您的邮箱');
        setStep(2);
        setCountdown(60);

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('发送失败，请稍后重试');
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleVerifyCode = async () => {
    setError('');

    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('验证码应为6位数字');
      return;
    }

    try {
      const result = await passwordResetAPI.verifyCode(email, verificationCode);

      if (result.success) {
        setStep(3);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('验证失败，请稍后重试');
    }
  };

  const handleResetPassword = async () => {
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

    try {
      const result = await passwordResetAPI.reset(email, verificationCode, newPassword);

      if (result.success) {
        setSuccess('密码重置成功！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('重置失败，请稍后重试');
    }
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    setVerificationCode('');
    handleSendCode();
  };

  return (
    <div className="w-full">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-accent-fg text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-fg">HappyHome</h1>
          <p className="text-muted mt-1">密码重置</p>
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
          <div className="mb-4 p-3 bg-success/12 text-success rounded-lg text-sm">
            {success}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入注册邮箱"
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleSendCode}
              className="w-full py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              发送验证码
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-accent/12 rounded-lg">
              <p className="text-sm text-accent">
                验证码已发送至 <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">验证码</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerifyCode}
              className="w-full py-3 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
            >
              验证
            </button>

            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={countdown > 0}
                className={`text-sm${countdown > 0 ? 'text-muted' : 'text-accent hover:text-accent'}`}
              >
                {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-success/12 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm text-success">验证码验证成功</span>
            </div>

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
        )}

        <div className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="text-accent hover:text-accent">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
