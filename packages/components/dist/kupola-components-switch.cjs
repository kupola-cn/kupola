"use strict";var e=require("@kupola/platform/template"),c=require("@kupola/platform/render");exports.Switch=function(t={}){function n(){s||(o=!o,i(),a(),l&&l(o))}function i(){p&&(p.checked=o)}function a(){k&&k.setAttribute("aria-checked",o),p&&p.setAttribute("aria-checked",o)}const{checked:r=!1,disabled:s=!1,onChange:l=null}=t;let o=r;const d=e.html`
    <label class="ds-switch" role="switch" aria-checked="${o}" aria-disabled="${s}">
      <input type="checkbox" ${o?"checked":""} ${s?"disabled":""} role="switch" aria-checked="${o}" />
      <span class="ds-switch__thumb"></span>
    </label>
  `,u=document.createDocumentFragment(),h=c.render(d,u),k=u.querySelector(".ds-switch"),p=u.querySelector('input[type="checkbox"]');return k&&k.addEventListener("click",e=>{e.preventDefault(),n()}),{get element(){return u},toggle:n,isChecked:function(){return o},setChecked:function(e){s||(o=!!e,i(),a())},destroy:function(){h.destroy()}}};
