function t(t={}){function s(){n||(n=!0,p&&p.classList.add("is-dismissed"),a&&a())}const{title:o="",description:r="",type:d="normal",closable:i=!1,onClose:a=null}=t;let n=!1;const c=e`
    <div class="ds-alert ds-alert--${d}" role="alert">
      <div class="ds-alert__body">
        ${o?e`<div class="ds-alert__title">${o}</div>`:""}
        ${r?e`<div class="ds-alert__desc">${r}</div>`:""}
      </div>
      ${i?e`<button class="ds-alert__close" aria-label="Close">&times;</button>`:""}
    </div>
  `,m=document.createDocumentFragment(),u=l(c,m),p=m.querySelector(".ds-alert"),_=m.querySelector(".ds-alert__close");return _&&_.addEventListener("click",t=>{t.stopPropagation(),s()}),{get element(){return m},dismiss:s,destroy:function(){u.destroy()}}}import{html as e}from"@kupola/platform/template";import{render as l}from"@kupola/platform/render";export{t as Alert};
