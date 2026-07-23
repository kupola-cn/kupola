# 组件规范

组件库是 Kupola 的可选扩展。新增或修改组件时，优先保持一致的工厂函数形态和可维护的交互行为，而不是堆叠功能数量。

## API 形态

所有组件保持统一调用方式：

```js
const instance = Component(options)
container.appendChild(instance.element)
instance.destroy()
```

实例至少包含：

- `element`：组件根节点或片段。
- `destroy()`：移除事件监听、副作用、定时器和浮层。
- 必要时提供 `setValue()`、`getValue()`、`open()`、`close()`、`setData()` 等可预测方法。

## 行为约定

- CSS 类名使用 `kupola-` 或项目现有命名空间，避免污染全局样式。
- 交互组件必须清理所有事件监听、定时器和 DOM 浮层。
- 表单组件必须支持禁用态、初始值、读值和变更回调。
- 浮层组件必须处理关闭、焦点、ESC、遮罩点击和销毁后的残留 DOM。
- 数据组件优先保证排序、分页、筛选、选择等核心行为稳定，再扩展高级能力。

## 文档与测试

新增组件至少同步更新：

- `packages/core/src/components/{name}.js`
- `packages/core/__tests__/components/{name}.test.js`
- `packages/core/src/components/types.d.ts`
- `package.json` exports
- `docs-site/components/{name}.md`

Rollup 会自动扫描 `packages/core/src/components/*.js` 生成组件构建入口，不需要再手工修改 `rollup.config.cjs`。
