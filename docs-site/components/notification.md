# Notification 通知

用于页面角落的全局通知，适合异步任务、状态变化和系统提醒。

```js
import { Notification } from '@kupola/kupola/components/notification'

const notification = Notification()
notification.success({
  title: '保存成功',
  description: '配置已经更新。',
})
```

## 常用能力

- `success(options)`
- `info(options)`
- `warning(options)`
- `error(options)`
- `open(options)`
- `destroy()`

## 常用选项

| 选项 | 说明 |
| --- | --- |
| title | 标题 |
| description | 描述 |
| duration | 自动关闭时间 |
| placement | 显示位置 |
