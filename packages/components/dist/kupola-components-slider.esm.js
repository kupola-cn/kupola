function s(s={}){function i(s){p=Number(s.target.value),t(),c&&c(p)}function t(){if(!b||!h||!g)return;b.value=p;const s=(p-r)/(a-r)*100;h.style.width=s+"%",g.style.left=s+"%",k&&(k.textContent=p)}function d(s,e,l){return Math.max(e,Math.min(l,Number(s)||0))}const{label:n="",min:r=0,max:a=100,step:u=1,value:o=0,disabled:_=!1,onChange:c=null}=s;let p=d(o,r,a);const m=e`
    <div class="ds-slider">
      ${n?e`
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
  `,f=document.createDocumentFragment(),v=l(m,f),b=f.querySelector(".ds-slider__input"),h=f.querySelector(".ds-slider__fill"),g=f.querySelector(".ds-slider__thumb"),k=f.querySelector(".ds-slider__value");return b&&(b.min=r,b.max=a,b.step=u,b.value=p,b.disabled=_,b.addEventListener("input",i)),t(),{get element(){return f},getValue:function(){return p},setValue:function(s){p=d(s,r,a),t(),c&&c(p)},destroy:function(){b&&b.removeEventListener("input",i),v.destroy()}}}import{html as e}from"@kupola/platform/template";import{render as l}from"@kupola/platform/render";export{s as Slider};
