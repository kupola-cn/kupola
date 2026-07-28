function t(t={}){function e(){c||(c=!0,d&&(d.style.display="none"),a&&a())}const{text:s="",type:r="",closable:l=!1,onClose:a=null}=t;let c=!1;const u=function(){function t(){for(const t of n)t.target.removeEventListener(t.eventName,t.handler,t.options);n.clear()}const n=new Set;let o=!1;return{on:function(t,e,s,r){if(o||!t||"function"!=typeof t.addEventListener)return()=>{};t.addEventListener(e,s,r);const l={target:t,eventName:e,handler:s,options:r};return n.add(l),()=>{n.delete(l)&&t.removeEventListener(e,s,r)}},clear:t,destroy:function(){o||(o=!0,t())}}}(),i=n`
    <span class="ds-tag${r?` ds-tag--${r}`:""}${l?" ds-tag--closable":""}">
      ${s}
      ${l?n`<button class="ds-tag__close" aria-label="Close">&times;</button>`:""}
    </span>
  `,f=document.createDocumentFragment(),p=o(i,f),d=f.querySelector(".ds-tag"),m=f.querySelector(".ds-tag__close");return m&&u.on(m,"click",t=>{t.stopPropagation(),e()}),{get element(){return f},dismiss:e,destroy:function(){u.destroy(),p.destroy()}}}import{html as n}from"@kupola/platform/template";import{render as o}from"@kupola/platform/render";export{t as Tag};
