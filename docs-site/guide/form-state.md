# 表单状态策略

`k-model` 是输入控件与 scope 顶层属性之间的同步工具，不负责表单验证、提交、错误提示、焦点或无障碍语义。

## 初始值与 reset

初始化时，scope 是唯一状态来源，`k-model` 会把它写回控件。调用原生 `form.reset()` 只会恢复 DOM 默认值，不能自动改写 scope；随后任一次响应式更新都可能再次以 scope 覆盖 DOM。业务应在 reset 事件中明确重新赋值状态，再调用或替代原生 reset。

```html
<form @reset.prevent="resetForm()">
  <input k-model.trim="name" />
  <button type="reset">重置</button>
</form>
```

```js
function resetForm() {
  this.name = ''
  this.role = 'member'
  this.tags = []
}
```

## 类型规则

`number` 通过 `.number` 转换；`.boolean` 只转换字符串 `"true"` 和 `"false"`。checkbox 数组按严格相等匹配 DOM value：取消勾选会移除所有相等项，重新勾选会写入一个值。DOM 表单值本质上是字符串，因此对象和数组引用不是支持的 checkbox / radio value；使用稳定的字符串标识，或在 change handler 中自行映射。

`input[type=file]` 不支持 `k-model`，使用 `@change` 读取 `event.target.files`。`contenteditable` 也不支持；富文本应由专门编辑器处理 selection、历史记录、清洗和粘贴。

## 输入与异步保存

文本输入会等待 IME composition 结束才提交；`.lazy` 在 change 时提交，`.debounce.300` 延迟提交。浏览器自动填充、密码管理器、移动输入法和 selection 行为需要在目标浏览器中验证。

异步提交应维护请求版本或 `AbortController`，只允许最后一次请求写回状态；destroy 后的回调也应先检查 view 是否仍有效。Kupola 不提供请求层，避免重复应用已有 HTTP 与验证体系。

## 可访问性

为每个控件提供关联 `label`，错误时设置 `aria-invalid` 与可读的错误说明，并在提交失败后把焦点移到首个错误控件。`k-model` 不会自动生成这些语义。
