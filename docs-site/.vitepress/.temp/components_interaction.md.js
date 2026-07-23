import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"交互组件","description":"","frontmatter":{},"headers":[],"relativePath":"components/interaction.md","filePath":"components/interaction.md"}');
const _sfc_main = { name: "components/interaction.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="交互组件" tabindex="-1">交互组件 <a class="header-anchor" href="#交互组件" aria-label="Permalink to &quot;交互组件&quot;">​</a></h1><p>这一组组件用于文件、图片、标签和可视化输入交互。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">import</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}"> { FileUpload } </span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">from</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;@kupola/kupola/components/fileupload&#39;</span></span></code></pre></div><h2 id="组件清单" tabindex="-1">组件清单 <a class="header-anchor" href="#组件清单" aria-label="Permalink to &quot;组件清单&quot;">​</a></h2><table tabindex="0"><thead><tr><th>组件</th><th>导入</th><th>说明</th></tr></thead><tbody><tr><td>FileUpload</td><td><code>@kupola/kupola/components/fileupload</code></td><td>文件上传</td></tr><tr><td>DynamicTags</td><td><code>@kupola/kupola/components/dynamictags</code></td><td>动态标签输入</td></tr><tr><td>ImagePreview</td><td><code>@kupola/kupola/components/imagepreview</code></td><td>图片预览</td></tr><tr><td>ColorPicker</td><td><code>@kupola/kupola/components/colorpicker</code></td><td>颜色选择器</td></tr><tr><td>VirtualList</td><td><code>@kupola/kupola/components/virtuallist</code></td><td>虚拟列表</td></tr></tbody></table><h2 id="重点" tabindex="-1">重点 <a class="header-anchor" href="#重点" aria-label="Permalink to &quot;重点&quot;">​</a></h2><ul><li><code>VirtualList</code> 适合大列表滚动性能优化。</li><li><code>ColorPicker</code> 与品牌色主题切换结合使用更合适。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/interaction.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const interaction = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  interaction as default
};
