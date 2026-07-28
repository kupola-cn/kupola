function t(t={}){function s(){c||(c=!0,p&&p.classList.add("is-dismissed"),a&&a())}const{title:n="",description:l="",type:r="normal",closable:i=!1,onClose:a=null}=t;let c=!1;const d=function(){function t(){for(const t of e)t.target.removeEventListener(t.eventName,t.handler,t.options);e.clear()}const e=new Set;let o=!1;return{on:function(t,s,n,l){if(o||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(s,n,l);const r={target:t,eventName:s,handler:n,options:l};return e.add(r),()=>{e.delete(r)&&t.removeEventListener(s,n,l)}},clear:t,destroy:function(){o||(o=!0,t())}}}(),u=e`
    <div class="ds-alert ds-alert--${r}" role="alert">
      <div class="ds-alert__body">
        ${n?e`<div class="ds-alert__title">${n}</div>`:""}
        ${l?e`<div class="ds-alert__desc">${l}</div>`:""}
      </div>
      ${i?e`<button class="ds-alert__close" aria-label="Close">&times;</button>`:""}
    </div>
  `,f=document.createDocumentFragment(),m=o(u,f),p=f.querySelector(".ds-alert"),_=f.querySelector(".ds-alert__close");return _&&d.on(_,"click",t=>{t.stopPropagation(),s()}),{get element(){return f},dismiss:s,destroy:function(){d.destroy(),m.destroy()}}}import{html as e}from"@kupola/platform/template";import{render as o}from"@kupola/platform/render";export{t as Alert};
