"use strict";var e=require("@kupola/platform/template"),s=require("@kupola/platform/render");exports.Spin=function(t={}){const{text:r="",size:n="default"}=t,a="default"!==n?` ds-spin--${n}`:"",d=e.html`
    <div class="ds-spin${a}">
      <div class="ds-spin__loader"></div>
      ${r?e.html`<span class="ds-spin__text">${r}</span>`:""}
    </div>
  `,i=document.createDocumentFragment(),l=s.render(d,i);return{get element(){return i},destroy:function(){l.destroy()}}};
