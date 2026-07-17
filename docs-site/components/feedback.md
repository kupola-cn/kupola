# 反馈组件

这一组组件用于提示状态、加载进度和空数据反馈。

```js
import { Alert } from '@kupola/kupola/components/alert'
```

## 组件清单

| 组件 | 导入 | 说明 |
| --- | --- | --- |
| Alert | `@kupola/kupola/components/alert` | 页面内提示条 |
| Progress | `@kupola/kupola/components/progress` | 进度条 |
| Skeleton | `@kupola/kupola/components/skeleton` | 骨架屏 |
| Spin | `@kupola/kupola/components/spin` | 加载旋转器 |
| Empty | `@kupola/kupola/components/empty` | 空状态 |
| Countdown | `@kupola/kupola/components/countdown` | 倒计时 |

## 重点

- `Empty` 适合列表、表格、搜索结果的空态。
- `Spin` 和 `Skeleton` 更适合异步加载时使用。
