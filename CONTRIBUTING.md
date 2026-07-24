# 贡献指南

感谢你对 Kupola 的兴趣！我们欢迎所有形式的贡献，包括 Issue、PR、文档改进和示例补充。

请遵守 [Code of Conduct](./CODE_OF_CONDUCT.md)。

---

## 开发环境准备

```
Node.js >= 18.x
npm >= 9.x
```

---

## 一键启动

```bash
git clone https://github.com/kupola-cn/kupola.git
cd kupola
npm ci
npm run verify       # 执行核心 lint、类型、测试、构建、包和文档门禁
npm run docs:dev     # 启动文档开发服务器
```

---

## 项目结构

```
kupola/
├── packages/
│   ├── core/            # @kupola/core 核心引擎
│   │   ├── src/         # 响应式系统、模板引擎、渲染器、指令系统
│   │   │   ├── signal.js    # Signal 响应式原语
│   │   │   ├── computed.js  # Computed 派生值
│   │   │   ├── effect.js    # Effect 副作用
│   │   │   ├── template.js  # 模板字面量引擎
│   │   │   ├── render.js    # DOM 渲染器
│   │   │   ├── server.js    # SSR（renderToString + hydrate）
│   │   │   ├── directives.js # 声明式指令系统（k-*）
│   │   │   ├── lazy.js      # 懒加载组件
│   │   │   ├── devtools.js  # 性能分析器
│   │   │   └── index.js     # 核心公共入口
│   │   └── __tests__/   # 单元测试
│   ├── components/      # @kupola/components UI 组件库（40+ 组件）
│   │   ├── src/
│   │   │   ├── components/  # UI 组件（每个组件一个文件）
│   │   │   └── index.js     # 组件导出入口
│   │   └── README.md
│   ├── ai-adapter/      # @kupola/ai-adapter AI 适配器
│   │   ├── src/         # 意图解析、流程引擎、对话面板
│   │   └── __tests__/
│   ├── create-kupola/   # @kupola/create-kupola 项目脚手架
│   │   ├── index.js     # CLI 入口
│   │   └── templates/   # 项目模板（static、nextjs、nuxt、flask、fastapi、gin）
│   ├── css/             # 样式包（tokens、components、responsive）
│   └── vscode-kupola/   # VS Code 扩展（代码片段、智能提示）
├── docs-site/           # VitePress 文档站点
├── test/                # Jest 全局 setup
└── *.config.*           # 构建 & 工具配置
```

---

## 代码规范

```bash
npm run lint:directives  # 当前发布阻断的指令核心 ESLint 检查
npm run types:check      # 公开消费者类型检查
npm run test             # 单元与集成测试
npm run format           # Prettier 格式化
```

`npm run lint` 是全仓债务报告，目前不是发布门禁。组件库、AI adapter、
主题和其他模块的 lint 问题应在各自专项中修复，不要把无关批量格式化混入
directives 核心变更。

**核心规则**：

- 使用 `const` / `let`，禁止 `var`
- 禁止 `console.log` 提交到生产（`console.warn` / `console.error` 除外）
- 公开 API 必须有 JSDoc 注释或 TypeScript 类型声明
- 所有组件遵循工厂函数模式：`Component(options) → { element, destroy, ... }`
- CSS 类名统一使用 `kupola-` 前缀（如 `kupola-modal-overlay`）

**可访问性 (A11Y) 规则**：

- 交互组件必须添加适当的 ARIA 属性（`role`、`aria-*`）
- 支持键盘导航（Tab、Enter、Escape、方向键）
- 表单组件必须有标签关联（`label` 或 `aria-label`）
- 颜色对比度符合 WCAG AA 标准（至少 4.5:1）

**国际化 (i18n) 规则**：

- 所有用户可见的文本必须使用 `t()` 函数翻译
- 翻译键名使用小写英文，用点分隔（如 `modal.close`）
- 支持参数插值（如 `t('form.min', { min: 10 })`）
- 日期/数字格式化使用 `formatDate()` / `formatNumber()` 等 API

---

## Commit 规范

Kupola 使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，提交信息格式如下：

```
<type>(<scope>): <description>

<body>

<footer>
```

### Commit 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码风格（不影响功能） |
| `refactor` | 重构（既不是新功能也不是修复） |
| `perf` | 性能优化 |
| `test` | 添加/修改测试 |
| `chore` | 构建/工具/依赖更新 |
| `revert` | 撤销之前的提交 |

### 示例

```bash
# 新功能
feat(components): add DatePicker component

# Bug 修复
fix(directives): fix k-model not updating on blur

# 文档更新
docs: update installation guide

# 性能优化
perf(signal): optimize signal subscription cleanup
```

### Scope 可选值

- `core` - 核心引擎
- `components` - UI 组件
- `directives` - 指令系统
- `ai-adapter` - AI 适配器
- `css` - 样式
- `docs` - 文档
- `build` - 构建配置

---

## 新增组件流程

1. 在 `packages/components/src/components/` 创建组件文件（如 `my-component.js`）
2. 在 `packages/core/__tests__/components/` 创建测试文件
3. 在 `packages/components/src/components/types.d.ts` 添加类型声明
4. 在 `package.json` 和 `packages/components/package.json` 添加 exports 映射
5. 在 `.size-limit.json` 添加体积限制
6. 更新 `docs-site/components/` 下的组件文档
7. 运行 `npm run test` 确认全部通过

`rollup.config.cjs` 会自动扫描 `packages/components/src/components/*.js` 生成组件构建入口，新增组件不需要手工修改 Rollup 配置。

---

## 提交 PR 前检查清单

- [ ] 代码通过核心 CI 检查（`npm run verify`）
- [ ] 新增功能 / 组件包含测试用例
- [ ] 更新了相关文档（README / INTEGRATION / JSDoc）
- [ ] `npm run build` 构建成功
- [ ] 新增组件体积未超过 `.size-limit.json` 中的限制
- [ ] 已在 Chrome / Firefox / Safari 最新版手动测试

---

## Issue 提交规范

- **Bug 报告**：请提供最小复现代码或仓库，注明浏览器版本和 Kupola 版本
- **功能建议**：描述使用场景和期望 API，便于讨论
- **文档纠错**：直接提 PR 更高效，我们会在 24h 内 review

模板路径：`.github/ISSUE_TEMPLATE/`

---

## 联系方式

如有问题，可在 [GitHub Discussions](https://github.com/kupola-cn/kupola/discussions) 提问。
