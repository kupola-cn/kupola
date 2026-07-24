# @kupola/ai-adapter

> AI operation engine for [Kupola](https://github.com/kupola-cn/kupola) — natural language → structured commands.

Convert user input (text or voice) into structured operations using three engines: **Query**, **Action**, and **Flow**.

Version 2.0.3 adds a centralized capability registry: projects can declare resources, permissions, parameter rules, result field filters, and handlers in one place.

## Install

```bash
npm install @kupola/ai-adapter
```

**Peer dependency**: `@kupola/core ^3.0.0` 和 `@kupola/platform ^3.0.0`

## Quick Start

```js
import { AIAdapter } from '@kupola/ai-adapter';

const adapter = new AIAdapter({
  // Optional: provide your own AI backend
  // ai: async (prompt, context) => parsedCommand,
});

// Register query handlers
adapter.query.register('employee', async (params, context) => {
  return await api.get('/employees', params, {
    headers: { Authorization: `Bearer ${context.token}` },
  });
});

// Register action handlers
adapter.action.register('addEmployee', {
  handler: async (params, context) => await api.post('/employees', params, context),
  confirm: true,
  undo: async (params) => await api.delete(`/employees/${params.id}`),
});

// Define flows
adapter.flow.define('发工资条', {
  steps: [
    { label: '获取数据', handler: async (data) => fetchSalary(data) },
    { label: '发送通知', handler: async (data) => sendNotification(data) },
  ],
});

// Process natural language
const result = await adapter.process('查询张三出勤', {
  role: 'admin',
  permissions: ['employee:read'],
});
// → { engine: 'query', result: { success: true, data: [...], table: {...} }, message: '🔍 Found 5 employee record(s).' }
```

## Three Engines

### Query Engine (Read)

```js
adapter.query.register('search', async (params) => { /* return data */ });
const r = await adapter.process('查询...');  // Chinese
const r = await adapter.process('search employees');  // English
```

Features: result history, context-aware cache isolation, auto Table formatting, summary generation.

### Action Engine (Write)

```js
adapter.action.register('update', {
  handler: async (p) => api.put('/resource', p),
  confirm: true,                    // require confirmation
  undo: async (p) => api.rollback(p), // support undo
  label: '更新资源',
});

await adapter.process('添加...');
await adapter.undo();  // undo last action
```

Features: confirmation flow, undo stack, audit log, context-aware permission hooks, auto-learn suggestions.

### Flow Engine (Repeatable Workflows)

```js
adapter.flow.define('payroll', {
  description: 'Monthly payroll',
  steps: [
    { label: 'Fetch data', handler: async (data) => ... },
    { label: 'Calculate', handler: async (data, prev) => ... },
    { label: 'Send', handler: async (data, prev) => ... },
  ],
});

await adapter.process('执行 payroll');
adapter.flow.list();  // [{ name, description, steps, executionCount }]
```

Features: localStorage persistence, execution tracking, context propagation into steps, auto-learn (suggest flow after 3 repeated actions).

## Security and Permissions

AI Adapter provides front-end interaction guards. These guards prevent accidental or unauthorized UI operations and return visible messages such as `无权限执行该操作，需要角色：admin。`, but they do not replace server-side authorization.

Your API must still verify the authenticated user on every sensitive endpoint and return `401` or `403` when access is denied.

```js
import { AIAdapter, createAuthGuard, createRateLimiter } from '@kupola/ai-adapter';

const adapter = new AIAdapter();

adapter
  .use(createRateLimiter({ maxRequests: 30, windowMs: 60000 }))
  .use(createAuthGuard({
    roleField: 'role',
    permissionsField: 'permissions',
    rules: [
      { engine: 'query', type: 'roles', roles: ['admin'], permissions: ['role:read'] },
      { engine: 'query', type: 'permissions', roles: ['admin'], permissions: ['permission:read'] },
      { engine: 'action', types: ['create_user', 'delete_user'], roles: ['admin'] },
      { engine: 'flow', type: 'execute', names: ['发工资条'], roles: ['admin', 'hr'] },
    ],
  }));

await adapter.process('查询所有角色', {
  role: 'user',
  permissions: [],
});
// => { success: false, engine: 'auth-guard', code: 'PERMISSION_DENIED', message: '无权限...' }
```

Additional safety defaults:

- Middleware receives `ctx.command` after parsing and before execution.
- Query cache keys include `context`, reducing cross-user cache leakage.
- Action and flow handlers receive `context` for business-level checks.
- Confirm-required actions are rejected by default if no confirmation UI is available.
- DevTools logs redact common sensitive fields such as `password`, `token`, `secret`, and `authorization`.

## Capabilities

For app integrations, register AI-facing capabilities centrally and let the adapter handle permission checks, parameter validation, and result filtering:

```js
const adapter = new AIAdapter({ parser });

adapter.capability.register({
  engine: 'query',
  type: 'users',
  resource: 'users',
  label: '用户',
  roles: ['super_admin', 'group_admin'],
  permissions: ['system:user'],
  paramsSchema: { keyword: 'string' },
  resultFields: ['id', 'username', 'real_name', 'status'],
  handler: async (params, context) => api.get('/api/users', params, context),
});

adapter.use(adapter.capability.middleware());
```

`getAICapabilities(context)` returns a safe capability list for AI backends or UI hints. It excludes handlers and sensitive implementation details.

## AI Backend

By default, a **rule-based parser** handles common Chinese/English patterns. For better accuracy, provide your own AI backend:

```js
const adapter = new AIAdapter({
  ai: async (prompt, context) => {
    // Call OpenAI, Claude, or your own service
    const response = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt, history: context.history }),
    });
    return response.json(); // must return { engine, type, params }
  },
});
```

## Kupola UI Integration

```js
import { AIPanel } from '@kupola/ai-adapter';

const panel = new AIPanel(adapter, {
  title: 'AI Assistant',
  // Default layout is a right-side drawer.
  // Use layout: 'floating' only when a compact corner panel is preferred.
  layout: 'drawer',
  context: () => ({
    token: localStorage.getItem('token'),
    role: currentUser.role,
    permissions: currentUser.permissions,
  }),
});

panel.mount(document.body);

// Listen to events
adapter.on('result', ({ command, result }) => {
  if (result.table) renderTable(result.table);
});
```

## TypeScript

```ts
import type { AIAdapterOptions, ParsedCommand, ProcessResult } from '@kupola/ai-adapter';
```

## API Reference

| Method | Description |
|--------|-------------|
| `adapter.process(input, context?)` | Parse + middleware guards + route + execute |
| `adapter.undo()` | Undo last action |
| `adapter.getMessages()` | Get conversation log |
| `adapter.clearConversation()` | Reset all state |
| `adapter.getPanelHTML()` | Get Kupola UI panel |
| `adapter.capability.register(config)` | Register a centralized capability |
| `adapter.capability.getAICapabilities(context?)` | Get safe AI-facing capability metadata |
| `adapter.on(event, cb)` | Subscribe to events |
| `adapter.query.register(name, fn)` | Register query |
| `adapter.action.register(name, config)` | Register action |
| `adapter.flow.define(name, config)` | Define flow |
| `adapter.flow.execute(name, data)` | Execute flow |
| `adapter.flow.list()` | List all flows |

## License

MIT
