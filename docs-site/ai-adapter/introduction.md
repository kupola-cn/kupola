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

<!-- 输入层 -->
<div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 20px 24px; margin-bottom: 8px; text-align: center;">
  <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">🗣️ 用户输入</div>
  <div style="font-size: 12px; color: var(--vp-c-text-2);">文本 / 语音转文字</div>
</div>

<div style="text-align: center; color: var(--vp-c-text-3); font-size: 18px; margin: 4px 0;">↓</div>

<!-- 解析层 -->
<div style="background: var(--vp-c-brand-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 20px 24px; margin-bottom: 8px;">
  <div style="font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 12px;">🧠 意图解析 IntentParser</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
    <div style="background: var(--vp-c-bg); border-radius: 6px; padding: 8px 12px; text-align: center; font-size: 13px;">AI 后端 <span style="color: var(--vp-c-text-2);">（可选）</span></div>
    <div style="background: var(--vp-c-bg); border-radius: 6px; padding: 8px 12px; text-align: center; font-size: 13px;">规则引擎 <span style="color: var(--vp-c-text-2);">（内置）</span></div>
  </div>
</div>

<div style="text-align: center; color: var(--vp-c-text-3); font-size: 18px; margin: 4px 0;">↓</div>

<!-- 引擎层 -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 16px; text-align: center;">
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">🔍 查询引擎</div>
    <div style="font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 8px;">QueryEngine</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">只读查询 · 缓存 · 分页</div>
  </div>
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 16px; text-align: center;">
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">⚙️ 执行引擎</div>
    <div style="font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 8px;">ActionEngine</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">增删改 · 确认 · 撤销</div>
  </div>
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 16px; text-align: center;">
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">🔁 流程引擎</div>
    <div style="font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 8px;">FlowEngine</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">多步骤 · 持久化 · 学习</div>
  </div>
</div>

<div style="text-align: center; color: var(--vp-c-text-3); font-size: 18px; margin: 4px 0;">↓</div>

<!-- 基础设施层 -->
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px 16px; text-align: center;">
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">📡 EventBus</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">on / once / wildcard / emit</div>
  </div>
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px 16px; text-align: center;">
    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">🔧 Middleware</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">RateLimiter · AuthGuard · DevTools</div>
  </div>
</div>

<div style="text-align: center; color: var(--vp-c-text-3); font-size: 18px; margin: 4px 0;">↓</div>

<!-- UI 输出层 -->
<div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 16px 24px;">
  <div style="font-weight: 600; font-size: 14px; text-align: center; margin-bottom: 10px;">🎨 Kupola UI 组件</div>
  <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Table</span>
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Modal</span>
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Form</span>
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Notification</span>
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Timeline</span>
    <span style="background: var(--vp-c-brand-soft); padding: 3px 10px; border-radius: 4px; font-size: 12px;">Progress</span>
  </div>
</div>

<div style="text-align: center; color: var(--vp-c-text-3); font-size: 18px; margin: 4px 0;">↓</div>

<!-- 独立 UI 组件 -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px; text-align: center;">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">💬 AIPanel</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">对话面板 · 进度条 · 时间线</div>
  </div>
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px; text-align: center;">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">📊 AIDashboard</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">数据卡片 · 聚合 · 自动刷新</div>
  </div>
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 14px; text-align: center;">
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">🎙️ VoiceController</div>
    <div style="font-size: 11px; color: var(--vp-c-text-3);">唤醒词 · 指令映射 · TTS</div>
  </div>
</div>

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
| **执行引擎** | 处理写操作（增删改），支持确认、撤销、审计、**操作依赖** | `ActionEngine` |
| **流程引擎** | 处理多步骤可重复流程，支持持久化、自动学习 | `FlowEngine` |
| **事件总线** | 标准化 pub/sub，支持 `once()` / `wildcard()` | `EventBus` |
| **中间件** | 可扩展的处理管道，内置速率限制、权限守卫、DevTools 日志 | `adapter.use()` |
| **UI 组件** | 对话面板、数据看板、语音交互 | `AIPanel` / `AIDashboard` / `VoiceController` |

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
- [中间件](./middleware) — 扩展处理管道 + 内置中间件工厂
- [Kupola 集成](./kupola-integration) — AIPanel 面板、AIDashboard 看板、语音交互
- [API 参考](./api) — 完整 API 文档
