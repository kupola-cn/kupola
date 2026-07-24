function t(t={}){function u(t){d=t.target.value,f&&f(d)}function o(t){d=t.target.value,s&&s(d)}const{placeholder:l="",value:p="",type:i="text",status:r="",disabled:a=!1,name:c="",onInput:f=null,onChange:s=null}=t;let d=p;const m=n`
    <div class="ds-input${r?` ds-input--${r}`:""}">
      <input type="${i}" placeholder="${l}" />
    </div>
  `,g=document.createDocumentFragment(),h=e(m,g),$=g.querySelector("input");return $&&($.value=d,$.disabled=a,c&&($.name=c),$.addEventListener("input",u),$.addEventListener("change",o)),{get element(){return g},getValue:function(){return d},setValue:function(t){d=t,$&&($.value=d)},focus:function(){$&&$.focus()},destroy:function(){$&&($.removeEventListener("input",u),$.removeEventListener("change",o)),h.destroy()}}}import{html as n}from"@kupola/platform/template";import{render as e}from"@kupola/platform/render";export{t as Input};
