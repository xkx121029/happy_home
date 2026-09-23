#!/usr/bin/env node
/**
 * 一次性脚本（用完即删）：把各模块路由声明里的全路径 `/api/xxx` 改成相对路径 `/xxx`，
 * 版本前缀改由 server.js 统一挂载。
 *
 * 只改 `router.get|post|put|delete|patch('/api/...` 这一种形态，
 * 注释与其它字符串一概不碰。health 模块跳过 —— 它不版本化，仍挂在 /api/health。
 */
import fs from 'node:fs';
import path from 'node:path';

const MODULES = path.resolve(process.cwd(), 'src/modules');
const SKIP = new Set(['health']);
const RE = /(router\.(?:get|post|put|delete|patch)\(\s*['"`])\/api(?=\/)/g;

let files = 0;
let hits = 0;

for (const dir of fs.readdirSync(MODULES)) {
  if (SKIP.has(dir)) continue;
  const file = path.join(MODULES, dir, 'routes.js');
  if (!fs.existsSync(file)) continue;

  const src = fs.readFileSync(file, 'utf8');
  const before = hits;
  const out = src.replace(RE, '$1');
  const count = (src.match(RE) || []).length;

  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    files += 1;
    hits += count;
    console.log(`${path.relative(process.cwd(), file)}  ${count} 处`);
  }
  if (before !== hits) continue;
}

console.log(`\n共改 ${hits} 处，涉及 ${files} 个文件（health 已跳过）`);
