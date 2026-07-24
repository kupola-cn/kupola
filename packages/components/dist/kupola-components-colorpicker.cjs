"use strict";var c=require("@kupola/platform/template"),e=require("@kupola/platform/render");const o=["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e","#14b8a6","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#64748b"];exports.ColorPicker=function(r={}){function s(){b&&b.classList.toggle("is-visible")}function i(c){u=c,l(),b&&b.classList.remove("is-visible"),a&&a(u)}function l(){v&&(v.style.backgroundColor=u||"transparent"),m&&(m.textContent=u||""),g&&g.querySelectorAll(".ds-color-picker__color").forEach(c=>{c.classList.toggle("is-selected",c.dataset.color===u)})}const{value:n="",colors:t=o,showInput:d=!0,disabled:p=!1,onChange:a=null}=r;let u=n;const _=c.html`
    <div class="ds-color-picker">
      <div class="ds-color-picker__trigger">
        <span class="ds-color-picker__swatch"></span>
      </div>
      <div class="ds-color-picker__panel">
        <div class="ds-color-picker__grid"></div>
        <div class="ds-color-picker__custom">
          <input class="ds-color-picker__input" type="color" />
          <span class="ds-color-picker__value"></span>
        </div>
      </div>
    </div>
  `,k=document.createDocumentFragment(),f=e.render(_,k),v=k.querySelector(".ds-color-picker__trigger"),b=k.querySelector(".ds-color-picker__panel"),g=k.querySelector(".ds-color-picker__grid"),m=k.querySelector(".ds-color-picker__value"),h=k.querySelector(".ds-color-picker__input");return t.forEach(c=>{const e=document.createElement("div");e.className="ds-color-picker__color",e.style.backgroundColor=c,e.dataset.color=c,e.addEventListener("click",()=>i(c)),g.appendChild(e)}),h&&(d||(h.parentElement.style.display="none"),h.addEventListener("input",c=>i(c.target.value))),v&&v.addEventListener("click",s),p&&(v.style.pointerEvents="none"),l(),{get element(){return k},getValue:function(){return u},setValue:function(c){u=c,l(),a&&a(u)},destroy:function(){v&&v.removeEventListener("click",s),f.destroy()}}};
