"use strict";var s=require("@kupola/platform/template"),e=require("@kupola/platform/render");exports.Slider=function(l={}){function i(s){p=Number(s.target.value),t(),o&&o(p)}function t(){if(!b||!h||!g)return;b.value=p;const s=(p-r)/(a-r)*100;h.style.width=s+"%",g.style.left=s+"%",k&&(k.textContent=p)}function d(s,e,l){return Math.max(e,Math.min(l,Number(s)||0))}const{label:n="",min:r=0,max:a=100,step:u=1,value:_=0,disabled:c=!1,onChange:o=null}=l;let p=d(_,r,a);const v=s.html`
    <div class="ds-slider">
      ${n?s.html`
        <div class="ds-slider__header">
          <span class="ds-slider__label">${n}</span>
          <span class="ds-slider__value">0</span>
        </div>
      `:""}
      <div class="ds-slider__track">
        <div class="ds-slider__fill"></div>
        <div class="ds-slider__thumb"></div>
        <input type="range" class="ds-slider__input" />
      </div>
    </div>
  `,f=document.createDocumentFragment(),m=e.render(v,f),b=f.querySelector(".ds-slider__input"),h=f.querySelector(".ds-slider__fill"),g=f.querySelector(".ds-slider__thumb"),k=f.querySelector(".ds-slider__value");return b&&(b.min=r,b.max=a,b.step=u,b.value=p,b.disabled=c,b.addEventListener("input",i)),t(),{get element(){return f},getValue:function(){return p},setValue:function(s){p=d(s,r,a),t(),o&&o(p)},destroy:function(){b&&b.removeEventListener("input",i),m.destroy()}}};
