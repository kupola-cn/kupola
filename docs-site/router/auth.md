# 权限管理

`@kupola/auth` 提供基于 RBAC（基于角色的访问控制）的权限管理系统，支持 ABAC 属性过滤、元素级 `k-permission` 指令、HTTP 请求守卫和路由工具。

## 安装

```bash
npm install @kupola/auth
```

## 快速开始

### 1. 创建认证上下文

```js
import { createAuthContext } from '@kupola/auth'

const auth = createAuthContext({
  id: '1',
  name: 'Admin',
  role: 'admin',
  permissions: ['user:read', 'user:write', 'user:delete'],
  attributes: { department: 'sales' },
})

console.log(auth.isAuthenticated) // true
console.log(auth.hasRole('admin')) // true
console.log(auth.hasPermission('user:read')) // true
```

### 2. 注册权限处理器

```js
import { registerPermissionHandler, getAuthContext } from '@kupola/auth'

registerPermissionHandler({
  check: (permission) => {
    const auth = getAuthContext()
    if (permission.startsWith('role:')) {
      return auth.hasRole(permission.slice(5))
    }
    return auth.hasPermission(permission)
  },
})
```

### 3. 使用 k-permission 指令

```js
import { registerDirective, walk } from '@kupola/platform/directives'
import { registerPermissionDirective } from '@kupola/auth'

// 注册权限指令
registerPermissionDirective(registerDirective)
walk(document.body)
```

```html
<button k-permission="user:delete">删除用户</button>
<button k-permission="role:admin">管理面板</button>
<button
  k-permission='["user:edit", "role:admin"]'
  k-permission-mode="disabled"
>编辑</button>
```

### 4. HTTP 守卫

```js
import { createHttpGuard } from '@kupola/auth'

const api = createHttpGuard({
  beforeRequest: (config) => {
    const auth = getAuthContext()
    if (!auth.hasPermission(config.requiredPermission)) {
      throw new Error('PERMISSION_DENIED')
    }
    return config
  },
})

api.get('/api/users', { requiredPermission: 'user:read' })
```

## AuthContext API

### createAuthContext(user)

从用户数据创建认证上下文。同时设置到默认 store 中。

```js
createAuthContext(user)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `user.id` | `string \| number` | 用户唯一标识。`0` 和正整数被视为已验证。 |
| `user.name` | `string` | 用户名。 |
| `user.role` | `string` | 角色名，默认 `''`。 |
| `user.permissions` | `string[]` | 权限列表，默认 `[]`。 |
| `user.attributes` | `Record<string, any>` | 自定义属性，默认 `{}`。 |

**返回值**：`AuthContext` 对象。

```js
const auth = createAuthContext({
  id: 'user-1',
  name: '张三',
  role: 'editor',
  permissions: ['article:read', 'article:write'],
  attributes: { department: 'editorial', level: 3 },
})
```

### AuthContext 属性

```js
{
  user: { id, name, role, permissions, attributes, ... },
  role: 'editor',
  permissions: ['article:read', 'article:write'],
  attributes: { department: 'editorial', level: 3 },
  isAuthenticated: true,
  hasRole(role) { /* ... */ },
  hasPermission(permission) { /* ... */ },
  hasAnyPermission(permissions) { /* ... */ },
  hasAllPermissions(permissions) { /* ... */ },
}
```

| 方法 | 说明 |
|------|------|
| `hasRole(role)` | 检查是否拥有指定角色。 |
| `hasPermission(permission)` | 检查是否拥有指定权限。 |
| `hasAnyPermission(permissions)` | 检查是否拥有任意一个权限。 |
| `hasAllPermissions(permissions)` | 检查是否拥有全部权限。 |

```js
auth.hasRole('admin')                         // false
auth.hasPermission('article:read')            // true
auth.hasAnyPermission(['user:read', 'article:read'])  // true
auth.hasAllPermissions(['article:read', 'user:read']) // false
```

### hydrateAuthContext()

从 DOM 属性 `data-kupola-auth` 恢复认证上下文（SSR 场景）。

```js
const auth = hydrateAuthContext()
```

服务端渲染时，将认证数据序列化到 HTML 属性中：

```html
<html data-kupola-auth='{"id":"1","name":"Admin","role":"admin","permissions":["user:read"]}'>
```

客户端调用 `hydrateAuthContext()` 自动解析并创建上下文。

### getAuthContext() / setAuthContext(context)

获取或设置当前认证上下文。

```js
const auth = getAuthContext()

