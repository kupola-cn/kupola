# Validation 校验

独立校验引擎，适合表单外的校验场景。

```js
import { Validation } from '@kupola/kupola/components/validation'

const validation = Validation()
const result = validation.validate('test@example.com', ['required', 'email'])
```

## 常用能力

- 内置常用规则
- 支持自定义同步校验
- 支持自定义异步校验
- 可与 `Form` 组合使用

## 适用场景

- 表单提交前统一校验
- API 参数校验
- 动态规则校验
