"use strict";var e=require("@kupola/platform/template"),s=require("@kupola/platform/render");exports.Slider=function(t={}){function n(){if(!h||!g||!y)return;h.value=_;const e=(_-l)/(d-l)*100;g.style.width=e+"%",y.style.left=e+"%",k&&(k.textContent=_)}function r(e,s,t){return Math.max(s,Math.min(t,Number(e)||0))}const{label:i="",min:l=0,max:d=100,step:u=1,value:a=0,disabled:o=!1,onChange:c=null}=t;let _=r(a,l,d),f=!1;const p=function(){function e(){for(const e of s)e.target.removeEventListener(e.eventName,e.handler,e.options);s.clear()}const s=new Set;let t=!1;return{on:function(e,n,r,i){if(t||!e||"function"!=typeof e.addEventListener)return()=>{};e.addEventListener(n,r,i);const l={target:e,eventName:n,handler:r,options:i};return s.add(l),()=>{s.delete(l)&&e.removeEventListener(n,r,i)}},clear:e,destroy:function(){t||(t=!0,e())}}}(),v=e.html`
    <div class="ds-slider">
      ${i?e.html`
        <div class="ds-slider__header">
          <span class="ds-slider__label">${i}</span>
          <span class="ds-slider__value">0</span>
        </div>
      `:""}
      <div class="ds-slider__track">
        <div class="ds-slider__fill"></div>
        <div class="ds-slider__thumb"></div>
        <input type="range" class="ds-slider__input" />
      </div>
    </div>
  `,m=document.createDocumentFragment(),b=s.render(v,m),h=m.querySelector(".ds-slider__input"),g=m.querySelector(".ds-slider__fill"),y=m.querySelector(".ds-slider__thumb"),k=m.querySelector(".ds-slider__value");h&&(h.min=l,h.max=d,h.step=u,h.value=_,h.disabled=o,p.on(h,"input",function(e){_=Number(e.target.value),n(),c&&c(_)})),n();const N={get element(){return m},getValue:function(){return _},setValue:function(e){f||(_=r(e,l,d),n(),c&&c(_))},destroy(){f||(f=!0,p.destroy(),b.destroy(),Object.freeze(N))}};return N};
