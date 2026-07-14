(function(){
  if(document.documentElement.hasAttribute("data-kupola-theme-preloaded"))return;
  var h=document.documentElement,
      t=localStorage.getItem("kupola-theme")||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
  h.setAttribute("data-theme",t);
  h.setAttribute("data-kupola-theme-preloaded","true")
})();