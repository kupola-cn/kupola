function t(t={}){function s(){c||(c=!0,d&&(d.style.display="none"),r&&r())}const{text:l="",type:n="",closable:a=!1,onClose:r=null}=t;let c=!1;const m=o`
    <span class="ds-tag${n?` ds-tag--${n}`:""}${a?" ds-tag--closable":""}">
      ${l}
      ${a?o`<button class="ds-tag__close" aria-label="Close">&times;</button>`:""}
    </span>
  `,p=document.createDocumentFragment(),u=e(m,p),d=p.querySelector(".ds-tag"),i=p.querySelector(".ds-tag__close");return i&&i.addEventListener("click",t=>{t.stopPropagation(),s()}),{get element(){return p},dismiss:s,destroy:function(){u.destroy()}}}import{html as o}from"@kupola/platform/template";import{render as e}from"@kupola/platform/render";export{t as Tag};
