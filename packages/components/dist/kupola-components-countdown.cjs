"use strict";var s=require("@kupola/platform/template"),n=require("@kupola/platform/render");exports.Countdown=function(o={}){function t(s){s&&(_=s),a(),r=!1,d(),l=setInterval(d,1e3)}function a(){l&&(clearInterval(l),l=null)}function d(){const s=Date.now();let n=Math.max(0,_-s);const o=Math.floor(n/864e5);n%=864e5;const t=Math.floor(n/36e5);n%=36e5;const d=Math.floor(n/6e4);n%=6e4,function(s,n,o,t){v&&(v.days&&(v.days.textContent=c(s)),v.hours&&(v.hours.textContent=c(n)),v.minutes&&(v.minutes.textContent=c(o)),v.seconds&&(v.seconds.textContent=c(t)))}(o,t,d,Math.floor(n/1e3)),_-s<=0&&!r&&(r=!0,a(),u&&u())}function c(s){return s<10?"0"+s:String(s)}const{target:e=0,onComplete:u=null}=o;let l=null,_=e,r=!1;const p=s.html`
    <div class="ds-countdown">
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__days">00</span>
        <span class="ds-countdown__label">Days</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__hours">00</span>
        <span class="ds-countdown__label">Hrs</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__minutes">00</span>
        <span class="ds-countdown__label">Min</span>
      </div>
      <span class="ds-countdown__separator">:</span>
      <div class="ds-countdown__item">
        <span class="ds-countdown__value ds-countdown__seconds">00</span>
        <span class="ds-countdown__label">Sec</span>
      </div>
    </div>
  `,i=document.createDocumentFragment(),w=n.render(p,i),v={days:i.querySelector(".ds-countdown__days"),hours:i.querySelector(".ds-countdown__hours"),minutes:i.querySelector(".ds-countdown__minutes"),seconds:i.querySelector(".ds-countdown__seconds")};return _>0&&t(),{get element(){return i},start:t,stop:a,destroy:function(){a(),w.destroy()}}};