setAuthContext(newAuth)
setAuthContext(null) // 清除认证状态
```

### onAuthContextChange(callback)

监听认证上下文变化。返回取消监听的函数。

```js
const unsubscribe = onAuthContextChange((context) => {
  if (context) {
    console.log('用户已登录:', context.user.name)
  } else {
    console.log('用户已登出')
  }
})
```

## 权限处理器 API

### registerPermissionHandler(options)

注册全局权限检查处理器。

```js
registerPermissionHandler(options)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `options.check` | `(permission: string) => boolean` | 权限检查函数，必须同步返回布尔值。 |
| `options.defaultMode` | `'hide' \| 'disabled' \| 'fallback'` | 默认处理模式，默认 `'hide'`。 |
| `options.disabledClass` | `string` | 禁用模式下的 CSS 类名，默认 `'k-permission-disabled'`。 |
| `options.fallback` | `(element, permission) => void` | 自定义 fallback 渲染函数。 |
| `options.cache` | `boolean` | 是否缓存检查结果，默认 `true`。 |
| `options.onChange` | `(callback) => () => void` | 注册权限变更回调，返回取消监听函数。 |

```js
registerPermissionHandler({
  check: (permission) => {
    const auth = getAuthContext()
    if (!auth) return false

    // 支持 role: 前缀
    if (permission.startsWith('role:')) {
      return auth.hasRole(permission.slice(5))
    }

    // 支持 attr: 前缀 (ABAC)
    if (permission.startsWith('attr:')) {
      const [_, key, value] = permission.split(':')
      return auth.attributes[key] === value
    }

    return auth.hasPermission(permission)
  },
  defaultMode: 'disabled',
  fallback: (el, perm) => {
    el.textContent = `需要权限: ${Array.isArray(perm) ? perm.join(', ') : perm}`
  },
})
```

### getPermissionHandler()

获取当前权限处理器。

```js
const handler = getPermissionHandler()
```

### clearPermissionHandler()

清除权限处理器。

```js
clearPermissionHandler()
```

### onPermissionHandlerChange(callback)

监听权限处理器变化。

```js
const unsubscribe = onPermissionHandlerChange((handler) => {
  console.log('权限处理器已更新')
})
```

## k-permission 指令

### 指令属性

| 属性 | 说明 |
|------|------|
| `k-permission` | 权限标识，可以是字符串或 JSON 数组。 |
| `k-permission-mode` | 处理模式：`'hide'`（隐藏）、`'disabled'`（禁用）、`'fallback'`（替换内容）。 |
| `k-permission-match` | 匹配模式：`'any'`（任一满足）、`'all'`（全部满足）。 |
| `k-permission-class` | 禁用模式下的 CSS 类名。 |
| `k-permission-fallback` | fallback 模式的替换文本。 |
| `k-permission-cache` | 是否缓存结果，默认 `true`。 |

### 基本用法

```html
<!-- 隐藏模式（默认）：无权限时 display:none -->
<button k-permission="user:delete">删除</button>

<!-- 禁用模式：无权限时 disabled + 添加类名 -->
<button k-permission="user:edit" k-permission-mode="disabled">编辑</button>

<!-- fallback 模式：无权限时替换内容 -->
<button k-permission="admin:panel" k-permission-mode="fallback"
        k-permission-fallback="无权限">管理面板</button>

<!-- 多权限检查：任一满足 -->
<button k-permission='["user:edit", "role:admin"]'
        k-permission-match="any">编辑</button>

<!-- 多权限检查：全部满足 -->
<button k-permission='["user:edit", "user:delete"]'
        k-permission-match="all">批量操作</button>
```

### 注册指令

```js
import { registerDirective } from '@kupola/platform/directives'
import { registerPermissionDirective } from '@kupola/auth'

// 注册到平台指令系统
registerPermissionDirective(registerDirective)

// 之后 walk() 会自动处理 k-permission 指令
walk(document.body)
```

### 手动处理

如果不想全局注册，可以手动处理指定容器内的权限指令：

```js
import { processPermissionDirectives } from '@kupola/auth'

const instances = processPermissionDirectives(document.querySelector('#app'))

// 销毁
instances.forEach(inst => inst.destroy())
```

### createPermissionDirectiveDefinition(options?)

创建可在平台 customDirectives 中使用的指令定义：

```js
import { createPermissionDirectiveDefinition } from '@kupola/auth'
import { createApp } from '@kupola/platform'

const app = createApp(/* template */, {
  customDirectives: {
    'k-permission': createPermissionDirectiveDefinition(),
  },
})
```

