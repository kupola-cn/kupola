"use strict";function e(e){let t=e?.value;return"function"==typeof t&&(t=t()),o.isSignalLike(t)&&(t=t.value),t}function t(e){return null!=e&&!1!==e&&""!==e}function l(e,t,l){return t.includes(e)?e:l}function n(e){return"string"==typeof e?e.trim():""}var a=require("@kupola/platform/component"),s=require("@kupola/platform/template"),o=require("@kupola/platform/render");let d=0;const i=a.defineComponent({props:["title","subtitle","icon","actions","header","footer","density","headerTone","bodyScrollable","bodyPadding","bodyClassName","fill","className","role","ariaLabel"],setup({props:a,children:o}){const i="ds-panel-title-"+ ++d,r=()=>t(e(a.title));return()=>s.html`
      <section
        class="${()=>function(t){const a=["ds-panel",`ds-panel--density-${l(e(t.density),["compact","default","comfortable"],"default")}`];"muted"===l(e(t.headerTone),["plain","muted"],"plain")&&a.push("ds-panel--header-muted"),!0===e(t.fill)&&a.push("ds-panel--fill");const s=n(e(t.className));return s&&a.push(s),a.join(" ")}(a)}"
        role="${()=>e(a.role)||null}"
        aria-label="${()=>e(a.ariaLabel)||null}"
        aria-labelledby="${()=>e(a.ariaLabel)||!r()?null:i}"
      >
        ${()=>t(e(a.header))||r()||t(e(a.subtitle))||t(e(a.icon))||t(e(a.actions))?(()=>{const l=e(a.header);return s.html`
        <header class="ds-panel__header">
          ${t(l)?l:function({title:e,subtitle:l,icon:n,actions:a,titleId:o}){return s.html`
    <div class="ds-panel__heading">
      ${t(n)?s.html`<span class="ds-panel__icon" aria-hidden="true">${n}</span>`:""}
      <div class="ds-panel__heading-copy">
        ${t(e)?s.html`<h2 class="ds-panel__title" id="${o}">${e}</h2>`:""}
        ${t(l)?s.html`<p class="ds-panel__subtitle">${l}</p>`:""}
      </div>
    </div>
    ${t(a)?s.html`<div class="ds-panel__actions">${a}</div>`:""}
  `}({title:e(a.title),subtitle:e(a.subtitle),icon:e(a.icon),actions:e(a.actions),titleId:i})}
        </header>
      `})():""}
        <div class="${()=>function(t){const a=["ds-panel__body",`ds-panel__body--padding-${l(e(t.bodyPadding),["none","compact","default","comfortable"],"default")}`];!0===e(t.bodyScrollable)&&a.push("ds-panel__body--scrollable");const s=n(e(t.bodyClassName));return s&&a.push(s),a.join(" ")}(a)}">${o}</div>
        ${()=>t(e(a.footer))?s.html`<footer class="ds-panel__footer">${e(a.footer)}</footer>`:""}
      </section>
    `}});exports.Panel=i;
