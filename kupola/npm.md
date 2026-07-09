---

## 📦 NPM 包发布全流程清单

### 阶段一：发布前准备（一次性配置）

| 序号 | 操作项 | 具体命令/检查点 | 状态 |
|:---:|:---|:---|:---:|
| 1 | **注册 NPM 账号** | 访问 [npmjs.com](https://www.npmjs.com) 注册 | ☐ |
| 2 | **终端登录 NPM** | `npm login`（输入用户名/密码/OTP） | ☐ |
| 3 | **检查包名是否可用** | `npm search kupola` → ✅ 可用 | ✅ |

---

### 阶段二：`package.json` 核心字段配置

| 序号 | 字段 | 说明与示例 | 状态 |
|:---:|:---|:---|:---:|
| 4 | **`name`** | `"kupola"` | ✅ |
| 5 | **`version`** | `"1.2.0"` | ✅ |
| 6 | **`main`** | `"dist/kupola.cjs.js"` | ✅ |
| 7 | **`module`** | `"dist/kupola.esm.js"` | ✅ |
| 8 | **`exports`** | 多入口导出（`.`, `./css`, `./icons`, `./js/`, `./css/`） | ✅ |
| 9 | **`files`** | `["dist", "js", "css", "icons", "utils", "types", "templates", "README.md", ...]` | ✅ |
| 10 | **`scripts`** | `"build"` 和 `"prepublishOnly": "npm run build"` | ✅ |
| 11 | **`peerDependencies`** | 无（纯 HTML/CSS/JS，无框架依赖） | ✅ |
| 12 | **`license`** | `"MIT"` | ✅ |
| 13 | **`author`** | `"kupola-cn"` | ✅ |

---

### 阶段三：文件与目录整理

| 序号 | 操作项 | 说明 | 状态 |
|:---:|:---|:---|:---:|
| 14 | **创建 `.npmignore`** | 排除 `src/`, `test/`, `casepages/`, `dashboard/`, `examples/`, `node_modules/` | ✅ |
| 15 | **编写 `README.md`** | 包说明、安装、使用示例、6种语言集成示例 | ✅ |
| 16 | **添加 `LICENSE` 文件** | MIT License | ✅ |
| 17 | **确认 `dist/` 目录** | 构建产物完整：ES/CJS/UMD JS、CSS、Icons、Types、Utils | ✅ |

---

### 阶段四：Vite 构建配置（如果使用 Vite）

| 序号 | 操作项 | 配置要点 | 状态 |
|:---:|:---|:---|:---:|
| 18 | **配置 `vite.config.js`** | `build.lib` 入口、`formats: ['es', 'cjs', 'umd']`、copy 插件复制 icons/css/utils | ✅ |
| 19 | **设置 `external`** | 无（纯 HTML/CSS/JS，无框架依赖） | ✅ |
| 20 | **CSS 处理** | `dist/css/kupola.css` 已复制 | ✅ |

---

### 阶段五：发布与验证

| 序号 | 操作项 | 具体命令 | 状态 |
|:---:|:---|:---|:---:|
| 21 | **本地测试（推荐）** | 执行 `npm link` 在测试项目中验证 | ☐ |
| 22 | **执行构建** | `npm run build`（或 `prepublishOnly` 自动触发） | ☐ |
| 23 | **正式发布** | `npm publish` | ☐ |
| 24 | **验证发布成功** | 访问 `npmjs.com/package/你的包名` 查看页面 | ☐ |

---

### 阶段六：版本更新（后续使用）

| 序号 | 操作项 | 具体命令 | 状态 |
|:---:|:---|:---|:---:|
| 25 | **更新补丁版本** | `npm version patch`（`1.0.0` → `1.0.1`） | ☐ |
| 26 | **更新次要版本** | `npm version minor`（`1.0.0` → `1.1.0`） | ☐ |
| 27 | **更新主要版本** | `npm version major`（`1.0.0` → `2.0.0`） | ☐ |
| 28 | **发布新版本** | `npm publish` | ☐ |

---

## ⚡ 快速命令速查

```bash
# 登录
npm login

# 构建
npm run build

# 本地测试
npm link

# 发布
npm publish

# 更新补丁版本并发布
npm version patch && npm publish

# 查看包信息
npm view 你的包名
```

---

## ⚠️ 关键避坑点

| 问题 | 解决方案 |
|:---|:---|
| **包名被占用** | 修改 `name`，或用作用域包：`@你的用户名/包名` |
| **403 权限错误** | 检查是否登录、是否有权限（组织包需权限） |
| **忘了构建就发布** | 添加 `"prepublishOnly": "npm run build"` |
| **发布隐私包** | `package.json` 中加 `"private": true` 可防止误发布 |
| **包含敏感文件** | 用 `.npmignore` 或 `files` 白名单保护 |

---