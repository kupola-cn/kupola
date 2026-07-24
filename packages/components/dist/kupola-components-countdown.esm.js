function n(n={}){function t(n){n&&(_=n),a(),p=!1,d(),l=setInterval(d,1e3)}function a(){l&&(clearInterval(l),l=null)}function d(){const n=Date.now();let s=Math.max(0,_-n);const o=Math.floor(s/864e5);s%=864e5;const t=Math.floor(s/36e5);s%=36e5;const d=Math.floor(s/6e4);s%=6e4,function(n,s,o,t){m&&(m.days&&(m.days.textContent=c(n)),m.hours&&(m.hours.textContent=c(s)),m.minutes&&(m.minutes.textContent=c(o)),m.seconds&&(m.seconds.textContent=c(t)))}(o,t,d,Math.floor(s/1e3)),_-n<=0&&!p&&(p=!0,a(),u&&u())}function c(n){return n<10?"0"+n:String(n)}const{target:e=0,onComplete:u=null}=n;let l=null,_=e,p=!1;const r=s`
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
  `,i=document.createDocumentFragment(),w=o(r,i),m={days:i.querySelector(".ds-countdown__days"),hours:i.querySelector(".ds-countdown__hours"),minutes:i.querySelector(".ds-countdown__minutes"),seconds:i.querySelector(".ds-countdown__seconds")};return _>0&&t(),{get element(){return i},start:t,stop:a,destroy:function(){a(),w.destroy()}}}import{html as s}from"@kupola/platform/template";import{render as o}from"@kupola/platform/render";export{n as Countdown};
