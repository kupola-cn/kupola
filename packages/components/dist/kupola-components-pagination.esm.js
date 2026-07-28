function t(t){return r(function(t){const n=function(t){return a[t]}(t);return n?"function"==typeof n?n():"object"==typeof n&&"font"===n.type?`<span class="${n.class}"></span>`:n:c[t]||""}(t))}function n(t,n){const e=Number(t);return Number.isFinite(e)?Math.max(0,Math.floor(e)):n}function e(t,n){const e=Number(t);return Number.isFinite(e)&&e>0?Math.floor(e):n}function o(t,n){const o=Array.isArray(t)?t:[10,20,50,100],i=new Set,r=[];for(const t of o){const n=e(t,0);n&&!i.has(n)&&(i.add(n),r.push(n))}return i.has(n)||r.unshift(n),r}function i(i={}){function r(){return Math.max(1,Math.ceil(f/y))}function a(){if(b)return;w?.destroy();const n=document.createDocumentFragment();w=s(function(){const n=r(),e=function(){const t=r(),n=Math.min(g,t),e=Math.floor(n/2);let o=Math.max(1,v-e),i=Math.min(t,o+n-1);o=Math.max(1,i-n+1);const l=[];for(let t=o;t<=i;t++)l.push(t);return l}().map(t=>{const n=t===v;return l`
        <button
          class="ds-pagination__item${n?" is-active":""}"
          type="button"
          data-page="${t}"
          aria-label="Page ${t}"
          aria-current="${n?"page":null}"
        >${t}</button>
      `}),o=k.map(t=>l`
      <option value="${t}" selected="${t===y}">${t} / page</option>
    `);return l`
      <nav class="ds-pagination" aria-label="Pagination">
        ${d?l`<span class="ds-pagination__total">Total ${f} items</span>`:""}
        ${p?l`
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
        ${e}
        <button
          class="ds-pagination__item ds-pagination__next"
          type="button"
          data-action="next"
          disabled="${v>=n}"
          aria-label="Next"
        >${t("chevron-right")}</button>
      </nav>
    `}(),n),$.replaceChildren(n)}function c(t){if(b)return!1;const n=e(t,0);if(!n)return!1;const o=Math.min(n,r());return o!==v&&(v=o,a(),h?.(v,y),!0)}function u(t){if(b)return!1;const n=e(t,0);return!(!n||n===y||(y=n,v=1,k=o(k,y),a(),h?.(v,y),0))}const h="function"==typeof i.onChange?i.onChange:null,d=!1!==i.showTotal,p=!0===i.showSizeChanger,g=e(i.maxPages,7),x=function(){function t(){for(const t of n)t.target.removeEventListener(t.eventName,t.handler,t.options);n.clear()}const n=new Set;let e=!1;return{on:function(t,o,i,r){if(e||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(o,i,r);const l={target:t,eventName:o,handler:i,options:r};return n.add(l),()=>{n.delete(l)&&t.removeEventListener(o,i,r)}},clear:t,destroy:function(){e||(e=!0,t())}}}();let f=n(i.total,0),y=e(i.pageSize,10),v=e(i.current,1),k=o(i.pageSizeOptions,y),w=null,b=!1;const m=document.createDocumentFragment(),$=document.createElement("div");return m.appendChild($),v=Math.min(v,r()),x.on($,"click",t=>{const n=t.target?.closest?.("button");if(!n||!$.contains(n)||n.disabled)return;const e=Number(n.dataset.page);Number.isInteger(e)&&e>0?c(e):"previous"===n.dataset.action?c(v-1):"next"===n.dataset.action&&c(v+1)}),x.on($,"change",t=>{t.target?.matches?.(".ds-pagination__size")&&u(t.target.value)}),a(),{get element(){return m},setCurrent:c,setTotal:function(t){if(b)return!1;const e=n(t,-1);if(e<0||e===f)return!1;f=e;const o=Math.min(v,r()),i=o!==v;return v=o,a(),i&&h?.(v,y),!0},setPageSize:u,getCurrent:function(){return v},getTotal:function(){return f},getPageSize:function(){return y},destroy(){b||(b=!0,x.destroy(),w?.destroy(),w=null)}}}import{htmlString as r,html as l}from"@kupola/platform/template";import{render as s}from"@kupola/platform/render";const a={},c={x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',"chevron-left":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',"chevron-right":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',"chevron-down":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',"check-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',"alert-triangle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',"x-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',"info-circle":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',calendar:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',upload:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',table:'<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'};export{i as Pagination};
