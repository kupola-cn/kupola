# ESLint 插件

`@kupola/eslint-plugin` 提供 3 条规则，防止 Kupola 开发中的常见错误。

## 配置

```js
// .eslintrc.cjs
module.exports = {
  plugins: ['@kupola'],
  rules: {
    '@kupola/no-invalid-directives': 'error',
    '@kupola/prefer-t-function': 'warn',
    '@kupola/no-innerhtml-user-input': 'error',
  }
};
```

## 规则

### `no-invalid-directives`

禁止使用未注册的 `k-*` 指令，防止拼写错误导致的静默失败。

```html
<!-- ❌ 错误 -->
<div k-bimd="value"></div>

<!-- ✅ 正确 -->
<div k-bind="value"></div>
```

### `prefer-t-function`

推荐使用 `t()` 函数进行国际化，而非硬编码字符串。

```js
// ❌ 警告
const label = '提交';

// ✅ 推荐
const label = t('form.submit');
```

### `no-innerhtml-user-input`

禁止将用户输入直接赋值给 `innerHTML`，防止 XSS 攻击。

```js
// ❌ 错误（XSS 风险）
element.innerHTML = userInput;

// ✅ 正确（转义后使用）
element.innerHTML = escapeHtml(userInput);
element.textContent = userInput;
```
