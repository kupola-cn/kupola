# 主题系统

Kupola 内置完整的主题系统，支持亮色/暗色主题切换和品牌色自定义。主题通过 `data-theme` 属性驱动 CSS 变量，支持系统偏好检测、localStorage 持久化和 FOUC 防护。

## 快速开始

```js
import { setTheme, toggleTheme, getPreferredTheme } from '@kupola/platform'

// 设置主题
setTheme('dark')
setTheme('light')

// 切换主题
toggleTheme() // dark → light 或 light → dark

// 获取用户偏好
const theme = getPreferredTheme() // 'light' 或 'dark'
```

## 主题 API

### getPreferredTheme()

检测用户偏好主题，优先级：localStorage → 系统偏好 → 默认 `'dark'`。

```js
import { getPreferredTheme } from '@kupola/platform'

const theme = getPreferredTheme()
```

**检测顺序**：
1. 读取 `localStorage.getItem('kupola-theme')`，如果值为 `'light'` 或 `'dark'` 则返回。
2. 检查 `matchMedia('(prefers-color-scheme: light)').matches`，如果匹配则返回 `'light'`。
3. 默认返回 `'dark'`。

### setTheme(theme)

设置主题并持久化到 localStorage。立即设置 `<html>` 上的 `data-theme` 属性。

```js
setTheme('light')
setTheme('dark')
```

### toggleTheme()

在亮色和暗色之间切换。返回切换后的主题。

```js
const newTheme = toggleTheme()
console.log(newTheme) // 'light' 或 'dark'
```

### onThemeChange(callback)

监听主题变化。返回取消监听的函数。

```js
const unsubscribe = onThemeChange((theme) => {
  console.log('主题切换为:', theme)
  // 更新第三方库、图表等
})

// 取消监听
unsubscribe()
```

## 防闪烁（Anti-FOUC）

### themePreload()

**阻塞式**主题预加载。在页面 `<head>` 中同步执行，读取 localStorage 和系统偏好，在首帧渲染前设置 `data-theme`，防止主题闪烁。

```html
<script type="module">
  import { themePreload } from '@kupola/platform'
  themePreload()
</script>
```

> **重要**：`themePreload()` 必须在 `<head>` 中的同步脚本中调用，否则无法防止 FOUC。

### stopThemePreload()

停止 `themePreload()` 安装的系统主题自动同步监听器。

```js
import { stopThemePreload } from '@kupola/platform'

stopThemePreload()
```

### getThemeInlineScript()

获取零依赖的内联脚本字符串，用于 SSR 或静态页面。直接嵌入 `<head>` 中无需引入 Kupola。

```js
import { getThemeInlineScript } from '@kupola/platform'

// 服务端渲染
const html = `<head>
  <script>${getThemeInlineScript()}</script>
</head>`
```

生成的脚本会：
1. 读取 `localStorage` 中的 `kupola-theme`。
2. 回退到 `prefers-color-scheme` 系统偏好。
3. 设置 `data-theme` 属性。
4. 恢复 `kupola-brand-color` 品牌色。

## 品牌色 API

品牌色系统允许自定义应用的主色调，通过 CSS 变量（`--bg-brand`, `--text-brand`, `--border-brand` 等）全局生效。

### DEFAULT_BRAND_COLORS

默认品牌色预设数组。

```js
import { DEFAULT_BRAND_COLORS } from '@kupola/platform'

console.log(DEFAULT_BRAND_COLORS)
// [
//   { id: 'green',  label: 'Green',  color: '#22C55E' },
//   { id: 'blue',   label: 'Blue',   color: '#3B82F6' },
//   { id: 'purple', label: 'Purple', color: '#A855F7' },
//   { id: 'orange', label: 'Orange', color: '#F97316' },
//   { id: 'red',    label: 'Red',    color: '#EF4444' },
//   { id: 'slate',  label: 'Slate',  color: '#535164' },
//   { id: 'amber',  label: 'Amber',  color: '#F59E0B' },
//   { id: 'teal',   label: 'Teal',   color: '#14B8A6' },
// ]
```

### getBrandColors()

获取当前所有品牌色预设。

```js
const colors = getBrandColors()
```

### resolveBrandColor(value)

解析预设 ID 或十六进制颜色值为规范化的品牌色对象。

```js
resolveBrandColor('blue')           // { id: 'blue', label: 'Blue', color: '#3B82F6' }
resolveBrandColor('#3b82f6')        // { id: 'blue', label: 'Blue', color: '#3B82F6' }
resolveBrandColor('#ff0000')        // { id: 'custom', label: '#FF0000', color: '#FF0000' }
resolveBrandColor({ id: 'my', label: 'My Color', color: '#abc' }) 
// { id: 'my', label: 'My Color', color: '#AABBCC' }
```

### getPreferredBrandColor()

获取用户偏好品牌色（从 localStorage 读取），或返回默认预设。

```js
const brand = getPreferredBrandColor()
// { id: 'green', label: 'Green', color: '#22C55E' }
```

### setBrandColor(value, options?)

设置品牌色，应用到 `<html>` 的 CSS 变量并持久化。

