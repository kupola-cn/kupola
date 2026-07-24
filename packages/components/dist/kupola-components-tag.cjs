"use strict";var t=require("@kupola/platform/template"),e=require("@kupola/platform/render");exports.Tag=function(s={}){function l(){c||(c=!0,m&&(m.style.display="none"),r&&r())}const{text:o="",type:a="",closable:n=!1,onClose:r=null}=s;let c=!1;const u=a?` ds-tag--${a}`:"",i=n?" ds-tag--closable":"",d=t.html`
    <span class="ds-tag${u}${i}">
      ${o}
      ${n?t.html`<button class="ds-tag__close" aria-label="Close">&times;</button>`:""}
    </span>
  `,p=document.createDocumentFragment(),g=e.render(d,p),m=p.querySelector(".ds-tag"),b=p.querySelector(".ds-tag__close");return b&&b.addEventListener("click",t=>{t.stopPropagation(),l()}),{get element(){return p},dismiss:l,destroy:function(){g.destroy()}}};
