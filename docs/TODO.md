# Kupola 2.0 后续工作清单

> 基于当前项目状态（2026-07-15）梳理，按优先级排列。
>
> **已完成基线**：48 个 UI 组件 | 883 测试全部通过 | 53 测试套件 | npm 发布 `@next` tag | GitHub 无 1.0 历史

---

## 一、P0 — 发布前必须完成

### 1.1 CI/CD 流水线修复

**现状**：`.github/workflows/ci.yml` 存在以下问题：

- [ ] `npm run build` 脚本可能不存在或指向旧命令，需确认 `package.json` 中 `scripts.build` 指向 `rollup -c`
- [ ] `npm run lint` 需验证能正常执行
- [ ] publish job 需要配置 `NPM_TOKEN` GitHub Secret（目前未配置）
- [ ] publish job 的 `npm publish --access public` 缺少 `--tag next`（当前是 alpha 阶段）
- [ ] 缺少 `create-kupola` 独立仓库的 CI 配置

**验收标准**：push 到 main 自动跑 lint → build → test，tag 触发 npm 发布。

### 1.2 测试覆盖率报告

**现状**：883 个测试通过，但无覆盖率统计。

- [ ] 运行 `jest --coverage` 生成覆盖率报告
- [ ] 识别未覆盖的组件/分支，补充测试
- [ ] 在 CI 中集成覆盖率上报（Codecov 或 Coveralls）
- [ ] 设定最低覆盖率阈值（建议 80%）

### 1.3 npm 包可用性验证

**现状**：包已发布到 npm，但未验证实际安装后能否正常使用。

- [ ] 在新目录 `npm install @kupola/kupola@next`，验证文件完整性
- [ ] 验证 `import { signal, html, render } from '@kupola/kupola'` 可正常解析
- [ ] 验证 `import { Modal } from '@kupola/kupola/components/modal'` 按需引入正常
- [ ] 验证 `import { walk } from '@kupola/kupola/directives'` 指令系统正常
- [ ] 验证 CDN 链接可访问（jsdelivr）
- [ ] 验证 TypeScript 类型定义 `types.d.ts` 可被 IDE 正确识别

### 1.4 从 alpha 到正式版的发布路径

**现状**：`2.0.0-alpha.1`，使用 `@next` tag。

- [ ] 制定 beta → RC → stable 的发布计划
- [ ] 每个阶段需通过完整的回归测试
- [ ] 正式版发布时：`npm dist-tag add @kupola/kupola@2.0.0 latest`
- [ ] 更新文档移除 `@next` 标注
- [ ] 更新 README badge 版本号

---

## 二、P1 — 高优先级（影响用户体验）

### 2.1 文档网站

**现状**：仅有 Markdown 文档（README / CONTRIBUTING / INTEGRATION / CHANGELOG）。

- [ ] 搭建 VitePress 文档站
- [ ] 每个组件独立 API 文档页（Options / Instance / 示例代码）
- [ ] 核心概念页：Signal 响应式、模板字面量、指令系统、SSR
- [ ] 在线代码 playground（可编辑运行示例）
- [ ] 部署到 GitHub Pages 或 Vercel

### 2.2 CSS / 主题系统

**现状**：组件使用内联样式和 `kupola-*` CSS 类名，但无独立 CSS 包发布。

- [ ] 确认组件样式策略：CSS-in-JS vs 外部 CSS 文件
- [ ] 如需外部 CSS，创建 `@kupola/css` 包或将其加入主包
- [ ] 暗色主题完整实现（当前仅 `data-theme="dark"` 切换，无完整暗色变量体系）
- [ ] CSS 变量体系：定义颜色、间距、字号等 design tokens
- [ ] 响应式断点规范

### 2.3 组件补全

**现状**：48 个组件，SlideCaptcha 已跳过。

- [ ] SlideCaptcha 滑块验证码组件（如需要）
- [ ] 评估是否有遗漏的常用组件（如 Upload 拖拽排序、Masonry 瀑布流等）
- [ ] 组件间依赖关系文档（如 Form 包含 Validation）

### 2.4 create-kupola 完善

**现状**：CLI 可用，4 套模板。

- [ ] 添加更多模板选项（如 Next.js SSR、Nuxt 混用）
- [ ] 模板中添加完整的 CSS 引入（当前仅 JS）
- [ ] 支持 `--template` 参数跳过交互式选择
- [ ] 添加 `--typescript` 选项生成 TS 项目

---

## 三、P2 — 中优先级（提升质量）

### 3.1 无障碍（Accessibility）

- [ ] 所有弹层组件添加 ARIA 属性（`role="dialog"`, `aria-modal`, `aria-labelledby`）
- [ ] 键盘导航支持（Tab / Escape / Arrow keys）
- [ ] 焦点管理（Modal 打开时 trap focus，关闭时恢复焦点）
- [ ] 表单组件关联 `<label>` 和 `aria-describedby` 错误提示
- [ ] 颜色对比度符合 WCAG 2.1 AA 标准

