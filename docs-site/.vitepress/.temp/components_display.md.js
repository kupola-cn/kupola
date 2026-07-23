import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"展示组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/display.md","filePath":"components/display.md"}');
const _sfc_main = { name: "components/display.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="展示组件" tabindex="-1">展示组件 <a class="header-anchor" href="#展示组件" aria-label="Permalink to &quot;展示组件&quot;">​</a></h1><p>这一组组件用于显示标签、层级结构和摘要信息。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Tag } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/tag&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Tag</td><td><code>@kupola/kupola/components/tag</code></td><td>标签</td></tr><tr><td>Badge</td><td><code>@kupola/kupola/components/badge</code></td><td>徽标</td></tr><tr><td>Divider</td><td><code>@kupola/kupola/components/divider</code></td><td>分割线</td></tr><tr><td>Collapse</td><td><code>@kupola/kupola/components/collapse</code></td><td>折叠面板</td></tr><tr><td>Timeline</td><td><code>@kupola/kupola/components/timeline</code></td><td>时间线</td></tr><tr><td>Kbd</td><td><code>@kupola/kupola/components/kbd</code></td><td>键盘按键展示</td></tr><tr><td>Avatar</td><td><code>@kupola/kupola/components/avatar</code></td><td>头像</td></tr><tr><td>Statcard</td><td><code>@kupola/kupola/components/statcard</code></td><td>统计卡片</td></tr><tr><td>Tree</td><td><code>@kupola/kupola/components/tree</code></td><td>树形结构</td></tr><tr><td>Carousel</td><td><code>@kupola/kupola/components/carousel</code></td><td>轮播/走马灯</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Collapse</code> 适合隐藏高级配置或低频内容。</li><li><code>Statcard</code> 适合承载核心指标。</li><li><code>Tree</code> 适合层级数据浏览和展开收起。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/display.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const display = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  display as default
};
