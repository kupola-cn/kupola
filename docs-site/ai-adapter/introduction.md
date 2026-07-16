# AI Adapter 简介

> `@kupola/ai-adapter` — 将自然语言转换为结构化操作的 AI 引擎。

## 什么是 AI Adapter？

AI Adapter 是 Kupola 的独立扩展包，提供**自然语言 → 结构化命令 → UI 联动**的完整链路。

你可以用它来：

- 让用户用**自然语言**操作你的应用（"查询张三"、"删除员工李四"、"执行月末统计"）
- 将用户输入自动路由到对应的**查询**、**操作**或**流程**引擎
- 无缝集成 Kupola UI 组件（Table、Modal、Form、Notification 等）
- 接入任意 LLM 后端（OpenAI、Claude、Ollama 等）获得更精准的意图识别

## 架构总览

```
用户输入（文本 / 语音转文字）
         ↓
    意图解析（IntentParser）
    ┌──── AI 后端（可选）
    └──── 规则引擎（内置 fallback）
         ↓
┌────────────┬──────────────┬────────────┐
│  查询引擎    │  执行引擎     │  流程引擎    │
│  QueryEngine │  ActionEngine │  FlowEngine  │
│  (只读查询)  │  (单次写操作) │  (多步流程)  │
└──────┬─────┴──────┬──────┴──────┬─────┘
       ↓            ↓             ↓
  Table / Dialog  Modal / Form  Timeline / Notification
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

// 1. 注册查询处理器
adapter.query.register('employee', async (params) => {
  return await fetch(`/api/employees?q=${params.keyword}`).then(r => r.json());
});

// 2. 注册操作处理器
adapter.action.register('addEmployee', {
  handler: async (p) => fetch('/api/employees', { method: 'POST', body: JSON.stringify(p) }),
  confirm: true,
  label: '添加员工',
});

// 3. 定义可重复流程
adapter.flow.define('发工资条', {
  steps: [
    { label: '获取数据', handler: async (data) => fetchSalary(data) },
    { label: '发送通知', handler: async (data) => notify(data) },
  ],
});

// 4. 处理自然语言输入
const result = await adapter.process('查询张三');
console.log(result.message); // 🔍 Found 1 employee record(s).
```

## 核心概念

| 概念 | 说明 | 对应类 |
|------|------|--------|
| **意图解析** | 将自然语言转为结构化命令 | `IntentParser` / `RuleBasedParser` |
| **查询引擎** | 处理只读数据查询，支持缓存、分页、聚合 | `QueryEngine` |
| **执行引擎** | 处理写操作（增删改），支持确认、撤销、审计 | `ActionEngine` |
| **流程引擎** | 处理多步骤可重复流程，支持持久化、自动学习 | `FlowEngine` |
| **中间件** | 可扩展的处理管道，插入自定义逻辑 | `adapter.use()` |

## 双语支持

内置规则引擎同时支持中文和英文：

```js
// 中文
await adapter.process('查询张三上个月出勤');
await adapter.process('添加员工李四');
await adapter.process('执行月末统计');

// 英文
await adapter.process('search attendance records');
await adapter.process('add employee John');
await adapter.process('run monthly report');
```

## 下一步

- [三引擎详解](./engines) — 深入了解 Query、Action、Flow 引擎
- [意图解析](./intent-parser) — 了解 AI 后端接入和规则引擎
- [中间件](./middleware) — 扩展处理管道
- [Kupola 集成](./kupola-integration) — 与 Kupola UI 组件联动
- [API 参考](./api) — 完整 API 文档
