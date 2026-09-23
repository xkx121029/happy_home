/**
 * className 合并。全站有大量 `className={`base${cond ? 'a' : 'b'}`}` 的写法，
 * 拼错或多一个空格都会产生无效类名，这里统一处理。
 */
export function cn(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string' || typeof arg === 'number') {
      out.push(String(arg));
    } else if (Array.isArray(arg)) {
      const nested = cn(...arg);
      if (nested) out.push(nested);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(' ');
}

export default cn;