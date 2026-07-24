function c(c={}){function i(){m&&m.classList.toggle("is-visible")}function s(c){_=c,l(),m&&m.classList.remove("is-visible"),a&&a(_)}function l(){v&&(v.style.backgroundColor=_||"transparent"),g&&(g.textContent=_||""),b&&b.querySelectorAll(".ds-color-picker__color").forEach(c=>{c.classList.toggle("is-selected",c.dataset.color===_)})}const{value:n="",colors:t=r,showInput:d=!0,disabled:p=!1,onChange:a=null}=c;let _=n;const u=o`
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
  `,f=document.createDocumentFragment(),k=e(u,f),v=f.querySelector(".ds-color-picker__trigger"),m=f.querySelector(".ds-color-picker__panel"),b=f.querySelector(".ds-color-picker__grid"),g=f.querySelector(".ds-color-picker__value"),h=f.querySelector(".ds-color-picker__input");return t.forEach(c=>{const o=document.createElement("div");o.className="ds-color-picker__color",o.style.backgroundColor=c,o.dataset.color=c,o.addEventListener("click",()=>s(c)),b.appendChild(o)}),h&&(d||(h.parentElement.style.display="none"),h.addEventListener("input",c=>s(c.target.value))),v&&v.addEventListener("click",i),p&&(v.style.pointerEvents="none"),l(),{get element(){return f},getValue:function(){return _},setValue:function(c){_=c,l(),a&&a(_)},destroy:function(){v&&v.removeEventListener("click",i),k.destroy()}}}import{html as o}from"@kupola/platform/template";import{render as e}from"@kupola/platform/render";const r=["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e","#14b8a6","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#64748b"];export{c as ColorPicker};
