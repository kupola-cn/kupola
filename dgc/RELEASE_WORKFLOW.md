# Kupola Release Workflow

本文档描述 Kupola 的版本发布流程，包括 Git 提交规范和 npm 发布步骤。

---

## 一、Git 工作流

### 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定版本，每次发布从此分支推送 |

### 提交规范

Commit message 格式：`<type>: <description>`

| Type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add color picker component` |
| `fix` | 修复 bug | `fix: modal close button alignment` |
| `docs` | 文档变更 | `docs: update README examples` |
| `refactor` | 重构（无功能变化） | `refactor: simplify data-bind proxy` |
| `chore` | 构建/工具变更 | `chore: update CI workflow` |
| `release` | 版本发布 | `release: v1.4.0` |

### 推送流程

```powershell
# 1. 确保在 main 分支
git checkout main

# 2. 拉取最新代码
git pull origin main

# 3. 提交变更
git add -A
git commit -m "feat: your change description"

# 4. 推送到 GitHub
git push origin main
```

---

## 二、版本发布流程

### 1. 更新版本号

修改以下两个文件中的 `version` 字段：

- `package.json`
- `version.json`

版本号遵循 [Semantic Versioning](https://semver.org/)：

| 变更类型 | 版本变化 | 示例 |
|----------|----------|------|
| 修复 bug | `1.3.1` → `1.3.2` | patch |
| 新功能（向后兼容） | `1.3.2` → `1.4.0` | minor |
| 破坏性变更 | `1.4.0` → `2.0.0` | major |

### 2. 更新 CHANGELOG.md

在文件顶部（`# Changelog` 之后）添加新版本记录：

```markdown
## [1.4.0] - 2026-07-15

### Added
- New color picker component
- HTTP client plugin system

### Fixed
- Modal z-index issue on mobile
```

### 3. 构建

```powershell
npm run build
```

确认 `dist/` 目录已更新。

### 4. 提交并推送

```powershell
git add -A
git commit -m "release: v1.4.0"
git push origin main
```

### 5. 发布到 npm

```powershell
# 生成 tarball
npm pack

# 发布（使用 automation token，不需要 OTP）
npm publish kupola-kupola-1.4.0.tgz --auth-token=你的完整token
```

> **重要**：`--auth-token` 必须使用完整未脱敏的 token 字符串。

### 6. 验证发布

```powershell
npm view @kupola/kupola
```

确认版本号、描述、关键词正确。

---

## 三、npm Token 管理

### 创建 Automation Token

1. 访问 https://www.npmjs.com/settings/~/tokens
2. 点击 **Generate New Token**
3. 选择 **Automation**
4. 权限：**Read and write**
5. 勾选 **Bypass two-factor authentication (2FA)**
6. 复制完整 token（只显示一次！）

### 使用 Token

```powershell
# 方式一：命令行参数
npm publish kupola-kupola-x.x.x.tgz --auth-token=完整token

# 方式二：写入 .npmrc（推荐本地开发）
npm config set //registry.npmjs.org/:_authToken "完整token"
npm publish kupola-kupola-x.x.x.tgz
```

### Token 过期处理

Automation Token 有有效期（通常 90 天）。过期后：
1. 在 npmjs.com 删除旧 token
2. 按上述步骤创建新 token
3. 更新本地 `.npmrc` 或 CI secrets 中的 token

---

## 四、注意事项

- 每次发布前必须 `npm run build`，确保 `dist/` 是最新的
- `dist/` 不在 git 追踪中（已在 .gitignore），但会包含在 npm 包中
- `examples/`、`test/`、`docs/` 等开发文件已在 .npmignore 中排除，不会发布到 npm
- GitHub Actions CI 会在 push 时自动运行 lint + build + test
