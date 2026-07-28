"use strict";var n=require("@kupola/platform/template"),s=require("@kupola/platform/render");exports.Countdown=function(t={}){function o(n){w||(arguments.length>0&&(p=d(n)),e(),f=!1,a()||(i=setInterval(a,1e3)))}function e(){i&&(clearInterval(i),i=null)}function a(){if(w)return!0;const n=Date.now(),s=Math.max(0,p-n);let t=s;const o=Math.floor(t/864e5);t%=864e5;const a=Math.floor(t/36e5);t%=36e5;const d=Math.floor(t/6e4);if(t%=6e4,function(n,s,t,o){h&&(h.days&&(h.days.textContent=c(n)),h.hours&&(h.hours.textContent=c(s)),h.minutes&&(h.minutes.textContent=c(t)),h.seconds&&(h.seconds.textContent=c(o)))}(o,a,d,Math.floor(t/1e3)),_)try{_(s)}catch(n){return e(),r?r(n):"undefined"!=typeof console&&console.error,!0}return p-n<=0&&!f&&(f=!0,e(),l&&l(),!0)}function c(n){return n<10?"0"+n:String(n)}function d(n){let s;return s=n instanceof Date?n.getTime():"string"==typeof n?Date.parse(n):n,Number.isFinite(s)&&s>0?s:0}const u=t&&"object"==typeof t?t:{},l="function"==typeof u.onComplete?u.onComplete:"function"==typeof u.onFinish?u.onFinish:null,_="function"==typeof u.onTick?u.onTick:null,r="function"==typeof u.onError?u.onError:null;let i=null,p=d(u.target),f=!1,w=!1;const v=n.html`
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
  `,m=document.createDocumentFragment(),y=s.render(v,m),h={days:m.querySelector(".ds-countdown__days"),hours:m.querySelector(".ds-countdown__hours"),minutes:m.querySelector(".ds-countdown__minutes"),seconds:m.querySelector(".ds-countdown__seconds")};return p>0&&o(),{get element(){return m},start:o,stop:e,destroy:function(){w||(w=!0,e(),y.destroy())}}};
