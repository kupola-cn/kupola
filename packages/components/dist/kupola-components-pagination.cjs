"use strict";function t(t){return i.htmlString(function(t){const e=function(t){return l[t]}(t);return e?"function"==typeof e?e():"object"==typeof e&&"font"===e.type?`<span class="${e.class}"></span>`:e:s[t]||""}(t))}function e(t,e){const n=Number(t);return Number.isFinite(n)?Math.max(0,Math.floor(n)):e}function n(t,e){const n=Number(t);return Number.isFinite(n)&&n>0?Math.floor(n):e}function o(t,e){const o=Array.isArray(t)?t:[10,20,50,100],i=new Set,r=[];for(const t of o){const e=n(t,0);e&&!i.has(e)&&(i.add(e),r.push(e))}return i.has(e)||r.unshift(e),r}var i=require("@kupola/platform/template"),r=require("@kupola/platform/render");const l={},s={x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',"chevron-left":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',"chevron-right":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',"chevron-down":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',"check-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',"alert-triangle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',"x-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',"info-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',calendar:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',upload:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',table:'<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'};exports.Pagination=function(l={}){function s(){return Math.max(1,Math.ceil(y/f))}function a(){if(b)return;w?.destroy();const e=document.createDocumentFragment();w=r.render(function(){const e=s(),n=function(){const t=s(),e=Math.min(p,t),n=Math.floor(e/2);let o=Math.max(1,v-n),i=Math.min(t,o+e-1);o=Math.max(1,i-e+1);const r=[];for(let t=o;t<=i;t++)r.push(t);return r}().map(t=>{const e=t===v;return i.html`
        <button
          class="ds-pagination__item${e?" is-active":""}"
          type="button"
          data-page="${t}"
          aria-label="Page ${t}"
          aria-current="${e?"page":null}"
        >${t}</button>
      `}),o=k.map(t=>i.html`
      <option value="${t}" selected="${t===f}">${t} / page</option>
    `);return i.html`
      <nav class="ds-pagination" aria-label="Pagination">
        ${d?i.html`<span class="ds-pagination__total">Total ${y} items</span>`:""}
        ${g?i.html`
          <label class="ds-pagination__size-label">
            <span class="ds-visually-hidden">Items per page</span>
            <select class="ds-pagination__size" aria-label="Items per page">${o}</select>
          </label>
        `:""}
        <button
          class="ds-pagination__item ds-pagination__prev"
          type="button"
          data-action="previous"
          disabled="${v<=1}"
          aria-label="Previous"
        >${t("chevron-left")}</button>
        ${n}
        <button
          class="ds-pagination__item ds-pagination__next"
          type="button"
          data-action="next"
          disabled="${v>=e}"
          aria-label="Next"
        >${t("chevron-right")}</button>
      </nav>
    `}(),e),$.replaceChildren(e)}function c(t){if(b)return!1;const e=n(t,0);if(!e)return!1;const o=Math.min(e,s());return o!==v&&(v=o,a(),h?.(v,f),!0)}function u(t){if(b)return!1;const e=n(t,0);return!(!e||e===f||(f=e,v=1,k=o(k,f),a(),h?.(v,f),0))}const h="function"==typeof l.onChange?l.onChange:null,d=!1!==l.showTotal,g=!0===l.showSizeChanger,p=n(l.maxPages,7),x=function(){function t(){for(const t of e)t.target.removeEventListener(t.eventName,t.handler,t.options);e.clear()}const e=new Set;let n=!1;return{on:function(t,o,i,r){if(n||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(o,i,r);const l={target:t,eventName:o,handler:i,options:r};return e.add(l),()=>{e.delete(l)&&t.removeEventListener(o,i,r)}},clear:t,destroy:function(){n||(n=!0,t())}}}();let y=e(l.total,0),f=n(l.pageSize,10),v=n(l.current,1),k=o(l.pageSizeOptions,f),w=null,b=!1;const m=document.createDocumentFragment(),$=document.createElement("div");return m.appendChild($),v=Math.min(v,s()),x.on($,"click",t=>{const e=t.target?.closest?.("button");if(!e||!$.contains(e)||e.disabled)return;const n=Number(e.dataset.page);Number.isInteger(n)&&n>0?c(n):"previous"===e.dataset.action?c(v-1):"next"===e.dataset.action&&c(v+1)}),x.on($,"change",t=>{t.target?.matches?.(".ds-pagination__size")&&u(t.target.value)}),a(),{get element(){return m},setCurrent:c,setTotal:function(t){if(b)return!1;const n=e(t,-1);if(n<0||n===y)return!1;y=n;const o=Math.min(v,s()),i=o!==v;return v=o,a(),i&&h?.(v,f),!0},setPageSize:u,getCurrent:function(){return v},getTotal:function(){return y},getPageSize:function(){return f},destroy(){b||(b=!0,x.destroy(),w?.destroy(),w=null)}}};
