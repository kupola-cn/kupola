class SlideCaptcha {
  constructor(container) {
    this.container = container;
    this.track = container.querySelector('.ds-slider-captcha__track');
    this.btn = container.querySelector('.ds-slider-captcha__btn');
    this.text = container.querySelector('.ds-slider-captcha__text');
    this.progress = container.querySelector('.ds-slider-captcha__progress');
    this.statusEl = container.querySelector('.ds-slider-captcha__status');
    this.refreshBtn = container.querySelector('.ds-slider-captcha__refresh');
    this.footerRefreshBtn = container.querySelector('.ds-slider-captcha__footer-refresh');
    
    this.config = {
      tolerance: 6,
      minPoints: 20,
      minDuration: 300,
      maxDuration: 10000,
      minSpeedDelta: 0.3,
      maxAttempts: 5
    };
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.trackData = [];
    this.startTime = 0;
    this.isVerified = false;
    this.isProcessing = false;
    this.attempts = 0;
    
    this.targetX = 0;
    this.distractorX = 0;
    this.angle = 0;
    this.distractorAngle = 0;
    this.maxAngle = parseInt(container.getAttribute('data-angle')) || 30;
    this.shape = container.getAttribute('data-shape') || 'circle';
    this.hasDistractor = this.shape !== 'circle';
    
    this.scope = `slidecaptcha-${Math.random().toString(36).substr(2, 9)}`;
    
    this._mouseDownHandler = null;
    this._mouseMoveHandler = null;
    this._mouseUpHandler = null;
    this._touchStartHandler = null;
    this._touchMoveHandler = null;
    this._touchEndHandler = null;
    
    this._mouseMoveListener = null;
    this._mouseUpListener = null;
    this._touchMoveListener = null;
    this._touchEndListener = null;
  }

  init() {
    if (!this.track || !this.btn) return;
    if (this.container._initialized) return;

    this._mouseDownHandler = (e) => {
      if (this.isVerified || this.isProcessing) return;
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startTime = Date.now();
      this.trackData = [];
      this.container.classList.add('is-active');
      if (this.text) {
        this.text.textContent = '拖动中...';
        this.text.style.color = 'var(--status-info-default)';
      }
    };

    this._mouseMoveHandler = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const trackWidth = this.track.offsetWidth;
      const btnWidth = this.btn.offsetWidth;
      const maxOffset = trackWidth - btnWidth - 8;

      let deltaX = e.clientX - this.startX;
      if (deltaX < 0) deltaX = 0;
      if (deltaX > maxOffset) deltaX = maxOffset;

      this.currentX = deltaX;
      this.btn.style.left = (14 + deltaX) + 'px';
      if (this.progress) this.progress.style.width = ((deltaX / maxOffset) * 100) + '%';

      this.collectTrack(e.clientX, e.clientY);
    };

    this._mouseUpHandler = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('is-active');
      this.verifyCaptcha();
    };

    this._touchStartHandler = (e) => {
      if (this.isVerified || this.isProcessing) return;
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.startTime = Date.now();
      this.trackData = [];
      this.container.classList.add('is-active');
      if (this.text) {
        this.text.textContent = '拖动中...';
        this.text.style.color = 'var(--status-info-default)';
      }
    };

    this._touchMoveHandler = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const trackWidth = this.track.offsetWidth;
      const btnWidth = this.btn.offsetWidth;
      const maxOffset = trackWidth - btnWidth - 8;

      let deltaX = e.touches[0].clientX - this.startX;
      if (deltaX < 0) deltaX = 0;
      if (deltaX > maxOffset) deltaX = maxOffset;

      this.currentX = deltaX;
      this.btn.style.left = (14 + deltaX) + 'px';
      if (this.progress) this.progress.style.width = ((deltaX / maxOffset) * 100) + '%';

      this.collectTrack(e.touches[0].clientX, e.touches[0].clientY);
    };

    this._touchEndHandler = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('is-active');
      this.verifyCaptcha();
    };

    this.btn.addEventListener('mousedown', this._mouseDownHandler);

    if (window.globalEvents) {
      this._mouseMoveListener = window.globalEvents.on(document, 'mousemove', this._mouseMoveHandler, { scope: this.scope });
      this._mouseUpListener = window.globalEvents.on(document, 'mouseup', this._mouseUpHandler, { scope: this.scope });
      this._touchMoveListener = window.globalEvents.on(document, 'touchmove', this._touchMoveHandler, { scope: this.scope, passive: false });
      this._touchEndListener = window.globalEvents.on(document, 'touchend', this._touchEndHandler, { scope: this.scope });
    } else {
      document.addEventListener('mousemove', this._mouseMoveHandler);
      document.addEventListener('mouseup', this._mouseUpHandler);
      document.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
      document.addEventListener('touchend', this._touchEndHandler);
    }

    this.btn.addEventListener('touchstart', this._touchStartHandler, { passive: false });

    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.loadCaptcha());
    }
    if (this.footerRefreshBtn) {
      this.footerRefreshBtn.addEventListener('click', () => this.loadCaptcha());
    }

    this.container._initialized = true;
    this.loadCaptcha();
  }

  generateTarget() {
    const trackWidth = this.track.offsetWidth;
    const btnWidth = this.btn.offsetWidth;
    const btnOffset = 14;
    const min = trackWidth * 0.35;
    const max = trackWidth * 0.85 - btnWidth;
    const mid = trackWidth * 0.6;

    this.angle = Math.floor(Math.random() * (this.maxAngle + 1));

    if (this.hasDistractor) {
      do {
        this.distractorAngle = Math.floor(Math.random() * (this.maxAngle + 1));
      } while (Math.abs(this.distractorAngle - this.angle) < 5);
    }

    if (this.hasDistractor) {
      const rand = Math.random();
      if (rand > 0.5) {
        this.targetX = Math.floor(min + Math.random() * (mid - min - btnWidth));
        this.distractorX = Math.floor(mid + Math.random() * (max - mid));
      } else {
        this.targetX = Math.floor(mid + Math.random() * (max - mid));
        this.distractorX = Math.floor(min + Math.random() * (mid - min - btnWidth));
      }
    } else {
      this.targetX = Math.floor(min + Math.random() * (max - min));
    }

    const target = this.container.querySelector('.ds-slider-captcha__target');
    if (target) {
      target.style.left = (this.targetX + btnOffset + btnWidth / 2) + 'px';
      target.style.transform = 'translate(-50%, -50%) rotate(' + this.angle + 'deg)';
      target.style.display = 'block';
    }

    if (this.hasDistractor) {
      const distractor = this.container.querySelector('.ds-slider-captcha__target--distractor');
      if (distractor) {
        distractor.style.left = (this.distractorX + btnOffset + btnWidth / 2) + 'px';
        distractor.style.transform = 'translate(-50%, -50%) rotate(' + this.distractorAngle + 'deg)';
        distractor.style.display = 'block';
      }
    } else {
      const distractor = this.container.querySelector('.ds-slider-captcha__target--distractor');
      if (distractor) {
        distractor.style.display = 'none';
      }
    }
  }

  resetSlider() {
    this.btn.className = 'ds-slider-captcha__btn';
    this.btn.style.transform = 'rotate(' + this.angle + 'deg)';
    this.btn.innerHTML = '';
    this.btn.style.left = '14px';
    this.btn.style.display = 'block';
    if (this.progress) {
      this.progress.style.width = '0%';
      this.progress.style.display = 'block';
    }
    if (this.text) {
      this.text.textContent = '按住滑块，拖动到缺口位置';
      this.text.style.color = '';
    }
    if (this.refreshBtn) {
      this.refreshBtn.style.display = 'none';
    }
    this.currentX = 0;
    this.trackData = [];
    this.container.classList.remove('is-verified', 'is-error', 'is-disabled');
  }

  loadCaptcha() {
    this.isVerified = false;
    this.isProcessing = false;
    this.attempts = 0;
    this.generateTarget();
    this.resetSlider();
    if (this.statusEl) {
      this.statusEl.textContent = '请完成验证';
      this.statusEl.className = 'ds-slider-captcha__status';
    }
  }

  collectTrack(clientX, clientY) {
    const now = Date.now();
    const t = now - this.startTime;

    let velocity = 0;
    let acceleration = 0;

    if (this.trackData.length > 0) {
      const last = this.trackData[this.trackData.length - 1];
      const dx = this.currentX - last.x;
      const dt = t - last.t;
      if (dt > 0) {
        velocity = dx / dt;
        if (this.trackData.length > 1) {
          const prev = this.trackData[this.trackData.length - 2];
          const prevDt = last.t - prev.t;
          if (prevDt > 0) {
            const prevV = (last.x - prev.x) / prevDt;
            acceleration = velocity - prevV;
          }
        }
      }
    }

    this.trackData.push({
      x: this.currentX,
      y: clientY - this.startY,
      t: t,
      v: velocity,
      a: acceleration
    });

    const pointCountEl = this.container.querySelector('.ds-slider-captcha__point-count');
    if (pointCountEl) {
      pointCountEl.textContent = '轨迹点: ' + this.trackData.length;
    }
  }

  validateTrack() {
    if (!this.trackData || this.trackData.length < this.config.minPoints) {
      return { passed: false, msg: '验证失败' };
    }

    const finalX = this.trackData[this.trackData.length - 1].x;
    const distractorDiff = this.hasDistractor ? Math.abs(finalX - this.distractorX) : Infinity;
    const targetDiff = Math.abs(finalX - this.targetX);

    if (this.hasDistractor && distractorDiff < targetDiff && distractorDiff <= this.config.tolerance) {
      return { passed: false, msg: '验证失败' };
    }

    if (targetDiff > this.config.tolerance) {
      return { passed: false, msg: '验证失败' };
    }

    const speeds = [];
    for (let i = 1; i < this.trackData.length; i++) {
      const dx = this.trackData[i].x - this.trackData[i - 1].x;
      const dt = this.trackData[i].t - this.trackData[i - 1].t;
      if (dt > 0 && dt < 500) {
        speeds.push(dx / dt);
      }
    }

    if (speeds.length < 3) {
      return { passed: false, msg: '验证失败' };
    }

    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    if (maxSpeed - minSpeed < this.config.minSpeedDelta) {
      return { passed: false, msg: '验证失败' };
    }

    let hasYMovement = false;
    for (const p of this.trackData) {
      if (Math.abs(p.y) > 2) {
        hasYMovement = true;
        break;
      }
    }
    if (!hasYMovement && this.trackData.length > 20) {
      return { passed: false, msg: '验证失败' };
    }

    const totalTime = this.trackData[this.trackData.length - 1].t;
    if (totalTime < this.config.minDuration) {
      return { passed: false, msg: '验证失败' };
    }
    if (totalTime > this.config.maxDuration) {
      return { passed: false, msg: '验证失败' };
    }

    const accelerations = [];
    for (let i = 1; i < speeds.length; i++) {
      accelerations.push(Math.abs(speeds[i] - speeds[i - 1]));
    }
    if (accelerations.length > 2) {
      const accAvg = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
      if (accAvg < 0.05) {
        return { passed: false, msg: '验证失败' };
      }
    }

    return { passed: true, msg: '验证通过' };
  }

  verifyCaptcha() {
    if (this.isProcessing || this.isVerified) return;
    this.isProcessing = true;

    if (this.statusEl) {
      this.statusEl.textContent = '验证中...';
      this.statusEl.className = 'ds-slider-captcha__status is-loading';
    }
    this.btn.style.cursor = 'wait';
    this.container.classList.add('is-disabled');

    setTimeout(() => {
      const result = this.validateTrack();
      this.isProcessing = false;
      this.btn.style.cursor = '';

      if (result.passed) {
        this.isVerified = true;
        this.btn.style.display = 'none';
        if (this.progress) this.progress.style.display = 'none';
        
        const target = this.container.querySelector('.ds-slider-captcha__target');
        if (target) target.style.display = 'none';
        
        const distractor = this.container.querySelector('.ds-slider-captcha__target--distractor');
        if (distractor) distractor.style.display = 'none';

        if (this.text) {
          this.text.textContent = '验证通过';
          this.text.style.color = 'var(--status-success-default)';
        }
        if (this.statusEl) {
          this.statusEl.textContent = '验证成功';
          this.statusEl.className = 'ds-slider-captcha__status is-success';
        }
        this.container.classList.add('is-verified');
        this.container.classList.remove('is-disabled');

        const onVerified = this.container.getAttribute('data-on-verified');
        if (onVerified && typeof window[onVerified] === 'function') {
          window[onVerified](this.container);
        }
      } else {
        this.attempts++;

        if (this.text) {
          this.text.textContent = result.msg;
          this.text.style.color = 'var(--status-error-default)';
        }
        if (this.statusEl) {
          this.statusEl.textContent = result.msg;
          this.statusEl.className = 'ds-slider-captcha__status is-error';
        }

        const errRefresh = this.container.getAttribute('data-err-refresh');
        if (errRefresh === 'auto') {
          setTimeout(() => {
            this.loadCaptcha();
          }, 1200);
        } else {
          this.btn.style.display = 'none';
          if (this.progress) this.progress.style.display = 'none';
          
          const target = this.container.querySelector('.ds-slider-captcha__target');
          if (target) target.style.display = 'none';
          
          const distractor = this.container.querySelector('.ds-slider-captcha__target--distractor');
          if (distractor) distractor.style.display = 'none';

          if (this.refreshBtn) {
            this.refreshBtn.style.display = 'block';
          }
        }
      }
    }, 300);
  }

  destroy() {
    if (!this.container._initialized) return;

    if (this.btn && this._mouseDownHandler) {
      this.btn.removeEventListener('mousedown', this._mouseDownHandler);
    }
    if (this.btn && this._touchStartHandler) {
      this.btn.removeEventListener('touchstart', this._touchStartHandler);
    }

    if (this.refreshBtn) {
      this.refreshBtn.removeEventListener('click', () => this.loadCaptcha());
    }
    if (this.footerRefreshBtn) {
      this.footerRefreshBtn.removeEventListener('click', () => this.loadCaptcha());
    }

    if (this._mouseMoveListener && this._mouseMoveListener.unsubscribe) {
      this._mouseMoveListener.unsubscribe();
    } else if (this._mouseMoveHandler) {
      document.removeEventListener('mousemove', this._mouseMoveHandler);
    }

    if (this._mouseUpListener && this._mouseUpListener.unsubscribe) {
      this._mouseUpListener.unsubscribe();
    } else if (this._mouseUpHandler) {
      document.removeEventListener('mouseup', this._mouseUpHandler);
    }

    if (this._touchMoveListener && this._touchMoveListener.unsubscribe) {
      this._touchMoveListener.unsubscribe();
    } else if (this._touchMoveHandler) {
      document.removeEventListener('touchmove', this._touchMoveHandler);
    }

    if (this._touchEndListener && this._touchEndListener.unsubscribe) {
      this._touchEndListener.unsubscribe();
    } else if (this._touchEndHandler) {
      document.removeEventListener('touchend', this._touchEndHandler);
    }

    this.container._initialized = false;
  }
}

function initSlideCaptchas() {
  document.querySelectorAll('.ds-slider-captcha').forEach(container => {
    const captcha = new SlideCaptcha(container);
    captcha.init();
    container._kupolaSlideCaptcha = captcha;
  });
}

function cleanupSlideCaptcha(container) {
  if (container._kupolaSlideCaptcha) {
    container._kupolaSlideCaptcha.destroy();
    container._kupolaSlideCaptcha = null;
  }
}

function cleanupAllSlideCaptchas() {
  document.querySelectorAll('.ds-slider-captcha').forEach(container => {
    cleanupSlideCaptcha(container);
  });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSlideCaptchas, cleanupSlideCaptcha, cleanupAllSlideCaptchas };
}