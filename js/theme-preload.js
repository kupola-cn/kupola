(function(){
  if(document.documentElement.hasAttribute("data-kupola-theme-preloaded"))return;
  var h=document.documentElement,
      t=localStorage.getItem("kupola-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
  h.setAttribute("data-theme",t);
  var d=t==="dark";
  h.style.backgroundColor=d?"#0C0C0D":"#FFFFFF";
  h.style.color=d?"#E5E7EB":"#0F1117";
  var s=document.createElement("style");
  s.textContent=d?"body,header,aside,footer{background:#1A1B1D;color:#E5E7EB}":"body,header,aside,footer{background:#F5F5F5;color:#0F1117}";
  document.head.appendChild(s);
  h.setAttribute("data-kupola-theme-preloaded","true")
})();