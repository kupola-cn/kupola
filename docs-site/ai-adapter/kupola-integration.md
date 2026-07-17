# Kupola 集成

AI Adapter 提供三个独立 UI 组件 + 丰富的事件系统，与 Kupola UI 深度联动。

## AIPanel — 对话面板

`AIPanel` 是基于 Kupola 原生组件构建的完整 AI 对话面板，默认以右侧抽屉展示，支持消息列表、输入框、进度条和流程时间线。需要旧版右下角悬浮面板时，可以传 `layout: 'floating'`。

### 基本用法

```js
import { AIAdapter, AIPanel } from '@kupola/ai-adapter';

const adapter = new AIAdapter({ /* ... */ });
const panel = new AIPanel(adapter, {
  title: 'AI 助手',
  width: '420px',
  height: '600px',
  placeholder: '输入指令...',
  showTimestamp: true,
  context: () => ({
    token: localStorage.getItem('his_token'),
    role: currentUser.role,
    permissions: currentUser.permissions,
  }),
});

// 挂载到 DOM
panel.mount(document.body);
panel.open();
```

### 面板功能

- **消息列表**：三种样式（`user` 蓝底 / `system` 灰底 / `suggestion` 黄底虚线）
- **输入框**：支持 Enter 发送 + 发送按钮
- **快捷操作**：`suggestion` 消息中的操作自动渲染为可点击按钮组
- **进度条**：批量操作时自动显示 `current/total` 进度
- **流程时间线**：流程执行时展示每步状态（running/success/error/skipped）
- **结果查看器**：查询返回表格数据时显示“查看数据 / 复制 JSON / 导出 CSV”
- **上下文注入**：`context` 会随每次输入传给 `adapter.process()`，用于权限守卫和业务 handler
- **最小化/关闭**：面板可最小化和关闭

### API

```js
panel.open();                              // 打开面板
panel.close();                             // 关闭面板
panel.toggle();                            // 切换显示/隐藏
panel.addMessage('system', '操作完成！');     // 添加消息
panel.addMessage('suggestion', '试试？', [   // 带操作按钮
  { label: '确认', action: () => doSomething() },
]);
panel.destroy();                           // 销毁面板
```

### 事件联动

AIPanel 自动监听 adapter 的 EventBus 事件，实时更新 UI：

```js
// 无需手动绑定 — AIPanel 内部自动监听：
// 'input'    → 显示用户消息
// 'parsed'   → 显示解析状态
// 'result'   → 显示系统回复
// 'flow:step' → 更新时间线
```

---

## AIDashboard — 数据看板

`AIDashboard` 将常用查询结果固定为看板卡片，支持聚合统计和自动刷新。

### 基本用法

```js
import { AIDashboard } from '@kupola/ai-adapter';

const dashboard = new AIDashboard(adapter, {
  refreshInterval: 30000,  // 每 30 秒自动刷新
  columns: '3',            // 每行 3 列
});

// 添加看板卡片
dashboard.addCard('headcount', 'employee', {
  label: '员工总数',
  aggregate: 'count',       // 对查询结果计数
});

dashboard.addCard('salary', 'salary', {
  label: '薪资总额',
  aggregate: 'sum:amount',  // 对 amount 字段求和
});

dashboard.addCard('avgAge', 'employee', {
  label: '平均年龄',
  aggregate: 'avg:age',     // 对 age 字段求平均
});

dashboard.mount(document.getElementById('dashboard'));
```

### 聚合函数

| 聚合 | 格式 | 说明 |
|------|------|------|
| 计数 | `'count'` | 结果数组的长度 |
| 求和 | `'sum:field'` | 指定字段的总和 |
| 平均 | `'avg:field'` | 指定字段的平均值 |

### API

```js
dashboard.addCard(name, queryType, config);  // 添加卡片
dashboard.removeCard(name);                  // 移除卡片
dashboard.refresh(name);                     // 刷新指定卡片
dashboard.refreshAll();                      // 刷新所有卡片
dashboard.destroy();                         // 销毁看板
```

### Mini Table

当查询结果包含 `table` 属性时，卡片自动渲染最多 5 行的表格预览：

```js
// 如果查询处理器返回 { data: [...], table: { columns: [...], rows: [...] } }
// AIDashboard 会自动渲染 mini table
```

---

## VoiceController — 语音交互

`VoiceController` 基于 Web Speech API 实现语音识别，支持唤醒词检测和语音指令映射。

### 基本用法

```js
import { VoiceController } from '@kupola/ai-adapter';

const voice = new VoiceController(adapter, {
  wakeWord: '小库',                          // 唤醒词
  lang: 'zh-CN',                             // 语言
  commandMap: {                               // 语音指令映射
    '发工资': '执行 发工资条',
    '查考勤': '查询 本月考勤',
    '月末统计': '运行 月末统计流程',
  },
  continuous: true,   // 持续监听
  tts: true,          // 启用语音播报
});

voice.start();
```

### 工作流程

```
用户说话 → 识别文本
  ├─ 包含唤醒词 "小库" → 激活命令模式 → 等待下一条指令
  └─ 命令模式下：
     ├─ 命中 commandMap → 自动调用 adapter.process()
     └─ 未命中 → 作为普通输入调用 adapter.process()
```

### TTS 语音播报

```js
// 查询结果自动播报
voice.onResult((text, result) => {
  voice.speak(result.message);
});

// 手动播报
voice.speak('操作完成，共找到 42 条记录');
```

### API

