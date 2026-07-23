import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"覆盖层组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/overlay.md","filePath":"components/overlay.md"}');
const _sfc_main = { name: "components/overlay.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="覆盖层组件" tabindex="-1">覆盖层组件 <a class="header-anchor" href="#覆盖层组件" aria-label="Permalink to &quot;覆盖层组件&quot;">​</a></h1><p>这一组组件负责弹层、浮层、提示和遮罩交互。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Modal } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/modal&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Modal</td><td><code>@kupola/kupola/components/modal</code></td><td>可控模态框，支持遮罩、ESC、聚焦管理</td></tr><tr><td>Dropdown</td><td><code>@kupola/kupola/components/dropdown</code></td><td>下拉菜单，支持键盘导航和选中态</td></tr><tr><td>Drawer</td><td><code>@kupola/kupola/components/drawer</code></td><td>侧边抽屉面板</td></tr><tr><td>Dialog</td><td><code>@kupola/kupola/components/dialog</code></td><td>命令式确认/提示对话框</td></tr><tr><td>Notification</td><td><code>@kupola/kupola/components/notification</code></td><td>全局通知消息</td></tr><tr><td>Tooltip</td><td><code>@kupola/kupola/components/tooltip</code></td><td>悬浮提示</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Modal</code> 适合有明确输入或确认流程的场景。</li><li><code>Dialog</code> 更适合一次性确认和警告。</li><li><code>Dropdown</code> 适合表单内联选择。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/overlay.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const overlay = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  overlay as default
};
