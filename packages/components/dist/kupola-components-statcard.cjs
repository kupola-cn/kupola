"use strict";var t=require("@kupola/platform/template"),a=require("@kupola/platform/render");exports.Statcard=function(s={}){const{title:d="",value:r="",unit:e="",trend:c="",trendValue:i="",icon:n="",iconType:l="",size:o="default",hoverLift:_=!1,compact:u=!1,gradient:v=!1}=s,$=["ds-statcard"];_&&$.push("ds-statcard--hover-lift"),u&&$.push("ds-statcard--compact"),v&&$.push("ds-statcard--gradient");const p=$.join(" "),f=t.html`
    <div class="${p}">
      ${d||n?t.html`
        <div class="ds-statcard__header">
          ${d?t.html`<div class="ds-statcard__title">${d}</div>`:""}
          ${n?t.html`<div class="ds-statcard__icon${l?` ds-statcard__icon--${l}`:""}">${n}</div>`:""}
        </div>
      `:""}
      <div class="ds-statcard__value${"default"!==o?` ds-statcard__value--${o}`:""}">
        ${r}${e?t.html`<span class="ds-statcard__unit">${e}</span>`:""}
      </div>
      ${c&&i?t.html`
        <div class="ds-statcard__footer">
          <span class="ds-statcard__trend ds-statcard__trend--${c}">${i}</span>
        </div>
      `:""}
    </div>
  `,m=document.createDocumentFragment(),g=a.render(f,m);return{get element(){return m},destroy:function(){g.destroy()}}};
