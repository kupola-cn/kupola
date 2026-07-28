function r(r={}){function t(){f&&(f.style.width=c+"%",f.classList.remove("is-error","is-warning","is-success"),"error"===u?f.classList.add("is-error"):"warning"===u?f.classList.add("is-warning"):"success"===u&&f.classList.add("is-success"))}const{percent:n=0,status:o="",size:i="default",indeterminate:a=!1}=r;let c=Math.min(100,Math.max(0,n)),u=o;const d=s`
    <div class="ds-progress${"sm"===i?" ds-progress--sm":""}${a?" ds-progress--indeterminate":""}">
      <div class="ds-progress__bar"></div>
    </div>
  `,p=document.createDocumentFragment(),m=e(d,p),f=p.querySelector(".ds-progress__bar");return t(),{get element(){return p},setPercent:function(r){c=Math.min(100,Math.max(0,r)),t()},getPercent:function(){return c},setStatus:function(r){u=r,t()},destroy:function(){m.destroy()}}}import{html as s}from"@kupola/platform/template";import{render as e}from"@kupola/platform/render";export{r as Progress};
