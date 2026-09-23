import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// 说明：原配置对所有 **/*.{js,jsx} 统一套用了 globals.browser，
// 但 backend/ 是 CommonJS 的 Node 代码，于是 require / module / process 全部被
// 报成 no-undef（38 条里的大多数）。这里按运行环境拆成三块。
export default [
  { ignores: ['dist', 'node_modules', 'backend/node_modules', 'backend/backups'] },

  // 前端源码：浏览器环境
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        // 参数与变量用同一套约定。原因：项目没装 eslint-plugin-react，
        // 于是「只在 JSX 里出现的标识符」（如 `{ as: Tag }` 后用 `<Tag />`）
        // 不被算作引用，PascalCase 的组件型参数会被误报成未使用。
        // 变量侧早就有 ^[A-Z_] 这个豁免，参数侧保持一致即可。
        argsIgnorePattern: '^[A-Z_]',
        // catch 里不用的 error 很常见，不值得为此写一堆 void error
        caughtErrors: 'none',
      }],
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          // Provider 与它的 hook 写在同一个文件里是 React 官方文档的写法，
          // 而这些 hook / 常量 / HOC 会被规则当成「非组件导出」误报。
          // 不为它们拆文件：拆了要改几十处 import，而 context 文件本来
          // 也不享受 Fast Refresh（改它一定会整页刷新）。
          allowExportNames: [
            'useAuth',
            'useData',
            'useSiteSettings',
            'useTheme',
            'useNetwork',
            'useError',
            'useNotification',
            'withErrorHandler',
            'withAsyncErrorHandler',
            'NotificationType',
            'ErrorType',
            'ErrorSeverity',
            'sharePlatforms',
          ],
        },
      ],
      // console.log 是调试残留的高发区，禁止新增。
      // console.error / warn 保留：错误路径上的诊断信息不该被删掉，
      // 删了反而让线上问题无从排查。
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },

  // 构建与配置文件：Node 环境 + ESM
  {
    files: ['*.config.js', 'vite.config.js', 'eslint.config.js', 'postcss.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: js.configs.recommended.rules,
  },

  // 后端：Node 环境 + CommonJS
  {
    files: ['backend/**/*.js'],
    ignores: ['backend/scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
    },
  },

  // 后端脚本：Node 环境 + ESM
  {
    files: ['backend/scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
]