import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"导航组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/navigation.md","filePath":"components/navigation.md"}');
const _sfc_main = { name: "components/navigation.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="导航组件" tabindex="-1">导航组件 <a class="header-anchor" href="#导航组件" aria-label="Permalink to &quot;导航组件&quot;">​</a></h1><p>这一组组件负责页面切换、路径展示和时间维度导航。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Tabs } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/tabs&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Tabs</td><td><code>@kupola/kupola/components/tabs</code></td><td>选项卡导航</td></tr><tr><td>Pagination</td><td><code>@kupola/kupola/components/pagination</code></td><td>分页器</td></tr><tr><td>Datepicker</td><td><code>@kupola/kupola/components/datepicker</code></td><td>日期选择器</td></tr><tr><td>Breadcrumb</td><td><code>@kupola/kupola/components/breadcrumb</code></td><td>面包屑路径</td></tr><tr><td>Menu</td><td><code>@kupola/kupola/components/menu</code></td><td>导航菜单</td></tr><tr><td>Calendar</td><td><code>@kupola/kupola/components/calendar</code></td><td>日历视图</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Breadcrumb</code> 适合层级导航。</li><li><code>Pagination</code> 和 <code>Calendar</code> 都有明确的键盘/点击交互。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/navigation.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const navigation = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  navigation as default
};
