# @kupola/ai-adapter

> AI operation engine for [Kupola](https://github.com/kupola-cn/kupola) — natural language → structured commands.

Convert user input (text or voice) into structured operations using three engines: **Query**, **Action**, and **Flow**.

## Install

```bash
npm install @kupola/ai-adapter
```

**Peer dependency**: `@kupola/kupola ^2.0.0`

## Quick Start

```js
import { AIAdapter } from '@kupola/ai-adapter';

const adapter = new AIAdapter({
  // Optional: provide your own AI backend
  // ai: async (prompt, context) => parsedCommand,
});

// Register query handlers
adapter.query.register('employee', async (params) => {
  return await api.get('/employees', params);
});

// Register action handlers
adapter.action.register('addEmployee', {
  handler: async (params) => await api.post('/employees', params),
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
const result = await adapter.process('查询张三出勤');
// → { engine: 'query', result: { success: true, data: [...], table: {...} }, message: '🔍 Found 5 employee record(s).' }
```

## Three Engines

### Query Engine (Read)

```js
adapter.query.register('search', async (params) => { /* return data */ });
const r = await adapter.process('查询...');  // Chinese
const r = await adapter.process('search employees');  // English
```

Features: result history, auto Table formatting, summary generation.

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

Features: confirmation flow, undo stack, auto-learn suggestions.

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

Features: localStorage persistence, execution tracking, auto-learn (suggest flow after 3 repeated actions).

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
// Get panel HTML with Kupola directives
const html = adapter.getPanelHTML();
document.getElementById('ai-panel').innerHTML = html;

// Re-activate directives
import { walk } from '@kupola/kupola/directives';
walk(document.getElementById('ai-panel'));

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
| `adapter.process(input, context?)` | Parse + route + execute |
| `adapter.undo()` | Undo last action |
| `adapter.getMessages()` | Get conversation log |
| `adapter.clearConversation()` | Reset all state |
| `adapter.getPanelHTML()` | Get Kupola UI panel |
| `adapter.on(event, cb)` | Subscribe to events |
| `adapter.query.register(name, fn)` | Register query |
| `adapter.action.register(name, config)` | Register action |
| `adapter.flow.define(name, config)` | Define flow |
| `adapter.flow.execute(name, data)` | Execute flow |
| `adapter.flow.list()` | List all flows |

## License

MIT
