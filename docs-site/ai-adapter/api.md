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
| `capability` | `object` | `{}` | CapabilityRegistry 配置 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `process(input, ctx?)` | `Promise<ProcessResult>` | 解析 + 中间件拦截 + 路由 + 执行（核心方法） |
| `undo()` | `Promise<UndoResult>` | 撤销上一步操作 |
| `use(middleware)` | `this` | 添加中间件 |
| `getMessages()` | `Message[]` | 获取对话记录 |
| `clearConversation()` | `void` | 清空所有状态 |
| `getPanelHTML()` | `string` | 获取 UI 面板 HTML |
| `getDevToolsSnapshot()` | `DevToolsSnapshot` | 获取完整运行时状态快照 |
| `on(event, cb)` | `Function` | 订阅事件，返回取消函数 |
| `off(event, cb)` | `void` | 取消事件订阅 |
| `once(event, cb)` | `Function` | 一次性订阅，触发后自动取消 |
| `wildcard(pattern, cb)` | `Function` | 前缀匹配订阅（如 `'flow:*'`） |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `query` | `QueryEngine` | 查询引擎实例 |
| `action` | `ActionEngine` | 执行引擎实例 |
| `flow` | `FlowEngine` | 流程引擎实例 |
| `parser` | `IntentParser` | 意图解析器实例 |
| `bus` | `EventBus` | 事件总线实例 |
| `capability` | `CapabilityRegistry` | 集中式能力注册表 |

### 事件

| 事件 | 数据 | 触发时机 |
|------|------|----------|
| `input` | `{ input }` | 用户输入时 |
| `parsed` | `ParsedCommand` | 意图解析完成 |
| `result` | `{ command, result }` | 执行结果返回 |
| `flow:step` | `{ step, label, status }` | 流程步骤状态变化 |
| `flow:complete` | `{ name, results }` | 流程执行完成 |
| `action:before` | `{ action, params }` | 操作执行前 |
| `action:after` | `{ action, params, result }` | 操作执行后 |

---

## QueryEngine

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `register(name, handler)` | `void` | 注册查询处理器，`handler(params, context?)` |
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

查询缓存会把 `context` 纳入 cache key，避免不同用户或角色复用同一份缓存数据。

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
| `checkDependencies(type)` | `string \| null` | 检查操作依赖是否满足 |

### register 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `handler` | `async (params, context?) => result` | 操作处理函数 |
| `confirm` | `boolean` | 是否需要确认 |
| `undo` | `async (params) => void` | 撤销函数 |
| `label` | `string` | 显示名称 |
| `retries` | `number` | 失败重试次数 |
| `dependsOn` | `string[]` | 前置依赖操作列表 |

### 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxUndo` | `number` | `10` | 撤销栈深度 |
| `requireConfirm` | `boolean` | `true` | 默认是否需要确认 |
| `onConfirm` | `async (label, params) => boolean` | `null` | 确认回调；没有可用确认器时默认拒绝需要确认的操作 |
| `retries` | `number` | `0` | 默认重试次数 |
| `maxAuditLog` | `number` | `200` | 审计日志最大条数 |

---

## CapabilityRegistry

集中管理 AI 能力、权限、参数规则和返回字段过滤。

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `register(config)` | `CapabilityConfig` | 注册单个能力 |
| `registerMany(configs)` | `CapabilityRegistry` | 批量注册能力 |
| `unregister(engine, type)` | `boolean` | 移除能力 |
| `get(engine, type)` | `CapabilityConfig \| null` | 获取能力定义 |
| `has(engine, type)` | `boolean` | 是否已注册 |
| `canAccess(engine, type, context?)` | `boolean` | 仅做权限判断 |
| `list(filter?)` | `CapabilityConfig[]` | 列出能力 |
| `toAuthRules()` | `AuthGuardRule[]` | 转为权限规则 |
| `getAICapabilities(context?)` | `AICapabilityDescription[]` | 返回安全的 AI 可见能力清单 |
| `middleware(options?)` | `Function` | 生成能力拦截中间件 |

### 能力配置

