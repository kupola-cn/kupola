# 中间件

AI Adapter 提供 Koa 风格的中间件系统，允许你在处理管道中插入自定义逻辑。

## 基本概念

中间件是一个 `async (ctx, next) => { ... }` 函数，在 `adapter.process()` 执行时被依次调用。

```js
adapter.use(async (ctx, next) => {
  // 处理前
  console.log('输入:', ctx.input);

  await next(); // 继续执行下一个中间件或核心处理

  // 处理后
  console.log('结果:', ctx.result);
});
```

## ctx 对象

每个中间件接收的 `ctx` 包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `input` | `string` | 用户原始输入 |
| `context` | `object` | 额外上下文（来自 process 第二个参数） |
| `command` | `object \| null` | 解析后的结构化命令（中间件执行后填充） |
| `result` | `object \| null` | 执行结果（中间件执行后填充） |
| `adapter` | `AIAdapter` | 当前 adapter 实例引用 |

## 使用场景

### 日志记录

```js
adapter.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[${ctx.input}] → ${ctx.result?.engine || 'error'} (${ms}ms)`);
});
```

### 权限控制

```js
adapter.use(async (ctx, next) => {
  if (ctx.input.includes('删除') && !currentUser.isAdmin) {
    ctx.result = {
      type: 'error',
      engine: 'unknown',
      message: '❌ 需要管理员权限才能执行删除操作',
    };
    return; // 不调用 next()，阻止后续处理
  }
  await next();
});
```

### 输入预处理

```js
adapter.use(async (ctx, next) => {
  // 去除敏感词
  ctx.input = ctx.input.replace(/密码/g, '***');
  await next();
});
```

### 结果转换

```js
adapter.use(async (ctx, next) => {
  await next();

  // 为查询结果添加额外格式化
  if (ctx.result?.type === 'query' && ctx.result.result?.table) {
    ctx.result.result.formattedAt = new Date().toISOString();
  }
});
```

### 缓存层

```js
const responseCache = new Map();

adapter.use(async (ctx, next) => {
  const key = ctx.input;
  if (responseCache.has(key)) {
    ctx.result = responseCache.get(key);
    return; // 命中缓存，跳过处理
  }

  await next();

  if (ctx.result?.type === 'query') {
    responseCache.set(key, ctx.result);
  }
});
```

## 中间件执行顺序

中间件按 `use()` 调用顺序依次执行，形成洋葱模型：

```js
adapter.use(mw1); // 第一层
adapter.use(mw2); // 第二层
adapter.use(mw3); // 第三层

// 执行顺序：
// mw1 before → mw2 before → mw3 before → 核心处理
// → mw3 after → mw2 after → mw1 after
```

## 链式调用

`use()` 返回 `this`，支持链式调用：

```js
adapter
  .use(loggingMiddleware)
  .use(authMiddleware)
  .use(cacheMiddleware);
```

## 提前终止

不调用 `next()` 即可提前终止处理管道，需手动设置 `ctx.result`：

```js
adapter.use(async (ctx, next) => {
  if (ctx.input.length < 2) {
    ctx.result = {
      type: 'error',
      engine: 'unknown',
      message: '输入太短，请提供更详细的指令。',
    };
    return; // 不调用 next()
  }
  await next();
});
```

---

## 内置中间件工厂

AI Adapter 提供三个开箱即用的中间件工厂，从 `@kupola/ai-adapter` 直接导入：

### createRateLimiter

滑动窗口速率限制，防止 API 被滥用：

```js
import { createRateLimiter } from '@kupola/ai-adapter';

// 每分钟最多 30 次请求
adapter.use(createRateLimiter({ maxRequests: 30, windowMs: 60000 }));

// 超限时返回：
// { type: 'error', message: 'Rate limit exceeded', retryAfter: 42000 }
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `maxRequests` | `30` | 窗口内最大请求数 |
| `windowMs` | `60000` | 窗口时间（毫秒） |

### createDevToolsLogger

自动记录每次 process 的耗时和结果到 `window.__KUPOLA_AI_DEVTOOLS__`：

```js
import { createDevToolsLogger } from '@kupola/ai-adapter';

adapter.use(createDevToolsLogger({ maxEntries: 100 }));

// 在浏览器控制台中检查：
// window.__KUPOLA_AI_DEVTOOLS__
// => [{ input, engine, duration, result, timestamp }, ...]
```

### createAuthGuard

基于角色的操作拦截，防止未授权用户执行敏感操作：

```js
import { createAuthGuard } from '@kupola/ai-adapter';

// 只允许 admin 执行删除操作
adapter.use(createAuthGuard({
  restrictedTypes: ['delete', '调薪'],
  roleField: 'role',           // ctx.context 中的角色字段
  allowedRoles: ['admin', 'hr'],
}));

// 调用时传入用户角色：
await adapter.process('删除员工李四', { role: 'user' });
// => { type: 'error', message: 'Unauthorized: role "user" not allowed' }
```

### 组合使用

```js
import { createRateLimiter, createAuthGuard, createDevToolsLogger } from '@kupola/ai-adapter';

adapter
  .use(createDevToolsLogger())               // 第一层：记录所有请求
  .use(createRateLimiter({ maxRequests: 20 }))  // 第二层：速率限制
  .use(createAuthGuard({ restrictedTypes: ['delete'] })); // 第三层：权限检查
```

---

## DevTools 快照

除了中间件日志，AIAdapter 还提供 `getDevToolsSnapshot()` 方法，返回完整运行时状态：

```js
const snap = adapter.getDevToolsSnapshot();
// {
//   version: '1.3.0',
//   messages: [...],
//   middlewares: 3,
//   query: { registered: 5, history: 12, cache: 3 },
//   action: { registered: 4, undoStack: 2, audit: 18 },
//   flow: { defined: 3, executions: 7 },
//   events: ['input', 'parsed', 'result', 'flow:step', 'action:before', 'action:after'],
// }
```

## 下一步

- [Kupola 集成](./kupola-integration) — AIPanel 面板、AIDashboard 看板、语音交互
- [API 参考](./api) — 完整 API 文档
