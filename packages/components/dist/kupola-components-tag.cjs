"use strict";var t=require("@kupola/platform/template"),e=require("@kupola/platform/render");exports.Tag=function(n={}){function o(){c||(c=!0,m&&(m.style.display="none"),l&&l())}const{text:s="",type:r="",closable:a=!1,onClose:l=null}=n;let c=!1;const u=function(){function t(){for(const t of e)t.target.removeEventListener(t.eventName,t.handler,t.options);e.clear()}const e=new Set;let n=!1;return{on:function(t,o,s,r){if(n||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(o,s,r);const a={target:t,eventName:o,handler:s,options:r};return e.add(a),()=>{e.delete(a)&&t.removeEventListener(o,s,r)}},clear:t,destroy:function(){n||(n=!0,t())}}}(),i=r?` ds-tag--${r}`:"",f=a?" ds-tag--closable":"",d=t.html`
    <span class="ds-tag${i}${f}">
      ${s}
      ${a?t.html`<button class="ds-tag__close" aria-label="Close">&times;</button>`:""}
    </span>
  `,p=document.createDocumentFragment(),g=e.render(d,p),m=p.querySelector(".ds-tag"),b=p.querySelector(".ds-tag__close");return b&&u.on(b,"click",t=>{t.stopPropagation(),o()}),{get element(){return p},dismiss:o,destroy:function(){u.destroy(),g.destroy()}}};
