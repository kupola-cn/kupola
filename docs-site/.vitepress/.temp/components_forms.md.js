import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"表单组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/forms.md","filePath":"components/forms.md"}');
const _sfc_main = { name: "components/forms.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="表单组件" tabindex="-1">表单组件 <a class="header-anchor" href="#表单组件" aria-label="Permalink to &quot;表单组件&quot;">​</a></h1><p>这一组组件覆盖输入、选择、校验和表单状态管理。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { Form } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/form&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>Form</td><td><code>@kupola/kupola/components/form</code></td><td>表单收集、校验和提交处理</td></tr><tr><td>Input</td><td><code>@kupola/kupola/components/input</code></td><td>文本输入框</td></tr><tr><td>Select</td><td><code>@kupola/kupola/components/select</code></td><td>下拉选择器</td></tr><tr><td>Checkbox</td><td><code>@kupola/kupola/components/checkbox</code></td><td>复选框</td></tr><tr><td>Radio</td><td><code>@kupola/kupola/components/radio</code></td><td>单选框</td></tr><tr><td>Switch</td><td><code>@kupola/kupola/components/switch</code></td><td>开关</td></tr><tr><td>Slider</td><td><code>@kupola/kupola/components/slider</code></td><td>滑块</td></tr><tr><td>NumberInput</td><td><code>@kupola/kupola/components/numberinput</code></td><td>数字输入</td></tr><tr><td>Textarea</td><td><code>@kupola/kupola/components/textarea</code></td><td>多行文本</td></tr><tr><td>Timepicker</td><td><code>@kupola/kupola/components/timepicker</code></td><td>时间选择器</td></tr><tr><td>Validation</td><td><code>@kupola/kupola/components/validation</code></td><td>校验引擎</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>Form</code> 负责把原生表单读写和校验统一起来。</li><li><code>Validation</code> 是独立校验引擎，可单独接入非表单场景。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/forms.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const forms = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  forms as default
};
