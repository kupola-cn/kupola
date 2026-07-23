import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"工具组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/tools.md","filePath":"components/tools.md"}');
const _sfc_main = { name: "components/tools.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="工具组件" tabindex="-1">工具组件 <a class="header-anchor" href="#工具组件" aria-label="Permalink to &quot;工具组件&quot;">​</a></h1><p>这一组组件是全局工具、数据展示和表格能力的集合。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Icons } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/icons&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Icons</td><td><code>@kupola/kupola/components/icons</code></td><td>SVG 图标集</td></tr><tr><td>Message</td><td><code>@kupola/kupola/components/message</code></td><td>轻量级全局消息</td></tr><tr><td>Heatmap</td><td><code>@kupola/kupola/components/heatmap</code></td><td>热力图</td></tr><tr><td>Table</td><td><code>@kupola/kupola/components/table</code></td><td>数据表格</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Message</code> 适合轻量成功/失败反馈。</li><li><code>Table</code> 是库里最常用的数据容器之一，支持排序、分页、选择和编辑。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tools.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const tools = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  tools as default
};
