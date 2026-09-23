/**
 * 站点时区与 UTC 的换算。
 *
 * 背景：前端的 `datetime-local` 产出的是「墙上时间」，形如 `2026-09-23T10:00` ——
 * 没有时区信息。SQLite 的 `datetime()` 会把这种字符串当 UTC 解析，而
 * `datetime('now')` 也是 UTC，于是定时发布在 Asia/Shanghai 下会提前 8 小时触发。
 *
 * 处理办法是把墙上时间在**写入时**就换算成 UTC ISO（带 Z），此后所有比较都
 * 是同一基准，不需要在读的时候再做时区运算。换算需要知道站点时区，
 * 这个值来自「常规」页的 timezone 设置 —— 也就是说那条设置从此刻起真正生效。
 */

const WALL_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** 字符串是否已经带时区信息（Z 或 ±HH:MM）。 */
function hasTimeZone(value) {
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(String(value).trim());
}

/** 某个时刻在指定时区的偏移（分钟，东为正）。 */
function offsetMinutes(timeZone, at = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = {};
    for (const part of formatter.formatToParts(at)) parts[part.type] = part.value;

    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24, // 某些环境会把午夜格式化成 24
      Number(parts.minute),
      Number(parts.second)
    );

    return Math.round((asUtc - at.getTime()) / 60000);
  } catch {
    // 时区名无效时退化为 UTC —— 方向不会错，只是没有偏移
    return 0;
  }
}

/**
 * 把墙上时间按站点时区解释，返回 UTC ISO 字符串。
 *
 * 已经带时区的值原样规整返回（冒烟测试写的就是 ISO Z 串），
 * 因此新旧两种格式混存也不会算错。
 */
function wallTimeToUtc(value, timeZone = 'Asia/Shanghai') {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (hasTimeZone(raw)) {
    const absolute = new Date(raw);
    return Number.isNaN(absolute.getTime()) ? null : absolute.toISOString();
  }
  if (!WALL_TIME_PATTERN.test(raw)) return null;

  const naive = raw.length === 16 ? `${raw}:00` : raw;
  const asUtc = new Date(`${naive}Z`);
  if (Number.isNaN(asUtc.getTime())) return null;

  // 先用「把它当成 UTC」得到的时刻估算偏移，再用真实时刻修正一次，
  // 这样跨夏令时边界也不会差一小时。
  const firstGuess = offsetMinutes(timeZone, asUtc);
  let utc = new Date(asUtc.getTime() - firstGuess * 60000);

  const refined = offsetMinutes(timeZone, utc);
  if (refined !== firstGuess) {
    utc = new Date(asUtc.getTime() - refined * 60000);
  }

  return utc.toISOString();
}

/** 把 UTC ISO 转回指定时区的墙上时间，供 `datetime-local` 输入框使用。 */
function utcToWallTime(value, timeZone = 'Asia/Shanghai') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = offsetMinutes(timeZone, date);
  const shifted = new Date(date.getTime() + offset * 60000);
  return shifted.toISOString().slice(0, 16);
}

module.exports = { hasTimeZone, offsetMinutes, wallTimeToUtc, utcToWallTime };
