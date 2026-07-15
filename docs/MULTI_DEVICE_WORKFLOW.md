# 多设备开发指南

> 适用于在公司电脑和家里电脑之间切换开发 Kupola 项目。

---

## 一、首次设置（家里电脑）

### 1. 安装必要工具

```bash
# 确认 Node.js >= 16.x（推荐 20.x）
node -v

# 确认 npm >= 8.x
npm -v

# 确认 git
git -v
```

如果未安装：
- Node.js：https://nodejs.org （下载 LTS 版本）
- Git：https://git-scm.com

### 2. 配置 Git 和 npm

```bash
# Git 身份（必须与 GitHub 账号一致）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# SSH 密钥（如果没有的话）
ssh-keygen -t ed25519 -C "你的邮箱"
# 将公钥添加到 GitHub → Settings → SSH and GPG keys

# npm 登录
npm login
# 输入 kupola 账号密码
```

### 3. 克隆仓库

```bash
# 主仓库
git clone git@github.com:kupola-cn/kupola.git
cd kupola
npm install

# 验证
npm run test
```

### 4. 验证环境

```bash
# 运行全部测试（应看到 883 tests passed）
npm run test

# 构建（应生成 dist/ 目录）
npm run build:core

# 确认无报错
```

---

## 二、日常开发流程

### 开始工作前 — 拉取最新代码

```bash
git checkout main
git pull origin main
npm install          # 如果 package.json 有变更
```

### 开发过程中

```bash
# 写代码...
# 修改组件后运行测试
npm run test

# 确认无误后提交
git add .
git commit -m "feat: 描述你的改动"
git push origin main
```

### 结束工作时 — 确保推送完成

```bash
# 确认所有改动已推送
git status           # 应显示 "nothing to commit, working tree clean"
git push origin main
```

---

## 三、切换到另一台电脑

```bash
# 1. 推送当前电脑所有改动
git add .
git commit -m "wip: 保存进度"
git push origin main

# 2. 到另一台电脑
git pull origin main
npm install          # 同步依赖
```

> **注意**：`node_modules/` 和 `dist/` 不在 git 中，每次 `pull` 后需 `npm install`。

---

## 四、发布新版本

```bash
# 1. 更新版本号
npm version minor    # 2.0.0-alpha.1 → 2.0.0-alpha.2
# 或
npm version patch    # 2.0.0-alpha.1 → 2.0.0-alpha.2

# 2. 构建
npm run build:core

# 3. 测试
npm run test

# 4. 发布（alpha 阶段用 @next tag）
npm publish --access public --tag next --ignore-scripts

# 5. 推送版本 tag
git push origin main
git push origin --tags
```

正式发布 2.0.0 时：

```bash
npm version 2.0.0
npm publish --access public
npm dist-tag add @kupola/kupola@2.0.0 latest
git push origin main
git push origin --tags
```

---

## 五、create-kupola 独立仓库

create-kupola 有独立的 GitHub 仓库，操作方式不同：

```bash
# 首次克隆
git clone git@github.com:kupola-cn/create-kupola.git
cd create-kupola
npm install

# 日常开发
git pull origin main
# ... 修改代码 ...
git add .
git commit -m "fix: 描述改动"
git push origin main

# 发布
npm version patch
npm publish --access public --tag next
git push origin main
git push origin --tags
```

> **同步方式**：主仓库 `packages/create-kupola/` 和独立仓库内容应保持一致。
> 修改后两边都要推送。

---

## 六、常见问题

### Q: `npm run test` 报错 `Cannot find module`

```bash
rm -rf node_modules
npm install
```

### Q: `git pull` 冲突

```bash
# 暂存本地改动
git stash

# 拉取
git pull origin main

# 恢复
git stash pop
# 如有冲突，手动解决后 git add + git commit
```

### Q: 家里电脑忘了 push，公司电脑要先改

```bash
# 家里电脑先 push
git push origin main

# 公司电脑拉取
git pull origin main
```

### Q: npm publish 报 403

```bash
# 确认登录身份
npm whoami
# 应输出: kupola

# 如未登录
npm login
```

### Q: 构建产物 dist/ 要不要提交到 git？

**不需要**。`dist/` 已在 `.gitignore` 中排除。每次发布前本地构建即可。

---

## 七、快速检查清单

每次切换设备时确认：

- [ ] `git pull` 拉取最新代码
- [ ] `npm install` 同步依赖
- [ ] `npm run test` 确认测试通过
- [ ] 离开前 `git push` 推送所有改动
