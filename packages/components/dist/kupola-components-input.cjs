"use strict";var t=require("@kupola/platform/template"),e=require("@kupola/platform/render");exports.Input=function(n={}){function u(t){f=t.target.value,s&&s(f)}function o(t){f=t.target.value,d&&d(f)}const{placeholder:l="",value:r="",type:i="text",status:a="",disabled:c=!1,name:p="",onInput:s=null,onChange:d=null}=n;let f=r;const m=a?` ds-input--${a}`:"",g=t.html`
    <div class="ds-input${m}">
      <input type="${i}" placeholder="${l}" />
    </div>
  `,h=document.createDocumentFragment(),v=e.render(g,h),$=h.querySelector("input");return $&&($.value=f,$.disabled=c,p&&($.name=p),$.addEventListener("input",u),$.addEventListener("change",o)),{get element(){return h},getValue:function(){return f},setValue:function(t){f=t,$&&($.value=f)},focus:function(){$&&$.focus()},destroy:function(){$&&($.removeEventListener("input",u),$.removeEventListener("change",o)),v.destroy()}}};
