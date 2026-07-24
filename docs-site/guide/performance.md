# 性能边界

Kupola 适合中小型、可信模板的局部交互。它不会自动追踪深层对象，也不会提供全局扫描或虚拟列表指令。

## 响应式更新

scope 只追踪顶层属性。修改深层字段或数组内容后，应重新赋值顶层值：

```js
this.user = { ...this.user, name: 'Ada' }
this.items = [...this.items, nextItem]
```

不要期待 `this.user.name = 'Ada'` 或 `this.items.push(nextItem)` 自动触发模板更新。这是有意的边界，避免引入深层 Proxy 和隐式性能成本。

表达式缓存有固定上限，适合稳定的项目模板；不要不断拼接生成新的指令表达式。动态服务端片段应复用固定模板结构和表达式。

## 列表与频繁更新

`k-for` 使用稳定 key 时可复用行 DOM；无 key 时每次更新会重建整表。超过数百行、滚动密集或需要稳定焦点的列表，优先使用 `VirtualList`、分页或业务层窗口化。不要用 `k-html`、大对象式 `k-bind` 或大对象式 `k-style` 承担高频更新。

## 生命周期

片段替换前调用 `destroyWalk()`，长寿命 root 只调用一次 `walkOnce()`。高频 mount/unmount、`.outside`、`.debounce`、transition 和 watch cleanup 应在目标页面做 profiling；DOM 结果正确不等于 listener、timer 或网络回调没有泄漏。

性能选择顺序通常是：静态内容使用原生 HTML/CSS；局部交互使用 Kupola 指令；复杂可复用交互使用组件库；大数据集合使用虚拟列表或服务端分页。
