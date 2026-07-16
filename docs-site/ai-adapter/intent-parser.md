# 意图解析

意图解析是 AI Adapter 的第一道关卡，负责将用户的自然语言输入转化为结构化命令。

## 解析流程

```
"查询张三上个月出勤"
         ↓
    IntentParser.parse()
    ┌──── AI 后端（优先，如果配置了）
    └──── RuleBasedParser（fallback）
         ↓
{
  engine: 'query',
  type: 'search',
  params: { keyword: '张三上个月出勤' },
  confidence: 0.85,
  raw: '查询张三上个月出勤',
}
```

## IntentParser

`IntentParser` 是意图解析的协调者，管理 AI 后端和规则引擎的切换。

### 基本用法

```js
import { IntentParser, RuleBasedParser } from '@kupola/ai-adapter';

const parser = new IntentParser({
  ai: async (prompt, context) => {
    // 你的 AI 后端
    return { engine: 'query', type: 'search', params: { keyword: '...' } };
  },
  fallback: RuleBasedParser.createDefault(),
});

const command = await parser.parse('查询张三');
```

### 置信度评分

每次解析都会返回 0–1 的置信度分数：

| 来源 | 默认置信度 |
|------|-----------|
| AI 后端 | 0.9（AI 未指定时） |
| 规则精确匹配 | 0.85 |
| 规则模糊匹配 | 0.6 |
| 无法识别 | 0 |

低置信度会在响应消息中显示提示：

```js
const result = await adapter.process('查旬张三'); // 模糊匹配"查旬"→"查询"
// message: "🔍 Found 1 record(s). (confidence: 60%)"
```

### 置信度阈值

配置最低置信度阈值，低于阈值的解析视为不确定：

```js
const parser = new IntentParser({
  confidenceThreshold: 0.5, // 默认值
});
```

### Slot Filling（参数填充）

当命令缺少必需参数时，自动追问：

```js
// 定义某个操作需要的参数
parser.defineSlots('action', 'create', {
  required: ['name', 'department'],
  optional: ['phone'],
});

// 用户输入缺少参数时
const result = await adapter.process('添加员工');
// → { type: 'slot-fill', missingSlots: ['name', 'department'],
//     message: '请提供以下信息: name, department' }
```

### 上下文管理

IntentParser 维护对话历史，支持上下文感知解析：

```js
// AI 后端会收到历史上下文
const command = await parser.parse('那李四呢？', {
  // history 自动包含之前的对话
});

parser.getHistory();   // 获取对话历史
parser.clearContext(); // 清空上下文
```

---

## 接入 AI 后端

### 基本接口

AI 后端是一个 async function，接收 `(input, context)` 并返回结构化命令：

```js
const adapter = new AIAdapter({
  ai: async (input, context) => {
    // context.history = 最近 N 条对话
    // context 还可能包含额外信息（当前页面、选中项等）

    return {
      engine: 'query',     // 'query' | 'action' | 'flow'
      type: 'search',      // 具体操作类型
      params: { keyword: '张三' },
      confidence: 0.95,    // 可选，AI 未指定时默认 0.9
    };
  },
});
```

### OpenAI 示例

```js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const adapter = new AIAdapter({
  ai: async (input, context) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一个操作解析器。将用户输入转为 JSON：
            { "engine": "query|action|flow", "type": string, "params": object }
            支持的操作：查询员工、添加员工、删除员工、执行流程`,
        },
        ...context.history.map(h => ({ role: 'user', content: h.input })),
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  },
});
```

### 本地 Ollama 示例

```js
const adapter = new AIAdapter({
  ai: async (input, context) => {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'qwen2.5',
        prompt: `解析用户指令为 JSON: ${input}`,
        stream: false,
      }),
    });
    const data = await res.json();
    return JSON.parse(data.response);
  },
});
```

### AI 失败自动降级

当 AI 后端抛出异常时，自动降级到规则引擎：

```js
// AI 后端超时或出错 → 自动使用 RuleBasedParser
const result = await adapter.process('查询张三');
// 不会报错，会 fallback 到规则引擎解析
```

---

## RuleBasedParser（规则引擎）

不依赖 AI 的轻量级解析器，使用正则表达式匹配常见中英文模式。

### 内置规则

使用 `RuleBasedParser.createDefault()` 获得预设规则集：

| 中文模式 | 英文模式 | 引擎 | 类型 |
|---------|---------|------|------|
| `查询/查看/搜索 X` | `search/find/query X` | query | search |
| `添加/新增/创建 X` | `add/create/new X` | action | create |
| `删除/移除/去掉 X` | `delete/remove X` | action | delete |
| `修改 X 为 Y` | `update X to Y` | action | update |
| `执行/运行/启动 X` | `run/execute/start X` | flow | execute |
| `创建/新建/定义流程 X` | — | flow | define |
| `帮助 / help / ?` | — | system | help |

### 模糊匹配

规则引擎内置中文常见错别字纠正：

| 输入 | 纠正为 |
|------|--------|
| 查旬 / 察询 / 查寻 | 查询 |
| 添家 / 天加 | 添加 |
| 删处 / 删出 | 删除 |
| 修该 / 休改 | 修改 |
| 执形 / 执心 | 执行 |

模糊匹配会降低置信度（0.6 vs 精确匹配的 0.85）。

### 自定义规则

```js
import { RuleBasedParser } from '@kupola/ai-adapter';

const parser = new RuleBasedParser();

parser.addRule(/(?:报表|报告)(.+)/i, (match) => ({
  engine: 'query',
  type: 'report',
  params: { name: match[1].trim() },
}));

parser.addRule(/(?:审批|审核)(.+)/i, (match) => ({
  engine: 'action',
  type: 'approve',
  params: { target: match[1].trim() },
}));
```

### 规则优先级

规则按 `addRule` 顺序匹配，**先到先得**。如果有重叠关键词（如"创建"同时出现在 action 和 flow 规则中），需要确保更具体的规则排在前面。

---

## 下一步

- [三引擎详解](./engines) — 了解引擎如何执行命令
- [中间件](./middleware) — 在处理管道中插入自定义逻辑
- [API 参考](./api) — IntentParser 完整 API
