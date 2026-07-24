function t(t={}){const{text:n="",size:o="default"}=t,r=e`
    <div class="ds-spin${"default"!==o?` ds-spin--${o}`:""}">
      <div class="ds-spin__loader"></div>
      ${n?e`<span class="ds-spin__text">${n}</span>`:""}
    </div>
  `,d=document.createDocumentFragment(),p=s(r,d);return{get element(){return d},destroy:function(){p.destroy()}}}import{html as e}from"@kupola/platform/template";import{render as s}from"@kupola/platform/render";export{t as Spin};
