function n(n={}){function t(n){w||(arguments.length>0&&(i=d(n)),a(),f=!1,e()||(p=setInterval(e,1e3)))}function a(){p&&(clearInterval(p),p=null)}function e(){if(w)return!0;const n=Date.now(),s=Math.max(0,i-n);let o=s;const t=Math.floor(o/864e5);o%=864e5;const e=Math.floor(o/36e5);o%=36e5;const d=Math.floor(o/6e4);if(o%=6e4,function(n,s,o,t){h&&(h.days&&(h.days.textContent=c(n)),h.hours&&(h.hours.textContent=c(s)),h.minutes&&(h.minutes.textContent=c(o)),h.seconds&&(h.seconds.textContent=c(t)))}(t,e,d,Math.floor(o/1e3)),_)try{_(s)}catch(n){return a(),r?r(n):"undefined"!=typeof console&&console.error,!0}return i-n<=0&&!f&&(f=!0,a(),l&&l(),!0)}function c(n){return n<10?"0"+n:String(n)}function d(n){let s;return s=n instanceof Date?n.getTime():"string"==typeof n?Date.parse(n):n,Number.isFinite(s)&&s>0?s:0}const u=n&&"object"==typeof n?n:{},l="function"==typeof u.onComplete?u.onComplete:"function"==typeof u.onFinish?u.onFinish:null,_="function"==typeof u.onTick?u.onTick:null,r="function"==typeof u.onError?u.onError:null;let p=null,i=d(u.target),f=!1,w=!1;const m=s`
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
  `,v=document.createDocumentFragment(),y=o(m,v),h={days:v.querySelector(".ds-countdown__days"),hours:v.querySelector(".ds-countdown__hours"),minutes:v.querySelector(".ds-countdown__minutes"),seconds:v.querySelector(".ds-countdown__seconds")};return i>0&&t(),{get element(){return v},start:t,stop:a,destroy:function(){w||(w=!0,a(),y.destroy())}}}import{html as s}from"@kupola/platform/template";import{render as o}from"@kupola/platform/render";export{n as Countdown};
