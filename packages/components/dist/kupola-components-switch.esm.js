function e(e={}){function n(){r||(s=!s,i(),o(),l&&l(s))}function i(){k&&(k.checked=s)}function o(){p&&p.setAttribute("aria-checked",s),k&&k.setAttribute("aria-checked",s)}const{checked:a=!1,disabled:r=!1,onChange:l=null}=e;let s=a;const d=c`
    <label class="ds-switch" role="switch" aria-checked="${s}" aria-disabled="${r}">
      <input type="checkbox" ${s?"checked":""} ${r?"disabled":""} role="switch" aria-checked="${s}" />
      <span class="ds-switch__thumb"></span>
    </label>
  `,h=document.createDocumentFragment(),u=t(d,h),p=h.querySelector(".ds-switch"),k=h.querySelector('input[type="checkbox"]');return p&&p.addEventListener("click",e=>{e.preventDefault(),n()}),{get element(){return h},toggle:n,isChecked:function(){return s},setChecked:function(e){r||(s=!!e,i(),o())},destroy:function(){u.destroy()}}}import{html as c}from"@kupola/platform/template";import{render as t}from"@kupola/platform/render";export{e as Switch};
