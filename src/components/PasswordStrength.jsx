import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function PasswordStrength({ password }) {
  const [strength, setStrength] = useState({ level: 0, label: '', color: '' });

  useEffect(() => {
    if (!password) {
      setStrength({ level: 0, label: '', color: '' });
      return;
    }

    let score = 0;

    // 长度检查
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // 包含数字
    if (/\d/.test(password)) score++;

    // 包含小写字母
    if (/[a-z]/.test(password)) score++;

    // 包含大写字母
    if (/[A-Z]/.test(password)) score++;

    // 包含特殊字符
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

    let level, label, color;

    if (score <= 2) {
      level = 1;
      label = '弱';
      color = 'bg-red-500';
    } else if (score <= 4) {
      level = 2;
      label = '中';
      color = 'bg-yellow-500';
    } else {
      level = 3;
      label = '强';
      color = 'bg-green-500';
    }

    setStrength({ level, label, color });
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-colors duration-100${strength.color}`}
            style={{ width: `${(strength.level / 3) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium${
          strength.level === 1 ? 'text-danger' :
          strength.level === 2 ? 'text-warning' :
          'text-success'
        }`}>
          {strength.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted">
        <div className="flex items-center gap-1">
          {password.length >= 6 ? (
            <CheckCircle className="w-3 h-3 text-success" />
          ) : (
            <XCircle className="w-3 h-3 text-muted" />
          )}
          <span>至少6位</span>
        </div>
        <div className="flex items-center gap-1">
          {/[a-z]/.test(password) && /[A-Z]/.test(password) ? (
            <CheckCircle className="w-3 h-3 text-success" />
          ) : (
            <XCircle className="w-3 h-3 text-muted" />
          )}
          <span>大小写字母</span>
        </div>
        <div className="flex items-center gap-1">
          {/\d/.test(password) ? (
            <CheckCircle className="w-3 h-3 text-success" />
          ) : (
            <XCircle className="w-3 h-3 text-muted" />
          )}
          <span>包含数字</span>
        </div>
        <div className="flex items-center gap-1">
          {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? (
            <CheckCircle className="w-3 h-3 text-success" />
          ) : (
            <XCircle className="w-3 h-3 text-muted" />
          )}
          <span>特殊字符</span>
        </div>
      </div>
    </div>
  );
}
