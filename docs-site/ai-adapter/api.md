# API 参考

## AIAdapter

主类，编排 IntentParser + 三个引擎。

### 构造函数

```js
new AIAdapter(options?)
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ai` | `async (input, ctx) => command` | `null` | AI 后端函数 |
| `parser` | `RuleBasedParser` | `createDefault()` | 规则引擎 fallback |
| `maxContext` | `number` | `10` | 对话上下文保留条数 |
| `maxMessages` | `number` | `50` | 消息日志最大条数 |
| `query` | `object` | `{}` | QueryEngine 配置 |
| `action` | `object` | `{}` | ActionEngine 配置 |
| `flow` | `object` | `{}` | FlowEngine 配置 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `process(input, ctx?)` | `Promise<ProcessResult>` | 解析 + 路由 + 执行（核心方法） |
| `undo()` | `Promise<UndoResult>` | 撤销上一步操作 |
| `use(middleware)` | `this` | 添加中间件 |
| `getMessages()` | `Message[]` | 获取对话记录 |
| `clearConversation()` | `void` | 清空所有状态 |
| `getPanelHTML()` | `string` | 获取 UI 面板 HTML |
| `on(event, cb)` | `Function` | 订阅事件，返回取消函数 |
| `off(event, cb)` | `void` | 取消事件订阅 |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `query` | `QueryEngine` | 查询引擎实例 |
| `action` | `ActionEngine` | 执行引擎实例 |
| `flow` | `FlowEngine` | 流程引擎实例 |
| `parser` | `IntentParser` | 意图解析器实例 |

### 事件

| 事件 | 数据 | 触发时机 |
|------|------|----------|
| `input` | `{ input }` | 用户输入时 |
| `parsed` | `ParsedCommand` | 意图解析完成 |
| `result` | `{ command, result }` | 执行结果返回 |
| `flowStep` | `{ step, label, status }` | 流程步骤状态变化 |

---

## QueryEngine

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `register(name, handler)` | `void` | 注册查询处理器 |
| `execute(command)` | `Promise<QueryResult>` | 执行查询 |
| `followUp(overrides)` | `Promise<QueryResult>` | 上下文追问 |
| `aggregate(op, field?)` | `AggResult` | 聚合运算（count/sum/avg/min/max） |
| `getLastResult()` | `QueryHistoryEntry` | 获取上次查询结果 |
| `clearHistory()` | `void` | 清空历史和缓存 |

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cacheTTL` | `number` | `30000` | 缓存过期时间（ms） |
| `cacheEnabled` | `boolean` | `true` | 是否启用缓存 |
| `maxHistory` | `number` | `20` | 历史记录最大条数 |

---

## ActionEngine

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `register(name, config)` | `void` | 注册操作处理器 |
| `execute(command, callbacks?)` | `Promise<ActionResult>` | 执行操作 |
| `executeBatch(commands, callbacks?)` | `Promise<BatchResult>` | 批量执行 |
| `undo()` | `Promise<UndoResult>` | 撤销 |
| `canUndo()` | `boolean` | 是否可撤销 |
| `getActions()` | `ActionInfo[]` | 获取已注册操作列表 |
| `beforeExecute(fn)` | `Function` | 添加权限钩子，返回取消函数 |
| `afterExecute(fn)` | `Function` | 添加后置钩子，返回取消函数 |
| `getAuditLog(filter?)` | `AuditEntry[]` | 获取审计日志 |

### register 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `handler` | `async (params) => result` | 操作处理函数 |
| `confirm` | `boolean` | 是否需要确认 |
| `undo` | `async (params) => void` | 撤销函数 |
| `label` | `string` | 显示名称 |
| `retries` | `number` | 失败重试次数 |

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxUndo` | `number` | `10` | 撤销栈深度 |
| `requireConfirm` | `boolean` | `true` | 默认是否需要确认 |
| `onConfirm` | `async (label, params) => boolean` | `null` | 确认回调 |
| `retries` | `number` | `0` | 默认重试次数 |
| `maxAuditLog` | `number` | `200` | 审计日志最大条数 |

---

## FlowEngine

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `define(name, config)` | `Flow` | 定义流程 |
| `execute(name, data?, callbacks?, options?)` | `Promise<FlowResult>` | 执行流程 |
| `resume(name, data, failedAt, callbacks?)` | `Promise<FlowResult>` | 断点恢复 |
| `remove(name)` | `boolean` | 删除流程 |
| `list()` | `FlowInfo[]` | 列出所有流程 |
| `trackAction(command)` | `Suggestion` | 追踪操作模式（自动学习） |
| `clearHistory()` | `void` | 清空执行历史 |

### define 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | `string` | 流程描述 |
| `variables` | `string[]` | 变量名列表 |
| `steps` | `Step[]` | 步骤定义 |

### Step 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 步骤名称 |
| `handler` | `async (data, results) => result` | 处理函数 |
| `condition` | `(data, results) => boolean` | 条件函数（跳过步骤） |
| `parallel` | `Step[]` | 并行步骤组 |
| `flow` | `string` | 嵌套流程名 |
| `params` | `object` | 步骤参数（支持 `{{var}}` 替换） |

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoLearnThreshold` | `number` | `3` | 自动学习触发次数 |
| `storage` | `{ get, set }` | `localStorage` | 持久化适配器 |

---

## IntentParser

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `parse(input, ctx?)` | `Promise<ParsedCommand>` | 解析自然语言 |
| `defineSlots(engine, type, slots)` | `void` | 定义参数要求 |
| `clearContext()` | `void` | 清空对话上下文 |
| `getHistory()` | `ContextEntry[]` | 获取对话历史 |

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ai` | `async (input, ctx) => command` | `null` | AI 后端 |
| `fallback` | `RuleBasedParser` | `new RuleBasedParser()` | 规则引擎 |
| `maxContext` | `number` | `10` | 上下文保留条数 |
| `confidenceThreshold` | `number` | `0.5` | 最低置信度 |

---

## RuleBasedParser

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `addRule(pattern, builder)` | `void` | 添加解析规则 |
| `parse(input, ctx?)` | `ParsedCommand` | 解析输入 |
| `static createDefault()` | `RuleBasedParser` | 创建默认规则集 |

---

## TypeScript 类型

```ts
import type {
  AIAdapterOptions,
  ParsedCommand,
  ProcessResult,
  QueryResult,
  ActionResult,
  FlowResult,
  BatchResult,
  UndoResult,
  AggResult,
  AuditEntry,
  FlowInfo,
  FlowStep,
  Suggestion,
  Message,
  ContextEntry,
} from '@kupola/ai-adapter';
```
