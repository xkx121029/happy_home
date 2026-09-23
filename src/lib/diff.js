/**
 * 行级差异。
 *
 * 只做一件事：把两段文本按行对齐，标出哪些行是新增的、哪些是删除的、
 * 哪些没变。自写约 60 行而不是引 diff / diff-match-patch —— 需求就是
 * 「并排看两个版本的正文哪里不一样」，不需要字符级精细度、不需要三方合并、
 * 不需要补丁输出，为此多一个依赖不划算。
 *
 * 算法是标准的 LCS 动态规划。正文按行切开后通常只有几十到几百行，
 * O(n·m) 的表格完全够用（300 行 × 300 行 = 9 万格）。
 * 但极端情况要考虑：一篇 5000 行的长文会产生 2500 万格，
 * 所以超过阈值时退化为「逐行对位比较」—— 结果没那么精细，但不会卡死页面。
 */

/** 超过这个行数就不再建 DP 表。 */
const LCS_LINE_LIMIT = 1200;

/**
 * 按行切分。保留空行 —— 空行是段落分隔，丢掉会让 diff 看起来全挤在一起。
 * 行尾统一去掉 \r，否则 CRLF 与 LF 混用时会每一行都判成不同。
 */
function splitLines(text) {
  if (!text) return [];
  return text.replace(/\r\n?/g, '\n').split('\n');
}

/**
 * 逐行对位比较。LCS 表太大时的退化路径。
 * @returns {Array<{type: 'same'|'add'|'del', text: string}>}
 */
function positionalDiff(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === undefined) out.push({ type: 'add', text: right });
    else if (right === undefined) out.push({ type: 'del', text: left });
    else if (left === right) out.push({ type: 'same', text: left });
    else {
      out.push({ type: 'del', text: left });
      out.push({ type: 'add', text: right });
    }
  }
  return out;
}

/**
 * 两个文本的行级差异。
 *
 * 返回的每一项都带 type：
 *   same —— 两边都有且相同
 *   del  —— 只在旧版本里（对比视图的左侧）
 *   add  —— 只在新版本里（对比视图的右侧）
 *
 * 调用方据此渲染并排视图：遍历同一个数组，same/del 填左列，
 * same/add 填右列，del 与 add 分别着红/绿底 —— 这样左右两列天然对齐。
 *
 * @param {string} oldText 旧版本（该修订）
 * @param {string} newText 新版本（当前）
 */
export function diffLines(oldText, newText) {
  const a = splitLines(oldText);
  const b = splitLines(newText);

  if (a.length > LCS_LINE_LIMIT || b.length > LCS_LINE_LIMIT) {
    return positionalDiff(a, b);
  }

  // dp[i][j] = a[i..] 与 b[j..] 的最长公共子序列长度
  const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i += 1;
    } else {
      out.push({ type: 'add', text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) out.push({ type: 'del', text: a[i++] });
  while (j < b.length) out.push({ type: 'add', text: b[j++] });

  return out;
}

/**
 * 差异摘要，用于列表里的一句话说明（「新增 12 行，删除 3 行」）。
 * 不传就只统计条目数。
 */
export function summarizeDiff(parts) {
  let added = 0;
  let removed = 0;
  for (const part of parts) {
    if (part.type === 'add') added += 1;
    else if (part.type === 'del') removed += 1;
  }
  return { added, removed, changed: added + removed };
}
