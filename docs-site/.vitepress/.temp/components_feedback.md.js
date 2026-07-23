import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"反馈组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/feedback.md","filePath":"components/feedback.md"}');
const _sfc_main = { name: "components/feedback.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="反馈组件" tabindex="-1">反馈组件 <a class="header-anchor" href="#反馈组件" aria-label="Permalink to &quot;反馈组件&quot;">​</a></h1><p>这一组组件用于提示状态、加载进度和空数据反馈。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Alert } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/alert&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Alert</td><td><code>@kupola/kupola/components/alert</code></td><td>页面内提示条</td></tr><tr><td>Progress</td><td><code>@kupola/kupola/components/progress</code></td><td>进度条</td></tr><tr><td>Skeleton</td><td><code>@kupola/kupola/components/skeleton</code></td><td>骨架屏</td></tr><tr><td>Spin</td><td><code>@kupola/kupola/components/spin</code></td><td>加载旋转器</td></tr><tr><td>Empty</td><td><code>@kupola/kupola/components/empty</code></td><td>空状态</td></tr><tr><td>Countdown</td><td><code>@kupola/kupola/components/countdown</code></td><td>倒计时</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Empty</code> 适合列表、表格、搜索结果的空态。</li><li><code>Spin</code> 和 <code>Skeleton</code> 更适合异步加载时使用。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/feedback.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const feedback = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  feedback as default
};
