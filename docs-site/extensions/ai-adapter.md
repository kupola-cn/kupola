# AI Adapter

> `@kupola/ai-adapter` — 将自然语言转换为结构化操作的 AI 引擎。

## 概述

AI Adapter 是 Kupola 的独立扩展模块，提供"自然语言 → 结构化命令 → Kupola UI 联动"的完整链路。

```
用户输入（文本/语音）
    ↓
意图解析（AI 后端 / 规则引擎）
    ↓
┌─────────────┬──────────────┬─────────────┐
│  查询引擎    │  执行引擎     │  流程引擎    │
│  (只读查询)  │  (单次写操作) │  (重复流程)  │
└──────┬──────┴──────┬───────┴──────┬──────┘
       ↓             ↓              ↓
  Kupola Table   Kupola Modal   Kupola Timeline
  Kupola Dialog  Kupola Form    Kupola Notification
```

## 安装

```bash
npm install @kupola/ai-adapter
```

> `@kupola/kupola ^2.0.0` 作为 peer dependency 自动要求安装。

## 快速开始

```js
import { AIAdapter } from '@kupola/ai-adapter';

const adapter = new AIAdapter();

// 1. 注册查询
adapter.query.register('employee', async (params) => {
  return await fetch(`/api/employees?q=${params.keyword}`).then(r => r.json());
});

// 2. 注册操作
adapter.action.register('addEmployee', {
  handler: async (p) => fetch('/api/employees', { method: 'POST', body: JSON.stringify(p) }),
  confirm: true,
  label: '添加员工',
});

// 3. 定义流程
adapter.flow.define('发工资条', {
  steps: [
    { label: '获取数据', handler: async (data) => fetchSalary(data) },
    { label: '发送通知', handler: async (data) => notify(data) },
  ],
});

// 4. 处理自然语言
const result = await adapter.process('查询张三');
console.log(result.message); // 🔍 Found 1 employee record(s).
```

## 三引擎

### 查询引擎（Query）

处理所有**只读**操作，支持结果缓存、Table 自动格式化、上下文追问。

```js
adapter.query.register('attendance', async (params) => {
  return await api.get('/attendance', params);
});

// 中文
await adapter.process('查询张三上个月出勤');

// 英文
await adapter.process('search attendance records');
```

### 执行引擎（Action）

处理**一次性写操作**，支持确认弹窗、Undo 撤销、操作审计。

```js
adapter.action.register('deleteEmployee', {
  handler: async (p) => api.delete(`/employees/${p.id}`),
  confirm: true,                              // 执行前确认
  undo: async (p) => api.post('/undo/delete', p), // 支持撤销
});

await adapter.process('删除员工李四');
await adapter.undo(); // 撤销上一步操作
```

### 流程引擎（Flow）

处理**可重复的多步骤流程**，支持 localStorage 持久化、执行计数、自动学习。

```js
adapter.flow.define('月末统计', {
  description: '每月自动生成统计报告',
  steps: [
    { label: '拉取数据', handler: async () => fetchData() },
    { label: '计算汇总', handler: async (d, prev) => calculate(prev) },
    { label: '发送邮件', handler: async (d, prev) => sendEmail(prev) },
  ],
});

await adapter.process('执行月末统计');
```

**自动学习**：当同一操作执行 3 次以上，系统自动提示创建流程。

## AI 后端

默认使用**规则引擎**解析中英文常见模式。如需更精准的意图识别，可接入自定义 AI 后端：

```js
const adapter = new AIAdapter({
  ai: async (prompt, context) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt, history: context.history }),
    });
    return res.json(); // 需返回 { engine, type, params }
  },
});
```

支持 OpenAI、Claude、本地 Ollama 等任意 LLM。

## Kupola UI 集成

```js
// 获取带 Kupola 指令的面板 HTML
const html = adapter.getPanelHTML();
document.getElementById('ai-panel').innerHTML = html;

// 激活指令
import { walk } from '@kupola/kupola/directives';
walk(document.getElementById('ai-panel'));

// 监听事件，联动 Kupola 组件
adapter.on('result', ({ command, result }) => {
  if (result.table) {
    // 用 Kupola Table 渲染查询结果
    Table.create('#result-table', { columns: result.table.columns, data: result.table.rows });
  }
});
```

## API

| 方法 | 说明 |
|------|------|
| `process(input, ctx?)` | 解析 + 路由 + 执行 |
| `undo()` | 撤销上一步操作 |
| `getMessages()` | 获取对话记录 |
| `clearConversation()` | 清空所有状态 |
| `getPanelHTML()` | 获取 UI 面板 HTML |
| `on(event, cb)` | 订阅事件 |
| `query.register(name, fn)` | 注册查询 |
| `action.register(name, config)` | 注册操作 |
| `flow.define(name, config)` | 定义流程 |
| `flow.list()` | 列出所有流程 |

## TypeScript

```ts
import type {
  AIAdapterOptions,
  ParsedCommand,
  ProcessResult,
  QueryResult,
  ActionResult,
  FlowResult,
} from '@kupola/ai-adapter';
```