### 3.2 国际化（i18n）

- [ ] 组件内置文本可配置（如 Table 的 "No data"、Pagination 的 "Page"）
- [ ] 提供 `Kupola.configure({ locale: 'zh-CN' })` API
- [ ] 内置中英文语言包
- [ ] 日期/时间组件支持多语言格式化

### 3.3 性能优化

- [ ] 各组件 bundle 体积分析，找出可优化项
- [ ] 大列表组件（Table / VirtualList）虚拟滚动性能基准测试
- [ ] Signal 响应式更新性能 profiling
- [ ] Tree-shaking 验证：确保未使用的组件不会被打包
- [ ] 懒加载支持：组件按需异步初始化

### 3.4 测试增强

- [ ] 补充集成测试（多组件协作场景）
- [ ] SSR 水合（hydration）边界情况测试
- [ ] 指令系统复杂场景测试（嵌套 `k-for` + `k-if`、动态组件）
- [ ] 浏览器兼容性测试（Sauce Labs 或 Playwright）
- [ ] 视觉回归测试（Percy 或 Chromatic）

---

## 四、P3 — 低优先级（锦上添花）

### 4.1 生态系统扩展

- [ ] Vite 插件 `@kupola/vite-plugin`（自动按需引入、CSS 注入）
- [ ] Webpack 插件 `@kupola/webpack-plugin`
- [ ] ESLint 插件 `eslint-plugin-kupola`（指令语法检查、组件导入规范）
- [ ] VS Code 扩展（代码片段、指令自动补全、组件文档悬浮提示）
- [ ] Figma 设计系统 / 组件库

### 4.2 开发者体验

- [ ] StackBlitz / CodeSandbox 在线 playground
- [ ] 组件交互式文档（类似 Storybook）
- [ ] `create-kupola` 生成的项目内置示例代码
- [ ] 迁移指南：1.0 → 2.0（API 对照表）
- [ ] 常见问题 FAQ 页面

### 4.3 安全与健壮性

- [ ] XSS 防护审计（模板字面量中的用户输入处理）
- [ ] CSP（Content Security Policy）兼容性验证
- [ ] 错误边界：组件内部异常不导致全局崩溃
- [ ] 内存泄漏检测（Signal effect 清理、组件 destroy 完整性）

---

## 五、项目状态总览

| 维度 | 状态 | 说明 |
|------|------|------|
| 核心引擎 | ✅ 完成 | Signal + Computed + Effect + Template + Render |
| SSR | ✅ 完成 | renderToString + hydrate |
| 指令系统 | ✅ 完成 | k-data / k-show / k-bind / k-on / k-model / k-for |
| UI 组件 | ✅ 48 个 | 覆盖弹层/表单/反馈/数据展示/交互/工具 |
| TypeScript | ✅ 完成 | types.d.ts 覆盖全部 48 个组件 |
| 单元测试 | ✅ 883 个 | 53 套件，全部通过 |
| 构建系统 | ✅ 完成 | 54 个入口，ESM + CJS |
| npm 发布 | ✅ 已发布 | @next tag，2.0.0-alpha.1 |
| GitHub | ✅ 已清理 | 无 1.0 历史，全新提交 |
| create-kupola | ✅ 已发布 | 4 套模板（static/flask/fastapi/gin） |
| 文档网站 | ⏳ 待建 | 需要 VitePress + 组件 API 文档 |
| CI/CD | ⚠️ 需修复 | 脚本引用 / NPM_TOKEN / tag 配置 |
| CSS 体系 | ⏳ 待建 | 无独立 CSS 包 / design tokens |
| 无障碍 | ⏳ 待建 | ARIA / 键盘导航 / 焦点管理 |
| 国际化 | ⏳ 待建 | 组件文本可配置 |
| 覆盖率 | ⏳ 待测 | 需生成报告并补充 |
| 正式版 | ⏳ 待发布 | alpha → beta → RC → stable |

---

## 六、推荐执行顺序

```
Phase 1（1-2 周）
├── 修复 CI/CD 流水线
├── 生成测试覆盖率报告
├── 验证 npm 包可用性
└── 制定正式发布计划

Phase 2（2-4 周）
├── 搭建 VitePress 文档站
├── 完善 CSS / 主题系统
├── 补充组件（如有遗漏）
└── 无障碍基础支持

Phase 3（4-6 周）
├── 国际化支持
├── 性能优化与基准测试
├── 浏览器兼容性测试
└── Beta 版本发布

Phase 4（6-8 周）
├── 生态工具（Vite/Webpack 插件）
├── 交互式组件文档
├── 安全审计
└── 正式版 2.0.0 发布
```
