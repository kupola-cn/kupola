# Countdown 倒计时

用于展示剩余时间。

```js
import { Countdown } from '@kupola/kupola/components/countdown'

const countdown = Countdown({
  target: Date.now() + 60_000,
  onFinish: () => console.log('完成'),
})

document.body.appendChild(countdown.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| target | 目标时间 |
| format | 显示格式 |
| onFinish | 完成回调 |

## 方法

- `start()`
- `stop()`
- `destroy()`
