class KupolaSecurity {
  constructor() {
    this.csrfToken = null;
    this.cspEnabled = false;
  }

  init() {
    this._initCSRF();
    this._initCSP();
  }

  _initCSRF() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this.csrfToken = metaTag.getAttribute('content');
    }
  }

  _initCSP() {
    const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaTag) {
      this.cspEnabled = true;
    }
  }

  getCSRFToken() {
    return this.csrfToken;
  }

  setCSRFToken(token) {
    this.csrfToken = token;
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', token);
    }
  }

  addCSRFHeader(config) {
    if (this.csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = this.csrfToken;
    }
    return config;
  }

  escapeHtml(str) {
    if (!str || typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  sanitize(html) {
    if (!html || typeof html !== 'string') return html;

    const allowedTags = [
      'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
      'a', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'img', 'video', 'audio', 'iframe'
    ];

    const allowedAttributes = [
      'href', 'src', 'alt', 'title', 'class', 'id', 'data-*',
      'width', 'height', 'frameborder', 'allowfullscreen'
    ];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (!allowedTags.includes(tagName)) {
          node.parentNode.replaceChild(document.createTextNode(node.textContent), node);
          return;
        }

        Array.from(node.attributes).forEach(attr => {
          const attrName = attr.name.toLowerCase();
          const isAllowed = allowedAttributes.includes(attrName) || 
                           attrName.startsWith('data-');
          
          if (!isAllowed) {
            node.removeAttribute(attr.name);
          } else if (attrName === 'href' || attrName === 'src') {
            if (!this._isSafeUrl(attr.value)) {
              node.removeAttribute(attr.name);
            }
          }
        });
      }

      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        walk(node.childNodes[i]);
      }
    };

    walk(tempDiv);
    return tempDiv.innerHTML;
  }

  _isSafeUrl(url) {
    try {
      const parsed = new URL(url);
      const safeProtocols = ['http:', 'https:', 'data:', 'mailto:', 'tel:'];
      return safeProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]{7,20}$/;
    return re.test(phone.replace(/\s/g, ''));
  }

  generateSecureHash(str) {
    if (!str || typeof str !== 'string') return '';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  isXSSAttack(str) {
    if (!str || typeof str !== 'string') return false;
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<img[^>]*onerror[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload[^>]*=/gi,
      /onclick[^>]*=/gi,
      /onmouseover[^>]*=/gi,
      /<iframe[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  }

  protectForm(form) {
    if (!(form instanceof HTMLFormElement)) return;

    form.addEventListener('submit', (e) => {
      const inputs = form.querySelectorAll('input, textarea');
      let hasXSS = false;

      inputs.forEach(input => {
        if (this.isXSSAttack(input.value)) {
          hasXSS = true;
          input.classList.add('ds-input--error');
        } else {
          input.classList.remove('ds-input--error');
        }
      });

      if (hasXSS) {
        e.preventDefault();
        console.error('[KupolaSecurity] XSS attack detected in form');
      }
    });
  }
}

const kupolaSecurity = new KupolaSecurity();
window.kupolaSecurity = kupolaSecurity;
window.KupolaSecurity = KupolaSecurity;

export default KupolaSecurity;