### clearCache()

清除权限检查缓存。

```js
import { clearCache } from '@kupola/auth'

clearCache()
```

## HTTP Guard API

### createHttpGuard(options?)

创建带权限检查的 HTTP 客户端。

```js
const api = createHttpGuard(options?)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `options.beforeRequest` | `(config) => RequestConfig \| void` | 请求前拦截器。 |
| `options.afterResponse` | `(response) => Response \| void` | 响应后拦截器。 |
| `options.onPermissionDenied` | `(error) => void` | 权限拒绝回调。 |
| `options.onUnauthorized` | `(error) => void` | 未授权回调。 |
| `options.authContext` | `AuthContext \| null \| (() => AuthContext \| null)` | 自定义认证上下文。 |
| `options.timeout` | `number` | 请求超时（毫秒）。 |
| `options.retry` | `number \| RetryOptions` | 重试配置。 |
| `options.responseType` | `'json' \| 'text' \| 'blob' \| 'arrayBuffer'` | 响应类型。 |
| `options.throwOnHttpError` | `boolean` | HTTP 错误时是否抛出异常。 |
| `options.interceptors` | `{ request, response }` | 额外的拦截器数组。 |

**返回值**：`HttpGuard` 对象，包含 `get`, `post`, `put`, `patch`, `delete`, `request` 方法。

```js
const api = createHttpGuard({
  timeout: 10000,
  throwOnHttpError: true,

  beforeRequest: (config) => {
    const auth = getAuthContext()
    if (auth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${auth.user.token}`,
      }
    }

    // 可选权限检查
    if (config.requiredPermission) {
      const permissions = Array.isArray(config.requiredPermission)
        ? config.requiredPermission
        : [config.requiredPermission]
      const match = config.permissionMatch || 'any'

      for (const perm of permissions) {
        if (perm.startsWith('role:')) {
          if (!auth?.hasRole(perm.slice(5))) {
            throw new Error('PERMISSION_DENIED')
          }
        } else if (!auth?.hasPermission(perm)) {
          throw new Error('PERMISSION_DENIED')
        }
      }
    }

    return config
  },

  onUnauthorized: (err) => {
    router.push('/login')
  },

  onPermissionDenied: (err) => {
    console.error('权限不足')
  },
})

// 使用
const users = await api.get('/api/users', { requiredPermission: 'user:read' })
await api.post('/api/users', { name: 'Alice' }, { requiredPermission: 'user:create' })
await api.delete('/api/users/123', { requiredPermission: 'user:delete' })
```

## 路由工具 API

### requireAuth(authContext)

检查用户是否已认证。

```js
import { requireAuth } from '@kupola/auth'

if (!requireAuth(getAuthContext())) {
  redirectTo('/login')
}
```

### requirePermission(authContext, permission, options?)

检查用户是否拥有指定权限。

```js
import { requirePermission } from '@kupola/auth'

const auth = getAuthContext()

// 单权限
requirePermission(auth, 'user:read')

// 多权限 — 任一满足
requirePermission(auth, ['user:read', 'user:write'], 'any')

// 多权限 — 全部满足
requirePermission(auth, ['user:write', 'user:delete'], 'all')
```

支持 `role:` 前缀自动识别：

```js
requirePermission(auth, 'role:admin') // 自动调用 hasRole('admin')
```

### requireRole(authContext, role)

检查用户是否拥有指定角色。

```js
requireRole(getAuthContext(), 'admin')
```

### redirectTo(url, options?)

安全重定向到指定 URL。仅允许同源 URL。

```js
import { redirectTo } from '@kupola/auth'

// 基本重定向
redirectTo('/login')

// 带重定向返回地址
redirectTo('/login', { redirectUrl: '/dashboard' })
// 实际跳转: /login?redirectUrl=/dashboard
```

## 插件系统

### createAuthPlugin(provider)

创建认证插件，用于 `createApp().use()`。

```js
import { createAuthPlugin, useAuth } from '@kupola/auth'
import { createApp } from '@kupola/platform'

const authProvider = {
  async restore() {
    const user = await fetch('/api/auth/me').then(r => r.json())
    if (user) {
      createAuthContext(user)
    }
    return getAuthContext()
  },

  async login(credentials) {
    const user = await api.post('/api/auth/login', credentials)
    const auth = createAuthContext(user)
    setAuthContext(auth)
    return auth
  },

  async logout() {
    await api.post('/api/auth/logout')
    setAuthContext(null)
  },

  getContext() {
    return getAuthContext()
  },

  onChange(listener) {
    return onAuthContextChange(listener)
  },
}

const app = createApp(/* template */)
app.use(createAuthPlugin(authProvider))
```

### useAuth()

在组件中获取认证提供者。需要先通过 `createAuthPlugin()` 安装。

```js
import { useAuth } from '@kupola/auth'

const auth = useAuth()

// 登录
await auth.login({ username: 'admin', password: '123456' })

// 登出
await auth.logout()

// 获取上下文
const context = auth.getContext()
```

## 独立 Store

### createAuthStore()

创建独立的认证状态容器，用于多应用隔离或测试场景。

```js
import { createAuthStore } from '@kupola/auth'

const store = createAuthStore()

// 独立的 API
const auth = store.createAuthContext({ id: '1', permissions: ['read'] })
store.getAuthContext()
store.setAuthContext(null)
store.onAuthContextChange(listener)
store.registerPermissionHandler(options)
store.getPermissionHandler()

// 配合 k-permission 指令
const directive = createPermissionDirectiveDefinition({ authStore: store })
const instances = processPermissionDirectives(container, { authStore: store })
```

## 集成示例

### JWT 认证

```js
import { createAuthContext, setAuthContext, getAuthContext } from '@kupola/auth'
import { createHttpGuard } from '@kupola/auth'

// 登录
async function login(username, password) {
  const { token, user } = await api.post('/api/auth/login', { username, password })
  localStorage.setItem('token', token)

  const auth = createAuthContext({
    id: user.id,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  })
  setAuthContext(auth)
}

// 初始化
async function initAuth() {
  const token = localStorage.getItem('token')
  if (!token) return

  const user = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  const auth = createAuthContext({
    id: user.id,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  })
  setAuthContext(auth)
}

// 登出
function logout() {
  localStorage.removeItem('token')
  setAuthContext(null)
  redirectTo('/login')
}
```

### Session 认证

```js
import { createAuthContext, setAuthContext } from '@kupola/auth'

export async function loadAuth() {
  const response = await fetch('/api/auth/me', { credentials: 'include' })

  if (response.ok) {
    const user = await response.json()
    const auth = createAuthContext({
      id: user.id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    })
    setAuthContext(auth)
  }
}
```

### OAuth 2.0 / OpenID Connect

```js
import { createAuthContext, setAuthContext } from '@kupola/auth'

const oauthClient = new OAuth2Client({
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
})

export function login() {
  const url = oauthClient.generateAuthUrl({
    scope: 'openid profile email',
  })
  window.location.href = url
}

export async function handleCallback(code) {
  const { tokens, userInfo } = await oauthClient.getToken(code)

  const auth = createAuthContext({
    id: userInfo.sub,
    name: userInfo.name,
    role: userInfo.role || 'user',
    permissions: userInfo.permissions || [],
    attributes: { email: userInfo.email },
  })
  setAuthContext(auth)

  localStorage.setItem('access_token', tokens.access_token)
}
```

### 路由守卫集成

```js
import { createRouter } from '@kupola/router'
import { getAuthContext, requireAuth, requirePermission, redirectTo } from '@kupola/auth'

const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      meta: { requiresAuth: true, requiredPermission: 'admin:access' },
    },
    { path: '/login' },
  ],
})

router.beforeEach((to) => {
  const auth = getAuthContext()

  if (to.meta.requiresAuth && !requireAuth(auth)) {
    redirectTo('/login', { redirectUrl: to.fullPath })
    return false
  }

  if (to.meta.requiredPermission && !requirePermission(auth, to.meta.requiredPermission)) {
    redirectTo('/403')
    return false
  }

  return true
})
```

## 最佳实践

### 前端权限只是 UI 控制

前端权限检查仅控制 UI 展示，不能替代后端权限校验。所有 API 端点必须在服务端独立验证权限。

### 权限命名约定

推荐使用 `资源:操作` 格式：

```
user:read      # 查看用户
user:write     # 创建/编辑用户
user:delete    # 删除用户
article:read   # 查看文章
article:publish # 发布文章
admin:access   # 管理员访问
```

### 缓存策略

权限检查结果默认缓存。以下场景应清除缓存：

```js
import { clearCache } from '@kupola/auth'

// 用户登录/登出后
onAuthContextChange(() => clearCache())

// 权限变更后
onPermissionHandlerChange(() => clearCache())
```