| 字段 | 说明 |
|------|------|
| `engine` | `query` / `action` / `flow` |
| `type` | 能力类型 |
| `resource` | 资源名 |
| `roles` / `permissions` | 权限要求 |
| `paramsSchema` | 参数白名单和类型规则 |
| `resultFields` | 仅返回的字段 |
| `sensitiveFields` | 额外脱敏字段 |
| `confirm` | 是否确认 |
| `handler` | 真正执行的业务处理函数 |

### 示例

```js
adapter.capability.register({
  engine: 'query',
  type: 'users',
  resource: 'users',
  label: '用户',
  roles: ['admin'],
  permissions: ['system:user'],
  paramsSchema: { keyword: 'string' },
  resultFields: ['id', 'username', 'real_name'],
  handler: async (params, context) => api.get('/api/users', params, context),
});
```

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
| `handler` | `async (data, results, context?) => result` | 处理函数 |
| `condition` | `(data, results, context?) => boolean` | 条件函数（跳过步骤） |
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

## EventBus

独立的事件总线类，支持 pub/sub、一次性监听和通配符匹配。

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `on(event, fn)` | `Function` | 订阅事件，返回取消函数 |
| `off(event, fn)` | `void` | 取消订阅 |
| `emit(event, data?)` | `void` | 触发事件 |
| `once(event, fn)` | `Function` | 一次性订阅 |
| `wildcard(pattern, fn)` | `Function` | 前缀匹配（如 `'flow:*'`） |
| `removeAll()` | `void` | 移除所有监听器 |
| `listenerCount(event)` | `number` | 指定事件的监听器数量 |
| `eventNames()` | `string[]` | 所有已注册事件名 |

---

## 内置中间件工厂

### createRateLimiter

```ts
function createRateLimiter(options?: {
  maxRequests?: number;   // 默认 30
  windowMs?: number;      // 默认 60000
}): Middleware;
```

滑动窗口速率限制中间件。超限时设置 `ctx.result` 并阻止后续处理。

### createDevToolsLogger

```ts
function createDevToolsLogger(options?: {
  maxEntries?: number;    // 默认 200
  redactFields?: string[]; // 默认脱敏 password/token/secret/authorization 等字段
}): Middleware;
```

记录每次 process 的输入、耗时、结果到 `window.__KUPOLA_AI_DEVTOOLS__`。

### createAuthGuard

```ts
function createAuthGuard(options?: {
  restrictedTypes?: string[];      // 受限 action type，兼容旧用法
  restrictedQueries?: string[];    // 受限 query type
  restrictedFlows?: string[];      // 受限 flow name
  rules?: AuthGuardRule[];         // 集中规则
  permissions?: Record<string, string[] | AuthGuardRule>;
  roleField?: string;              // 默认 'role'
  permissionsField?: string;       // 默认 'permissions'
  allowedRoles?: string[];         // 默认 ['admin']
  message?: string | ((payload) => string);
}): Middleware;
```

基于角色和权限的命令拦截中间件。未授权时设置错误结果并阻止后续处理，结果包含 `engine: 'auth-guard'`、`code: 'PERMISSION_DENIED'`、`message`。

```ts
interface AuthGuardRule {
  engine?: string | string[] | ((engine: string) => boolean);
  type?: string | string[] | ((type: string) => boolean);
  types?: string[];
  name?: string | string[] | ((name: string) => boolean);
  names?: string[];
  roles?: string[];
  allowedRoles?: string[];
  permission?: string | string[];
  permissions?: string[];
  message?: string | ((payload) => string);
  match?: (command: ParsedCommand, ctx: any) => boolean;
}
```

::: warning 安全边界
AI Adapter 的权限守卫是前端交互拦截和提示，不能替代服务端鉴权。API 必须基于登录态、角色、菜单权限和数据权限做最终判断；无权限时服务端应返回 `401` 或 `403`。
:::

---

## AIPanel

Kupola 原生对话面板组件。

### 构造函数