```js
voice.start();                    // 开始监听
voice.stop();                     // 停止监听
voice.onWake(fn);                 // 唤醒回调
voice.onResult(fn);               // 识别结果回调
voice.onError(fn);                // 错误回调
voice.speak(text, options);       // TTS 播报
voice.destroy();                  // 销毁
```

---

## 事件系统

AI Adapter 内置 `EventBus`，提供标准化事件通信：

### 事件列表

| 事件 | 数据 | 触发时机 |
|------|------|----------|
| `input` | `{ input }` | 用户输入时 |
| `parsed` | `ParsedCommand` | 意图解析完成 |
| `result` | `{ command, result }` | 执行结果返回 |
| `flow:step` | `{ step, label, status }` | 流程步骤状态变化 |
| `flow:complete` | `{ name, results }` | 流程执行完成 |
| `action:before` | `{ action, params }` | 操作执行前 |
| `action:after` | `{ action, params, result }` | 操作执行后 |

### 基本订阅

```js
// on() 返回取消订阅函数
const unsub = adapter.on('result', ({ command, result }) => {
  console.log(`${command.engine}: ${result.message}`);
});
unsub(); // 取消订阅
```

### 一次性监听

```js
adapter.once('flow:complete', ({ name }) => {
  console.log(`流程 ${name} 已完成`);
});
// 只触发一次，之后自动取消
```

### 通配符匹配

```js
// 监听所有 flow: 前缀的事件
adapter.wildcard('flow:*', (eventName, data) => {
  console.log(`[Flow] ${eventName}:`, data);
});
// 匹配 flow:step、flow:complete

// 监听所有 action: 前缀的事件
adapter.wildcard('action:*', (eventName, data) => {
  audit.log(eventName, data);
});
```

---

## 联动 Kupola 组件

### 查询结果 → Table

```js
import { Table } from '@kupola/kupola';

adapter.on('result', ({ command, result }) => {
  if (command.engine === 'query' && result.table) {
    Table.create('#result-area', {
      columns: result.table.columns,
      data: result.table.rows,
      pagination: result.paginated,
    });
  }
});
```

### 操作确认 → Modal

```js
import { Modal } from '@kupola/kupola';

const adapter = new AIAdapter({
  action: {
    onConfirm: async (label, params) => {
      return new Promise((resolve) => {
        Modal.confirm({
          title: `确认执行: ${label}`,
          content: JSON.stringify(params, null, 2),
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
  },
});
```

### 操作结果 → Notification

```js
import { Notification } from '@kupola/kupola';

adapter.on('action:after', ({ action, result }) => {
  if (result.success) {
    Notification.success({ title: '操作成功', message: action });
  } else if (result.cancelled) {
    Notification.info({ title: '操作已取消' });
  } else {
    Notification.error({ title: '操作失败', message: result.error });
  }
});
```

### 流程执行 → Timeline / Progress

```js
import { Notification } from '@kupola/kupola';

adapter.on('flow:step', ({ step, label, status }) => {
  if (status === 'running') {
    Notification.info({ title: `执行中: ${label}` });
  } else if (status === 'done') {
    Notification.success({ title: `完成: ${label}` });
  } else if (status === 'error') {
    Notification.error({ title: `失败: ${label}` });
  }
});
```

## 完整集成示例

```js
import { AIAdapter, AIPanel, AIDashboard, VoiceController } from '@kupola/ai-adapter';
import { createRateLimiter, createAuthGuard } from '@kupola/ai-adapter';
import { Table, Modal, Notification } from '@kupola/kupola';

// 创建 adapter
const adapter = new AIAdapter({
  action: {
    onConfirm: (label) => confirm(`确认: ${label}?`),
  },
});

// 内置中间件
adapter.use(createRateLimiter({ maxRequests: 20 }));
adapter.use(createAuthGuard({
  roleField: 'role',
  permissionsField: 'permissions',
  rules: [
    { engine: 'query', type: 'roles', roles: ['admin'], permissions: ['role:read'] },
    { engine: 'action', types: ['delete'], roles: ['admin'] },
  ],
}));

// 注册处理器
adapter.query.register('employee', async (p) => api.get('/employees', p));
adapter.action.register('delete', {
  handler: async (p) => api.delete(`/employees/${p.id}`),
  confirm: true, undo: async (p) => api.post('/undo', p),
  dependsOn: ['查询员工'],
});
adapter.flow.define('月末统计', {
  steps: [
    { label: '拉取数据', handler: async () => fetchData() },
    { label: '生成报告', handler: async (d, prev) => genReport(prev) },
  ],
});

// 挂载对话面板
const panel = new AIPanel(adapter, {
  title: 'AI 助手',
  context: () => ({
    role: currentUser.role,
    permissions: currentUser.permissions,
  }),
});
panel.mount(document.body);

// 挂载数据看板
const dashboard = new AIDashboard(adapter);
dashboard.addCard('count', 'employee', { label: '员工总数', aggregate: 'count' });
dashboard.mount(document.getElementById('dashboard'));

// 启用语音控制
const voice = new VoiceController(adapter, { wakeWord: '小库' });
voice.start();

// 联动 UI
adapter.on('result', ({ command, result }) => {
  if (command.engine === 'query' && result.table) {
    Table.create('#result', { columns: result.table.columns, data: result.table.rows });
  }
});
```

::: warning 安全边界
AIPanel 的 `context` 和 `createAuthGuard` 只负责前端交互拦截和无权限提示。真实系统仍必须在后端 API 校验登录态、角色、菜单权限和数据权限；前端被绕过时，后端应返回 `401` 或 `403`。
:::

## 下一步

- [API 参考](./api) — 完整 API 文档
- [中间件](./middleware) — 扩展处理管道 + 内置中间件工厂
