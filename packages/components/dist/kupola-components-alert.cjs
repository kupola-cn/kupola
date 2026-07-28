"use strict";var t=require("@kupola/platform/template"),e=require("@kupola/platform/render");exports.Alert=function(s={}){function n(){c||(c=!0,p&&p.classList.add("is-dismissed"),a&&a())}const{title:r="",description:l="",type:o="normal",closable:i=!1,onClose:a=null}=s;let c=!1;const d=function(){function t(){for(const t of e)t.target.removeEventListener(t.eventName,t.handler,t.options);e.clear()}const e=new Set;let s=!1;return{on:function(t,n,r,l){if(s||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(n,r,l);const o={target:t,eventName:n,handler:r,options:l};return e.add(o),()=>{e.delete(o)&&t.removeEventListener(n,r,l)}},clear:t,destroy:function(){s||(s=!0,t())}}}(),u=t.html`
    <div class="ds-alert ds-alert--${o}" role="alert">
      <div class="ds-alert__body">
        ${r?t.html`<div class="ds-alert__title">${r}</div>`:""}
        ${l?t.html`<div class="ds-alert__desc">${l}</div>`:""}
      </div>
      ${i?t.html`<button class="ds-alert__close" aria-label="Close">&times;</button>`:""}
    </div>
  `,f=document.createDocumentFragment(),m=e.render(u,f),p=f.querySelector(".ds-alert"),v=f.querySelector(".ds-alert__close");return v&&d.on(v,"click",t=>{t.stopPropagation(),n()}),{get element(){return f},dismiss:n,destroy:function(){d.destroy(),m.destroy()}}};
