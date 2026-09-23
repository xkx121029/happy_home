#!/usr/bin/env node
/**
 * 一次性调色搜索（用完即删）：在保持色相与饱和度的前提下，
 * 微调语义色的明度，使所有真实出现的「底色 × 文字色」组合达到 WCAG AA 4.5:1。
 */
const FIXED = {
  light: { bg: [250, 247, 242], surface: [255, 253, 250], s2: [244, 239, 232], fg: [28, 24, 20], fgText: [255, 252, 249] },
  dark: { bg: [22, 19, 15], surface: [30, 26, 21], s2: [39, 34, 28], fg: [242, 236, 228], fgText: [26, 23, 18] },
};

const lum = (c) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const over = (c, bg, a) => c.map((v, i) => v * a + bg[i] * (1 - a));

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}
function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

/** 一个语义色需要满足的全部组合。 */
function checks(rgb, mode, fgForSolid, alphas) {
  const F = FIXED[mode];
  const out = [];
  // 文字色落在三种中性底上
  for (const b of ['surface', 'bg', 's2']) out.push(ratio(rgb, F[b]));
  // 文字色落在自身淡色底上（淡色底再叠在中性底上）
  for (const a of alphas) {
    for (const b of ['surface', 's2']) out.push(ratio(rgb, over(rgb, F[b], a)));
  }
  // 实心底上的反色文字
  out.push(ratio(fgForSolid, rgb));
  return Math.min(...out);
}

const SPECS = [
  { name: 'accent', light: [180, 85, 44], dark: [212, 118, 63], alphas: [0.12], solidFg: 'fgText', tints: { light: [[253, 244, 239], [250, 230, 218]], dark: [[42, 31, 22], [56, 40, 26]] } },
  { name: 'success', light: [47, 107, 79], dark: [92, 168, 128], alphas: [0.12], solidFg: 'fgText' },
  { name: 'warning', light: [169, 118, 27], dark: [208, 160, 66], alphas: [0.14], solidFg: 'fgText' },
  { name: 'danger', light: [168, 58, 42], dark: [214, 106, 88], alphas: [0.12], solidFg: 'fgText' },
  { name: 'info', light: [53, 88, 107], dark: [118, 166, 194], alphas: [0.12], solidFg: 'fgText' },
  { name: 'muted', light: [118, 108, 98], dark: [167, 156, 144], alphas: [], solidFg: null },
];

for (const spec of SPECS) {
  for (const mode of ['light', 'dark']) {
    const base = spec[mode];
    const [h0, s0, l0] = rgbToHsl(base);
    const tintList = (spec.tints && spec.tints[mode]) || [];
    let best = null;
    for (let ds = -0.16; ds <= 0.16; ds += 0.01) {
      for (let dl = mode === 'light' ? -0.20 : 0.20; mode === 'light' ? dl <= 0.02 : dl >= -0.02; dl += mode === 'light' ? 0.005 : -0.005) {
        const s = Math.min(1, Math.max(0.05, s0 + ds));
        const l = Math.min(0.95, Math.max(0.05, l0 + dl));
        const cand = hslToRgb([h0, s, l]);
        const scores = [checks(cand, mode, FIXED[mode][spec.solidFg || 'fgText'], spec.alphas)];
        for (const t of tintList) scores.push(ratio(cand, t));
        const score = Math.min(...scores);
        if (score < 4.55) continue;
        const drift = Math.abs(ds) + Math.abs(dl) * 2;
        if (!best || drift < best.drift) best = { cand, drift, score };
      }
    }
    const curScores = [checks(base, mode, FIXED[mode][spec.solidFg || 'fgText'], spec.alphas)];
    for (const t of tintList) curScores.push(ratio(base, t));
    const cur = Math.min(...curScores);
    console.log(
      `${spec.name.padEnd(8)} ${mode.padEnd(5)} 现状 ${cur.toFixed(2)} → ${
        best ? `${best.cand.join(' ')} (${best.score.toFixed(2)})` : '未找到可行解'
      }   原值 ${base.join(' ')}`
    );
  }
}
