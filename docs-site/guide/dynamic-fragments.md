# 动态片段协议

Kupola 不做全局 DOM 自动扫描。后端片段、AJAX 替换和局部渲染由拥有该容器的业务代码显式初始化和销毁。

## 替换顺序

```js
import { destroyWalk, walkOnce } from '@kupola/kupola'

async function replaceUsers(root) {
  destroyWalk(root)
  root.innerHTML = await fetch('/users/fragment').then(response => response.text())
  walkOnce(root, { sanitizer: sanitizeHtml })
}
```

片段必须来自可信模板。`walkOnce()` 防止同一 root 重复绑定；需要重新初始化时先 `destroyWalk(root)`。不要对任意用户 HTML 执行 `innerHTML + walkOnce()`。

## 自动销毁

对会从 document 中整体移除的独立 root，可使用 `walkAuto(root)`。它只在 root 断开连接时销毁，不会发现新片段，也不会扫描 detached root、Shadow DOM 或 iframe document。root 在同一 document 中移动时应保持存活。

`walkAuto()` 使用共享 MutationObserver，并在每次 DOM mutation 检查已注册 root；大量 root 或高频变更区域应改为拥有者显式 `destroy()`，避免不必要的 O(n) 检查。

## 边界

每个片段拥有自己的 root、sanitizer、destroy 时机和错误处理。嵌套 `k-data` 由父级 walk 处理；不要再对内部节点单独调用 `walk()`，除非先销毁原有 root。跨 document 移动、iframe document 与 Shadow DOM 没有自动生命周期语义，应为各自 document 建立独立 mount / destroy 协议。
