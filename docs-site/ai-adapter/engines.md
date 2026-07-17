# 三引擎架构

AI Adapter 的核心是三个专用引擎，分别处理不同类型的操作。

## 查询引擎（QueryEngine）

处理所有**只读**操作。支持缓存、分页、聚合和上下文追问。

### 注册查询

```js
adapter.query.register('employee', async (params) => {
  return await api.get('/employees', params);
});

adapter.query.register('attendance', async (params) => {
  return await api.get('/attendance', params);
});
```

### 执行查询

```js
const result = await adapter.process('查询张三');

// 返回结构
// {
//   success: true,
//   data: [...],
//   summary: 'Found 3 employee record(s).',
//   table: { columns: [...], rows: [...] },
//   cached: false,
//   pagination: { page: 1, pageSize: 20, total: 3, totalPages: 1 }
// }
```

### 缓存机制

查询结果自动缓存（默认 TTL 30 秒），重复查询直接返回缓存数据。缓存 key 会包含 `context`，避免不同用户、角色或权限上下文复用同一份敏感查询结果：

```js
const adapter = new AIAdapter({
  query: {
    cacheTTL: 60000,    // 60 秒缓存
    cacheEnabled: true,  // 默认开启
  },
});
```

### 分页

传入 `page` 和 `pageSize` 参数自动分页：

```js
await adapter.query.execute({
  type: 'employee',
  params: { keyword: '张', page: 1, pageSize: 10 },
});
```

### 聚合

对上次查询结果执行聚合运算：

```js
adapter.query.aggregate('count');           // { value: 42, label: 'Count: 42' }
adapter.query.aggregate('sum', 'salary');   // { value: 500000, label: 'Sum of salary' }
adapter.query.aggregate('avg', 'age');      // { value: 28.5, label: 'Average of age' }
adapter.query.aggregate('min', 'score');
adapter.query.aggregate('max', 'score');
```

### 上下文追问

复用上次查询的类型，更换参数：

```js
await adapter.process('查询张三');
// 追问：复用 employee 类型，更换关键词
await adapter.query.followUp({ keyword: '李四' });
```

---

## 执行引擎（ActionEngine）

处理**一次性写操作**（增、删、改），支持确认弹窗、撤销、审计日志和权限钩子。

### 注册操作

```js
adapter.action.register('deleteEmployee', {
  handler: async (p) => api.delete(`/employees/${p.id}`),
  confirm: true,                                   // 执行前确认
  undo: async (p) => api.post('/undo/delete', p),  // 支持撤销
  label: '删除员工',
  retries: 2,                                      // 失败时重试 2 次
});
```

### 执行操作

```js
const result = await adapter.process('删除员工李四');

// 撤销
await adapter.undo();  // { success: true, message: 'Undone: deleteEmployee' }
```

### 确认流程

需要确认的操作会调用 `onConfirm` 回调：

```js
const adapter = new AIAdapter({
  action: {
    onConfirm: async (label, params) => {
      return confirm(`确认执行 ${label}？`);
    },
  },
});
```

### 权限钩子

在执行前检查权限，抛出异常可阻止执行：

```js
adapter.action.beforeExecute(async (actionName, params, context) => {
  if (actionName === 'deleteEmployee' && context.role !== 'admin') {
    throw new Error('需要管理员权限');
  }
});

// 执行后回调
adapter.action.afterExecute(async (actionName, params, result, context) => {
  analytics.track('action_executed', { action: actionName, userId: context.userId });
});
```

如果需要跨 query/action/flow 做统一权限控制，优先使用中间件 `createAuthGuard`。`beforeExecute` 更适合 action 内部的业务级二次校验。

### 审计日志

每次操作自动记录审计信息：

```js
const logs = adapter.action.getAuditLog({
  type: 'deleteEmployee',  // 可选：按操作类型筛选
  status: 'success',       // 可选：按状态筛选
  limit: 10,               // 可选：最近 N 条
});

// [{ action, params, status, error, attempts, timestamp }]
```

### 批量操作

一次执行多个操作：

```js
const batch = await adapter.action.executeBatch([
  { type: 'addEmployee', params: { name: '张三' } },
  { type: 'addEmployee', params: { name: '李四' } },
  { type: 'deleteEmployee', params: { id: 5 } },
]);

// { success: true, results: [...], failed: 0, total: 3 }
```

