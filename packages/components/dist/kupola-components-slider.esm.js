function e(e={}){function s(){if(!h||!g||!y)return;h.value=f;const e=(f-l)/(d-l)*100;g.style.width=e+"%",y.style.left=e+"%",k&&(k.textContent=f)}function r(e,t,n){return Math.max(t,Math.min(n,Number(e)||0))}const{label:i="",min:l=0,max:d=100,step:o=1,value:a=0,disabled:u=!1,onChange:c=null}=e;let f=r(a,l,d),_=!1;const p=function(){function e(){for(const e of t)e.target.removeEventListener(e.eventName,e.handler,e.options);t.clear()}const t=new Set;let n=!1;return{on:function(e,s,r,i){if(n||!e||"function"!=typeof e.addEventListener)return()=>{};e.addEventListener(s,r,i);const l={target:e,eventName:s,handler:r,options:i};return t.add(l),()=>{t.delete(l)&&e.removeEventListener(s,r,i)}},clear:e,destroy:function(){n||(n=!0,e())}}}(),m=t`
    <div class="ds-slider">
      ${i?t`
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
  `,v=document.createDocumentFragment(),b=n(m,v),h=v.querySelector(".ds-slider__input"),g=v.querySelector(".ds-slider__fill"),y=v.querySelector(".ds-slider__thumb"),k=v.querySelector(".ds-slider__value");h&&(h.min=l,h.max=d,h.step=o,h.value=f,h.disabled=u,p.on(h,"input",function(e){f=Number(e.target.value),s(),c&&c(f)})),s();const N={get element(){return v},getValue:function(){return f},setValue:function(e){_||(f=r(e,l,d),s(),c&&c(f))},destroy(){_||(_=!0,p.destroy(),b.destroy(),Object.freeze(N))}};return N}import{html as t}from"@kupola/platform/template";import{render as n}from"@kupola/platform/render";export{e as Slider};
