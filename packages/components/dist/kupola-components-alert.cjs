"use strict";var e=require("@kupola/platform/template"),s=require("@kupola/platform/render");exports.Alert=function(t={}){function l(){c||(c=!0,m&&m.classList.add("is-dismissed"),o&&o())}const{title:r="",description:i="",type:a="normal",closable:d=!1,onClose:o=null}=t;let c=!1;const n=e.html`
    <div class="ds-alert ds-alert--${a}" role="alert">
      <div class="ds-alert__body">
        ${r?e.html`<div class="ds-alert__title">${r}</div>`:""}
        ${i?e.html`<div class="ds-alert__desc">${i}</div>`:""}
      </div>
      ${d?e.html`<button class="ds-alert__close" aria-label="Close">&times;</button>`:""}
    </div>
  `,u=document.createDocumentFragment(),_=s.render(n,u),m=u.querySelector(".ds-alert"),v=u.querySelector(".ds-alert__close");return v&&v.addEventListener("click",e=>{e.stopPropagation(),l()}),{get element(){return u},dismiss:l,destroy:function(){_.destroy()}}};