```js
new AIPanel(adapter, options?)
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `'AI Assistant'` | 面板标题 |
| `layout` | `'drawer' \| 'floating'` | `'drawer'` | 展示方式，默认右侧抽屉；传 `'floating'` 可使用旧的右下角悬浮面板 |
| `width` | `string` | `'520px'` | 面板宽度 |
| `height` | `string` | `'400px'` | 消息区域最大高度；抽屉布局会自动撑满可用高度 |
| `placeholder` | `string` | `'输入指令...'` | 输入框占位符 |
| `showTimestamp` | `boolean` | `false` | 是否显示消息时间戳 |
| `context` | `object \| (input) => object \| Promise<object>` | `{}` | 每次发送时传给 `adapter.process(input, context)` 的用户上下文 |
| `resultViewer` | `boolean` | `true` | 查询结果是否显示“查看数据/复制 JSON/导出 CSV”操作 |
| `resultPageSize` | `number` | `20` | 结果弹窗分页大小 |
| `maxTableColumns` | `number` | `12` | 结果弹窗最多显示列数 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `mount(parent)` | `AIPanel` | 挂载到 DOM 元素 |
| `open()` | `void` | 打开面板 |
| `close()` | `void` | 关闭面板 |
| `toggle()` | `void` | 切换显示/隐藏 |
| `destroy()` | `void` | 销毁面板并清理事件 |
| `addMessage(role, text, actions?)` | `void` | 添加消息 |

---

## AIDashboard

数据看板组件。

### 构造函数

```js
new AIDashboard(adapter, options?)
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refreshInterval` | `number` | `0` | 自动刷新间隔（ms，0=禁用） |
| `columns` | `string` | `'3'` | 每行列数 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `addCard(name, queryType, config?)` | `AIDashboard` | 添加看板卡片 |
| `removeCard(name)` | `AIDashboard` | 移除卡片 |
| `mount(parent)` | `AIDashboard` | 挂载到 DOM |
| `refresh(name)` | `Promise<void>` | 刷新指定卡片 |
| `refreshAll()` | `Promise<void>` | 刷新所有卡片 |
| `destroy()` | `void` | 销毁看板 |

### DashboardCardConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 卡片标签 |
| `aggregate` | `string` | 聚合函数：`'count'` / `'sum:field'` / `'avg:field'` |
| `params` | `object` | 查询参数 |
| `icon` | `string` | 图标 |

---

## VoiceController

Web Speech API 语音交互控制器。

### 构造函数

```js
new VoiceController(adapter, options?)
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `lang` | `string` | `'zh-CN'` | 识别语言 |
| `wakeWord` | `string` | `'小库'` | 唤醒词 |
| `commandMap` | `object` | `{}` | 语音指令映射 |
| `continuous` | `boolean` | `true` | 是否持续监听 |
| `tts` | `boolean` | `false` | 是否启用 TTS |
| `silenceMs` | `number` | `5000` | 无操作超时（ms） |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `supported` | `boolean` | 浏览器是否支持 Web Speech API |
| `isListening` | `boolean` | 是否正在监听 |
| `isAwake` | `boolean` | 是否已唤醒（命令模式） |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `start()` | `VoiceController` | 开始监听 |
| `stop()` | `VoiceController` | 停止监听 |
| `onWake(fn)` | `Function` | 注册唤醒回调 |
| `onResult(fn)` | `Function` | 注册识别结果回调 |
| `onError(fn)` | `Function` | 注册错误回调 |
| `speak(text, options?)` | `void` | TTS 语音播报 |
| `destroy()` | `void` | 销毁并清理资源 |

---

## DevToolsSnapshot

```ts
interface DevToolsSnapshot {
  version: string;
  messages: Message[];
  middlewares: number;
  query: { registered: number; history: number; cache: number };
  action: { registered: number; undoStack: number; audit: number };
  flow: { defined: number; executions: number };
  events: string[];
}
```

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
  DevToolsSnapshot,
  EventBus,
  AIPanelOptions,
  AIPanel,
  AIDashboardOptions,
  DashboardCardConfig,
  AIDashboard,
  VoiceControllerOptions,
  VoiceController,
  RateLimiterOptions,
  DevToolsLoggerOptions,
  AuthGuardOptions,
} from '@kupola/ai-adapter';
```
