# Message 全局消息

用于轻量级成功、失败、警告和信息反馈。

```js
import { Message } from '@kupola/components/message'

const message = Message()
message.success('保存成功')
message.error('保存失败')
```

## 常用方法

- `success(content)`
- `error(content)`
- `warning(content)`
- `info(content)`
- `open(options)`
- `destroy()`

## 常用选项

| 选项 | 说明 |
| --- | --- |
| content | 消息内容 |
| type | 消息类型 |
| duration | 自动关闭时间 |
