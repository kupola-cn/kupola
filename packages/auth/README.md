# @kupola/auth

> RBAC-based permission guard system with ABAC attribute filtering support.

## Install

```bash
npm install @kupola/auth
```

## Quick Start

### 1. Create Auth Context

```js
import { createAuthContext, provide } from '@kupola/auth';

const auth = createAuthContext({
  id: '1',
  name: 'Admin',
  role: 'admin',
  permissions: ['user:read', 'user:write', 'user:delete'],
  attributes: { department: 'sales' },
});

provide('auth', auth);
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

```html
<button k-permission="user:delete">删除用户</button>
<button k-permission="role:admin">管理面板</button>
<button k-permission="['user:edit', 'role:admin']" k-permission-mode="disabled">编辑</button>
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

### HTTP Guard
- `createHttpGuard(options)` - Create HTTP guard

### Router Tools
- `requireAuth(context)` - Check authentication
- `requirePermission(context, permission)` - Check permission
- `requireRole(context, role)` - Check role
- `redirectTo(url, options)` - Redirect

## Security

> **Important**: Frontend permission control is for UX optimization only.
> Server-side authorization must always be the primary security layer.

## License

MIT