### 操作依赖

声明操作之间的依赖关系，确保某些操作必须在其他操作成功之后才能执行：

```js
adapter.action.register('调薪', {
  handler: adjustSalary,
  dependsOn: ['查询员工'],  // 必须先成功执行过"查询员工"
});

// 如果依赖未满足，execute() 返回错误：
// { success: false, error: 'Dependency not met: "查询员工" must succeed before "调薪"' }
```

检查依赖状态：

```js
// 返回 null 表示依赖已满足，返回错误字符串表示未满足
adapter.action.checkDependencies('调薪');
// => 'Dependency not met: "查询员工" must succeed before "调薪"'

// 支持多依赖
adapter.action.register('发工资', {
  handler: paySalary,
  dependsOn: ['查询员工', '调薪'],  // 必须两个都成功
});

// 自动检测循环依赖
adapter.action.checkDependencies('A');
// => 'Circular dependency detected: A'
```

---

## 流程引擎（FlowEngine）

处理**可重复的多步骤流程**，支持条件分支、并行步骤、变量替换、嵌套流程和断点恢复。

### 定义流程

```js
adapter.flow.define('月末统计', {
  description: '每月自动生成统计报告',
  variables: ['month'],
  steps: [
    { label: '拉取数据', handler: async (data) => fetchData(data.month) },
    { label: '计算汇总', handler: async (data, prev) => calculate(prev[0].data) },
    { label: '发送邮件', handler: async (data, prev) => sendEmail(prev[1].data) },
  ],
});
```

### 执行流程

```js
const result = await adapter.process('执行月末统计');

// 直接调用
const result = await adapter.flow.execute('月末统计', { month: '2026-07' }, {
  onStep: (i, label, status) => console.log(`${label}: ${status}`),
  onComplete: (results) => console.log('流程完成'),
  onError: (i, label, err) => console.error(`${label} 失败:`, err),
});
```

### 条件分支

步骤可根据条件跳过：

```js
{
  label: '发送提醒',
  condition: (data, results, context) => data.urgent === true && context.permissions?.includes('notice:send'),
  handler: async (data, results, context) => sendReminder(data, context),
}
```

### 并行步骤

多个步骤并发执行：

```js
{
  label: '并行通知',
  parallel: [
    { handler: async (data) => notifyByEmail(data) },
    { handler: async (data) => notifyBySMS(data) },
    { handler: async (data) => notifyByWebhook(data) },
  ],
}
```

### 变量替换

步骤参数中使用 `{{variable}}` 语法：

```js
adapter.flow.define('查询并通知', {
  steps: [
    {
      label: '查询',
      handler: async (data) => api.get(`/employees/${data.name}`),
    },
    {
      label: '通知',
      params: { target: '{{name}}', result: '查询完成' },
      handler: async (data) => notify(data),
    },
  ],
});
```

### 嵌套流程

步骤中可以引用另一个流程：

```js
adapter.flow.define('完整流程', {
  steps: [
    { label: '准备数据', handler: async (data) => prepare(data) },
    { label: '执行子流程', flow: '月末统计', params: { month: '{{month}}' } },
    { label: '归档', handler: async (data) => archive(data) },
  ],
});
```

### 断点恢复

流程失败后可以从失败步骤继续执行：

```js
const result = await adapter.flow.execute('月末统计', data, callbacks);
if (!result.success) {
  // 修复问题后恢复
  await adapter.flow.resume('月末统计', data, result.failedAt, callbacks);
}
```

### 持久化

流程定义自动存储到 `localStorage`，页面刷新后保留。可注入自定义 storage：

```js
const adapter = new AIAdapter({
  flow: {
    storage: {
      get: () => JSON.parse(sessionStorage.getItem('flows')),
      set: (data) => sessionStorage.setItem('flows', JSON.stringify(data)),
    },
  },
});
```

### 自动学习

当同一操作执行超过阈值（默认 3 次），系统自动提示创建流程：

```js
// 第 3 次执行 'addEmployee' 后
// result.suggestion = {
//   suggest: true,
//   message: 'You\'ve performed "addEmployee" 3 times. Create a flow?',
// }
```

---

## 下一步

- [意图解析](./intent-parser) — 了解如何将自然语言路由到引擎
- [中间件](./middleware) — 扩展处理管道
- [API 参考](./api) — 完整 API 文档