```js
setBrandColor('blue')
setBrandColor('#3b82f6')
setBrandColor({ id: 'custom', color: '#ff5500' }, { persist: true })
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `value` | `string \| { id?, label?, color }` | 预设 ID、十六进制颜色或品牌色对象。 |
| `options.persist` | `boolean` | 是否持久化到 localStorage，默认 `true`。 |
| `options.target` | `HTMLElement` | 目标元素，默认 `document.documentElement`。 |

**返回值**：`BrandColor` — 规范化后的品牌色对象。

设置品牌色时会自动计算并设置以下 CSS 变量：

| CSS 变量 | 说明 |
|----------|------|
| `--bg-brand` | 品牌色背景 |
| `--bg-brand-hover` | hover 状态背景 |
| `--bg-brand-disabled` | 禁用状态背景（30% 透明度） |
| `--bg-brand-popup` | 弹出层背景（12% 透明度） |
| `--bg-brand-overlay` | 覆盖层背景（12% 透明度） |
| `--text-brand` | 品牌色文字 |
| `--text-brand-hover` | hover 状态文字 |
| `--icon-brand` | 品牌色图标 |
| `--icon-brand-hover` | hover 状态图标 |
| `--border-brand` | 品牌色边框 |
| `--text-onbrand` | 品牌色上的文字（自动判断黑/白） |
| `--icon-onbrand` | 品牌色上的图标 |
| `--color-primary` | 主色 |
| `--color-primary-hover` | 主色 hover |
| `--color-primary-disabled` | 主色禁用 |
| `--color-primary-soft` | 主色柔和版 |
| `--color-accent` | 强调色 |
| `--color-on-primary` | 主色上的文字 |

### resetBrandColor(key?)

重置品牌色为默认值。

```js
resetBrandColor()
// 恢复为绿色默认预设
```

### onBrandColorChange(callback)

监听品牌色变化。返回取消监听的函数。

```js
const unsubscribe = onBrandColorChange((brand) => {
  console.log('品牌色切换为:', brand.color)
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', brand.color)
})
```

### registerBrandColors(colors)

注册自定义品牌色预设。

```js
import { registerBrandColors } from '@kupola/platform'

registerBrandColors([
  { id: 'coral', label: 'Coral', color: '#FF6B6B' },
  { id: 'mint', label: 'Mint', color: '#00D2A0' },
])

// 现在可以使用这些预设
setBrandColor('coral')
```

### attachBrandColorPicker(container, options?)

在指定容器上渲染品牌色选择器 UI。

```js
const trigger = document.querySelector('#brand-picker-btn')

const picker = attachBrandColorPicker(trigger, {
  colors: DEFAULT_BRAND_COLORS,
  title: '选择品牌色',
  custom: true,          // 是否显示自定义颜色输入
  customLabel: '自定义颜色',
})

// 控制选择器
picker.open()
picker.close()
picker.toggle()

// 销毁
picker.destroy()
```

**返回值**：`BrandColorPickerInstance` — 包含 `open()`, `close()`, `toggle()`, `destroy()` 方法。

选择器 UI 会自动定位到触发器附近，并响应窗口大小变化。点击选择器外部或按 Escape 键关闭。

## 完整示例

### 主题切换按钮

```js
import { defineComponent, html } from '@kupola/platform'
import { signal, effect } from '@kupola/core'
import { getPreferredTheme, setTheme, toggleTheme, onThemeChange } from '@kupola/platform'

const ThemeToggle = defineComponent({
  setup() {
    const theme = signal(getPreferredTheme())

    const unsubscribe = onThemeChange((newTheme) => {
      theme.value = newTheme
    })

    function handleToggle() {
      toggleTheme()
    }

    return {
      theme,
      handleToggle,
      destroy: () => unsubscribe(),
    }
  },

  destroyed({ destroy }) {
    destroy()
  },
})

// 使用
html`<${ThemeToggle} />`
```

### 品牌色选择器

```js
import { defineComponent, html } from '@kupola/platform'
import {
  attachBrandColorPicker,
  getPreferredBrandColor,
  onBrandColorChange,
  DEFAULT_BRAND_COLORS,
} from '@kupola/platform'
import { signal } from '@kupola/core'

const BrandColorPicker = defineComponent({
  setup() {
    const currentBrand = signal(getPreferredBrandColor())
    let picker = null

    const unsubscribe = onBrandColorChange((brand) => {
      currentBrand.value = brand
    })

    function mounted() {
      const trigger = document.querySelector('#brand-color-btn')
      picker = attachBrandColorPicker(trigger, {
        colors: DEFAULT_BRAND_COLORS,
        title: '品牌色',
        custom: true,
        customLabel: '自定义',
      })
    }

    function destroyed() {
      picker?.destroy()
      unsubscribe()
    }

    return { currentBrand, mounted, destroyed }
  },

  mounted({ mounted }) {
    mounted()
  },

  destroyed({ destroyed }) {
    destroyed()
  },
})
```

### SSR 防闪烁

```html
<!-- 在 <head> 中内联 -->
<script>
  (function() {
    var d = document.documentElement;
    var t = localStorage.getItem('kupola-theme');
    if (!t) {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
    d.dataset.theme = t;
    try {
      var b = localStorage.getItem('kupola-brand-color');
      if (b) {
        b = JSON.parse(b);
        var c = b.color || b;
        if (c) {
          d.dataset.brand = b.id || 'custom';
          d.style.setProperty('--bg-brand', c);
          d.style.setProperty('--text-brand', c);
          d.style.setProperty('--icon-brand', c);
          d.style.setProperty('--border-brand', c);
        }
      }
    } catch (e) {}
  })();
</script>
```

## 最佳实践

### 尊重系统偏好

初始化时使用 `getPreferredTheme()` 而不是硬编码默认值：

```js
setTheme(getPreferredTheme())
```

### 监听系统主题变化

`themePreload()` 会自动监听系统主题变化。如果手动管理，需要自行监听：

```js
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (!localStorage.getItem('kupola-theme')) {
    setTheme(e.matches ? 'dark' : 'light')
  }
})
```

### 配合 CSS 变量

在自定义样式中使用主题 CSS 变量：

```css
.my-component {
  background: var(--bg-base-default);
  color: var(--text-default);
  border: 1px solid var(--border-neutral-l1);
}

[data-theme="dark"] .my-component {
  /* 暗色主题特定样式 */
}
```