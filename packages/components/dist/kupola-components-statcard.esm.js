function t(t={}){const{title:s="",value:r="",unit:c="",trend:e="",trendValue:i="",icon:n="",iconType:o="",size:l="default",hoverLift:_=!1,compact:v=!1,gradient:$=!1}=t,p=["ds-statcard"];_&&p.push("ds-statcard--hover-lift"),v&&p.push("ds-statcard--compact"),$&&p.push("ds-statcard--gradient");const u=p.join(" "),f=a`
    <div class="${u}">
      ${s||n?a`
        <div class="ds-statcard__header">
          ${s?a`<div class="ds-statcard__title">${s}</div>`:""}
          ${n?a`<div class="ds-statcard__icon${o?` ds-statcard__icon--${o}`:""}">${n}</div>`:""}
        </div>
      `:""}
      <div class="ds-statcard__value${"default"!==l?` ds-statcard__value--${l}`:""}">
        ${r}${c?a`<span class="ds-statcard__unit">${c}</span>`:""}
      </div>
      ${e&&i?a`
        <div class="ds-statcard__footer">
          <span class="ds-statcard__trend ds-statcard__trend--${e}">${i}</span>
        </div>
      `:""}
    </div>
  `,m=document.createDocumentFragment(),g=d(f,m);return{get element(){return m},destroy:function(){g.destroy()}}}import{html as a}from"@kupola/platform/template";import{render as d}from"@kupola/platform/render";export{t as Statcard};
