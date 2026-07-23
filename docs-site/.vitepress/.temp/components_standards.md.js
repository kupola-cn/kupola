import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"组件规范","description":"","frontmatter":{},"headers":[],"relativePath":"components/standards.md","filePath":"components/standards.md"}');
const _sfc_main = { name: "components/standards.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="组件规范" tabindex="-1">组件规范 <a class="header-anchor" href="#组件规范" aria-label="Permalink to &quot;组件规范&quot;">​</a></h1><p>组件库是 Kupola 的可选扩展。新增或修改组件时，优先保持一致的工厂函数形态和可维护的交互行为，而不是堆叠功能数量。</p><h2 id="api-形态" tabindex="-1">API 形态 <a class="header-anchor" href="#api-形态" aria-label="Permalink to &quot;API 形态&quot;">​</a></h2><p>所有组件保持统一调用方式：</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">const</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> instance</span><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}"> =</span><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}"> Component</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">(options)</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">container.</span><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">appendChild</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">(instance.element)</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">instance.</span><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">destroy</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">()</span></span></code></pre></div><p>实例至少包含：</p><ul><li><code>element</code>：组件根节点或片段。</li><li><code>destroy()</code>：移除事件监听、副作用、定时器和浮层。</li><li>必要时提供 <code>setValue()</code>、<code>getValue()</code>、<code>open()</code>、<code>close()</code>、<code>setData()</code> 等可预测方法。</li></ul><h2 id="行为约定" tabindex="-1">行为约定 <a class="header-anchor" href="#行为约定" aria-label="Permalink to &quot;行为约定&quot;">​</a></h2><ul><li>CSS 类名使用 <code>kupola-</code> 或项目现有命名空间，避免污染全局样式。</li><li>交互组件必须清理所有事件监听、定时器和 DOM 浮层。</li><li>表单组件必须支持禁用态、初始值、读值和变更回调。</li><li>浮层组件必须处理关闭、焦点、ESC、遮罩点击和销毁后的残留 DOM。</li><li>数据组件优先保证排序、分页、筛选、选择等核心行为稳定，再扩展高级能力。</li></ul><h2 id="文档与测试" tabindex="-1">文档与测试 <a class="header-anchor" href="#文档与测试" aria-label="Permalink to &quot;文档与测试&quot;">​</a></h2><p>新增组件至少同步更新：</p><ul><li><code>packages/core/src/components/{name}.js</code></li><li><code>packages/core/__tests__/components/{name}.test.js</code></li><li><code>packages/core/src/components/types.d.ts</code></li><li><code>package.json</code> exports</li><li><code>docs-site/components/{name}.md</code></li></ul><p>Rollup 会自动扫描 <code>packages/core/src/components/*.js</code> 生成组件构建入口，不需要再手工修改 <code>rollup.config.cjs</code>。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/standards.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const standards = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  standards as default
};
