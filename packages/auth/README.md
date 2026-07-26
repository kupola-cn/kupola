# @kupola/auth

> RBAC-based permission guard system with ABAC attribute filtering support.

## Install

```bash
npm install @kupola/auth
```

## Quick Start

### 1. Create Auth Context

```js
import { createAuthContext } from '@kupola/auth';

const auth = createAuthContext({
  id: '1',
  name: 'Admin',
  role: 'admin',
  permissions: ['user:read', 'user:write', 'user:delete'],
  attributes: { department: 'sales' },
});

```

### 2. Register Permission Handler

```js
import { registerPermissionHandler, getAuthContext } from '@kupola/auth';

registerPermissionHandler({
  check: (permission) => {
    const auth = getAuthContext();
    if (permission.startsWith('role:')) {
      return auth.hasRole(permission.slice(5));
    }
    return auth.hasPermission(permission);
  },
});
```

### 3. Use k-permission Directive

When using `walk()` from `@kupola/platform`, register the auth directive once
before walking the DOM:

```js
import { registerDirective, walk } from '@kupola/platform/directives';
import { registerPermissionDirective } from '@kupola/auth';

registerPermissionDirective(registerDirective);
walk(document.body);
```

```html
<button k-permission="user:delete">删除用户</button>
<button k-permission="role:admin">管理面板</button>
<button k-permission='["user:edit", "role:admin"]' k-permission-mode="disabled">编辑</button>
```

### 4. HTTP Guard

```js
import { createHttpGuard } from '@kupola/auth';

const api = createHttpGuard({
  beforeRequest: (config) => {
    const auth = getAuthContext();
    if (!auth.hasPermission(config.requiredPermission)) {
      throw new Error('PERMISSION_DENIED');
    }
    return config;
  },
});

api.get('/api/users', { requiredPermission: 'user:read' });
```

## Features

- 🛡️ **RBAC Support**: Role-based access control
- 🏷️ **ABAC Attributes**: Attribute-based filtering for data access
- 🎯 **Element-level**: `k-permission` directive for fine-grained control
- 📡 **HTTP Guard**: Request-level permission checking
- 🔄 **SSR Ready**: Server-side rendering compatible
- ⚡ **Lightweight**: No external dependencies

## API

### Auth Context
- `createAuthContext(user)` - Create auth context
- `hydrateAuthContext()` - Restore from SSR
- `getAuthContext()` - Get current context
- `setAuthContext(context)` - Set current context

### Permission Handler
- `registerPermissionHandler(options)` - Register global handler
- `getPermissionHandler()` - Get current handler
- `clearPermissionHandler()` - Clear handler

`k-permission` refreshes after `setAuthContext()` or a permission handler
change. Frontend checks only control the UI; every API endpoint must enforce
authorization on the server.

For pages that host more than one Kupola app, create an isolated store per app
and pass it to the directive definition or directive processor. The existing
top-level APIs continue to use a shared default store for compatibility.

```js
import { createAuthStore, createPermissionDirectiveDefinition } from '@kupola/auth';
import { walk } from '@kupola/platform/directives';

const authStore = createAuthStore();
authStore.createAuthContext({ id: '1', permissions: ['user:read'] });

walk(document.querySelector('#app'), {
  customDirectives: {
    'k-permission': createPermissionDirectiveDefinition({ authStore }),
  },
});
```

### HTTP Guard
- `createHttpGuard(options)` - Create HTTP guard

### Router Tools
- `requireAuth(context)` - Check authentication
- `requirePermission(context, permission)` - Check permission
- `requireRole(context, role)` - Check role
- `redirectTo(url, options)` - Redirect

## Integration with Authentication Systems

@kupola/auth 专注于**权限校验**，不包含 Token 存储、刷新、登录/登出等认证流程。以下是与常见认证方案的集成示例：

### JWT Authentication

