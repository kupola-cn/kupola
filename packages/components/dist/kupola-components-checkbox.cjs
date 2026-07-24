"use strict";var e=require("@kupola/platform/template"),c=require("@kupola/platform/render");exports.Checkbox=function(a={}){function n(){d=p.checked,t(),u&&u(d)}function t(){f&&(f.setAttribute("aria-checked",d),f.setAttribute("aria-disabled",s)),p&&p.setAttribute("aria-checked",d)}const{label:l="",checked:r=!1,disabled:s=!1,name:o="",value:i="",onChange:u=null}=a;let d=r;const h=e.html`
    <label class="ds-checkbox" role="checkbox" aria-checked="${r}" ${s?'aria-disabled="true"':""}>
      <input type="checkbox" />
      <span class="ds-checkbox__box"></span>
      ${l?e.html`<span class="ds-checkbox__label">${l}</span>`:""}
    </label>
  `,b=document.createDocumentFragment(),k=c.render(h,b),p=b.querySelector("input"),f=b.querySelector(".ds-checkbox");return p&&(p.checked=d,p.disabled=s,o&&(p.name=o),i&&(p.value=i),p.addEventListener("change",n)),{get element(){return b},isChecked:function(){return d},setChecked:function(e){d=!!e,p&&(p.checked=d),t(),u&&u(d)},destroy:function(){p&&p.removeEventListener("change",n),k.destroy()}}};
