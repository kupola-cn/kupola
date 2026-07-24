function e(e={}){function n(){u=k.checked,o(),i&&i(u)}function o(){f&&(f.setAttribute("aria-checked",u),f.setAttribute("aria-disabled",r)),k&&k.setAttribute("aria-checked",u)}const{label:t="",checked:l=!1,disabled:r=!1,name:s="",value:d="",onChange:i=null}=e;let u=l;const h=c`
    <label class="ds-checkbox" role="checkbox" aria-checked="${l}" ${r?'aria-disabled="true"':""}>
      <input type="checkbox" />
      <span class="ds-checkbox__box"></span>
      ${t?c`<span class="ds-checkbox__label">${t}</span>`:""}
    </label>
  `,p=document.createDocumentFragment(),b=a(h,p),k=p.querySelector("input"),f=p.querySelector(".ds-checkbox");return k&&(k.checked=u,k.disabled=r,s&&(k.name=s),d&&(k.value=d),k.addEventListener("change",n)),{get element(){return p},isChecked:function(){return u},setChecked:function(e){u=!!e,k&&(k.checked=u),o(),i&&i(u)},destroy:function(){k&&k.removeEventListener("change",n),b.destroy()}}}import{html as c}from"@kupola/platform/template";import{render as a}from"@kupola/platform/render";export{e as Checkbox};
