# Kupola 集成

AI Adapter 设计之初就考虑了与 Kupola UI 的深度集成，让你的应用可以通过自然语言驱动 UI 操作。

## Panel 面板

`getPanelHTML()` 返回一个带有 Kupola 指令的 AI 对话面板 HTML：

```js
import { AIAdapter } from '@kupola/ai-adapter';

const adapter = new AIAdapter({ /* ... */ });

// 获取面板 HTML
document.getElementById('ai-panel').innerHTML = adapter.getPanelHTML();

// 激活 Kupola 指令
import { walk } from '@kupola/kupola/directives';
walk(document.getElementById('ai-panel'));
```

面板包含：
- 消息列表（用户消息 + 系统回复）
- 输入框（支持 Enter 发送）
- 发送按钮

## 事件系统

AI Adapter 提供丰富的事件，方便你与 Kupola 组件联动：

```js
// 用户输入时
adapter.on('input', ({ input }) => {
  console.log('用户说:', input);
});

// 意图解析完成
adapter.on('parsed', (command) => {
  console.log('解析结果:', command.engine, command.type);
});

// 执行结果返回
adapter.on('result', ({ command, result }) => {
  // 在这里联动 Kupola 组件
});

// 流程步骤事件
adapter.on('flowStep', ({ step, label, status }) => {
  console.log(`步骤 ${label}: ${status}`);
});
```

`on()` 返回取消订阅函数：

```js
const unsub = adapter.on('result', handler);
// 稍后取消
unsub();
```

## 联动 Kupola 组件

### 查询结果 → Table

```js
import { Table } from '@kupola/kupola';

adapter.on('result', ({ command, result }) => {
  if (command.engine === 'query' && result.table) {
    Table.create('#result-area', {
      columns: result.table.columns,
      data: result.table.rows,
      pagination: result.pagination,
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

### 操作成功 → Notification

```js
import { Notification } from '@kupola/kupola';

adapter.on('result', ({ command, result }) => {
  if (command.engine === 'action') {
    if (result.success) {
      Notification.success({ title: '操作成功', message: result.data });
    } else if (result.cancelled) {
      Notification.info({ title: '操作已取消' });
    } else {
      Notification.error({ title: '操作失败', message: result.error });
    }
  }
});
```

### 流程执行 → Timeline / Progress

```js
import { Notification } from '@kupola/kupola';

adapter.on('flowStep', ({ step, label, status }) => {
  if (status === 'running') {
    Notification.info({ title: `执行中: ${label}` });
  } else if (status === 'done') {
    Notification.success({ title: `完成: ${label}` });
  } else if (status === 'error') {
    Notification.error({ title: `失败: ${label}` });
  }
});
```

## 对话记录

```js
const messages = adapter.getMessages();
// [
//   { role: 'user', text: '查询张三', timestamp: 1721... },
//   { role: 'system', text: '🔍 Found 3 employee record(s).', timestamp: 1721... },
// ]

// 清空对话
adapter.clearConversation();
```

## 完整集成示例

```js
import { AIAdapter } from '@kupola/ai-adapter';
import { Table, Modal, Notification } from '@kupola/kupola';
import { walk } from '@kupola/kupola/directives';

// 创建 adapter
const adapter = new AIAdapter({
  ai: async (input, ctx) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt: input, history: ctx.history }),
    });
    return res.json();
  },
  action: {
    onConfirm: (label) => confirm(`确认: ${label}?`),
  },
});

// 注册处理器
adapter.query.register('employee', async (p) => api.get('/employees', p));
adapter.action.register('delete', {
  handler: async (p) => api.delete(`/employees/${p.id}`),
  confirm: true, undo: async (p) => api.post('/undo', p),
});
adapter.flow.define('月末统计', {
  steps: [
    { label: '拉取数据', handler: async () => fetchData() },
    { label: '生成报告', handler: async (d, prev) => genReport(prev) },
  ],
});

// 挂载面板
document.getElementById('ai-panel').innerHTML = adapter.getPanelHTML();
walk(document.getElementById('ai-panel'));

// 联动 UI
adapter.on('result', ({ command, result }) => {
  if (command.engine === 'query' && result.table) {
    Table.create('#result', { columns: result.table.columns, data: result.table.rows });
  }
  if (command.engine === 'action' && result.success) {
    Notification.success({ title: '操作完成' });
  }
});
```

## 下一步

- [API 参考](./api) — 完整 API 文档
- [中间件](./middleware) — 扩展处理管道
