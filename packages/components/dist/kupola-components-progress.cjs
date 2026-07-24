"use strict";var e=require("@kupola/platform/template"),s=require("@kupola/platform/render");exports.Progress=function(r={}){function t(){m&&(m.style.width=c+"%",m.classList.remove("is-error","is-warning","is-success"),"error"===u?m.classList.add("is-error"):"warning"===u?m.classList.add("is-warning"):"success"===u&&m.classList.add("is-success"))}const{percent:n=0,status:i="",size:o="default",indeterminate:a=!1}=r;let c=Math.min(100,Math.max(0,n)),u=i;const d="sm"===o?" ds-progress--sm":"",p=a?" ds-progress--indeterminate":"",g=e.html`
    <div class="ds-progress${d}${p}">
      <div class="ds-progress__bar"></div>
    </div>
  `,l=document.createDocumentFragment(),f=s.render(g,l),m=l.querySelector(".ds-progress__bar");return t(),{get element(){return l},setPercent:function(e){c=Math.min(100,Math.max(0,e)),t()},getPercent:function(){return c},setStatus:function(e){u=e,t()},destroy:function(){f.destroy()}}};
