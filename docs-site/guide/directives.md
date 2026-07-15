# 指令系统

Kupola 提供声明式指令操作 DOM。

## k-data

定义响应式数据作用域：

```html
<div k-data="{ count: 0, name: 'Alice' }">
  <!-- 子元素可访问 count 和 name -->
</div>
```

## k-text

绑定文本内容：

```html
<p k-text="'Hello, ' + name"></p>
```

## k-html

绑定 HTML 内容（注意 XSS）：

```html
<div k-html="rawHtml"></div>
```

## k-bind

绑定属性：

```html
<input :value="name" :disabled="isLoading" />
<img :src="imageUrl" />
```

## k-on

绑定事件：

```html
<button @click="handleClick">Click</button>
<input @input.debounce="onInput" />
```

修饰符：`.stop` `.prevent` `.once` `.self`

## k-model

双向绑定：

```html
<input k-model="username" />
<select k-model="selected">
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

## k-show

条件显示：

```html
<div k-show="isVisible">可见内容</div>
```

## k-for

列表渲染：

```html
<ul>
  <li k-for="item in items" k-text="item.name"></li>
</ul>
```

## 初始化

```js
import { walk } from '@kupola/kupola'
walk(document.body) // 扫描并初始化所有 k-data
```