```js
// auth-service.js
import { createAuthContext, setAuthContext, getAuthContext } from '@kupola/auth';

const TOKEN_KEY = 'kupola_token';

export function login(token) {
  localStorage.setItem(TOKEN_KEY, token);
  const payload = parseJwt(token);
  const auth = createAuthContext({
    id: payload.sub,
    name: payload.name,
    role: payload.role,
    permissions: payload.permissions || [],
    attributes: payload.attributes || {},
  });
  setAuthContext(auth);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  setAuthContext(null);
}

export function refreshToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  
  const payload = parseJwt(token);
  const expiresAt = payload.exp * 1000;
  
  if (expiresAt - Date.now() < 300000) {
    api.post('/refresh-token', { token })
      .then(res => {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        const newAuth = createAuthContext(parseJwt(res.data.token));
        setAuthContext(newAuth);
      });
  }
}

function parseJwt(token) {
  return JSON.parse(atob(token.split('.')[1]));
}
```

### Session-based Authentication

```js
// server-side (Express/Flask)
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    id: req.session.user.id,
    name: req.session.user.name,
    role: req.session.user.role,
    permissions: req.session.user.permissions,
  });
});

// client-side
import { createAuthContext, setAuthContext } from '@kupola/auth';

export async function loadAuth() {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  if (response.ok) {
    const user = await response.json();
    const auth = createAuthContext(user);
    setAuthContext(auth);
  }
}
```

### OAuth 2.0 / OpenID Connect

```js
import { createAuthContext, setAuthContext } from '@kupola/auth';
import { OAuth2Client } from 'some-oauth-library';

const oauthClient = new OAuth2Client({
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
});

export function login() {
  const url = oauthClient.generateAuthUrl({
    scope: 'openid profile email',
  });
  window.location.href = url;
}

export async function handleCallback(code) {
  const { tokens, userInfo } = await oauthClient.getToken(code);
  
  const auth = createAuthContext({
    id: userInfo.sub,
    name: userInfo.name,
    role: userInfo.role || 'user',
    permissions: userInfo.permissions || [],
    attributes: { email: userInfo.email },
  });
  setAuthContext(auth);
  
  localStorage.setItem('access_token', tokens.access_token);
}
```

## Router Integration

路由系统属于宿主框架职责，@kupola/auth 提供工具函数供宿主框架调用：

### Next.js Middleware

```js
// middleware.ts
import { requireAuth, requirePermission } from '@kupola/auth';
import { createAuthContext } from './auth-service';

export async function middleware(request) {
  const session = await getSession(request);
  const auth = createAuthContext(session);
  
  if (!requireAuth(auth)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const path = request.nextUrl.pathname;
  const requiredPerms = {
    '/admin': 'admin',
    '/reports': 'report:view',
  };
  
  if (requiredPerms[path] && !requirePermission(auth, requiredPerms[path])) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
}
```

### Vue Router

```js
// router/index.js
import { requireAuth, requirePermission } from '@kupola/auth';

router.beforeEach((to, from, next) => {
  const auth = getAuthContext();
  
  if (to.meta.requiresAuth && !requireAuth(auth)) {
    next('/login');
    return;
  }
  
  if (to.meta.permission && !requirePermission(auth, to.meta.permission)) {
    next('/403');
    return;
  }
  
  next();
});
```

## Responsibility Boundary

| 职责 | @kupola/auth | 宿主框架/应用层 |
|------|-------------|-----------------|
| 权限校验逻辑 | ✅ | ❌ |
| 元素级别控制 | ✅ | ❌ |
| API 请求拦截 | ✅ | ❌ |
| 路由配置 | ❌ | ✅ |
| 路由守卫 | ❌ | ✅ |
| Token 存储 | ❌ | ✅ |
| Token 刷新 | ❌ | ✅ |
| 登录/登出流程 | ❌ | ✅ |
| URL 解析 | ❌ | ✅ |

> **设计原则**: @kupola/auth 是**权限判断的执行层**，而非完整的认证系统。路由和认证基础设施属于宿主框架/后端职责，不应在 Kupola 生态中重复实现。

## Security

> **Important**: Frontend permission control is for UX optimization only.
> Server-side authorization must always be the primary security layer.

## License

MIT
