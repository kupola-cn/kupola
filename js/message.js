const Message = {
    normal: function(message, options = {}) {
        this.show(message, 'normal', options);
    },
    success: function(message, options = {}) {
        this.show(message, 'success', options);
    },
    error: function(message, options = {}) {
        this.show(message, 'error', options);
    },
    warning: function(message, options = {}) {
        this.show(message, 'warning', options);
    },
    info: function(message, options = {}) {
        this.show(message, 'info', options);
    },
    show: function(message, type = 'normal', options = {}) {
        const { duration = 3000 } = options;
        
        const msg = document.createElement('div');
        msg.className = `ds-message__item ds-message__item--${type}`;
        
        const icons = {
            normal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        
        msg.innerHTML = `
            <div class="ds-message__icon ds-message__icon--${type}">${icons[type]}</div>
            <div class="ds-message__content"></div>
        `;
        msg.querySelector('.ds-message__content').textContent = message;
        
        let container = document.querySelector('.ds-message');
        if (!container) {
            container = document.createElement('div');
            container.className = 'ds-message';
            document.body.appendChild(container);
        }
        
        container.appendChild(msg);
        
        setTimeout(() => {
            msg.classList.add('is-visible');
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                msg.classList.remove('is-visible');
                msg.classList.add('is-exiting');
                setTimeout(() => msg.remove(), 300);
            }, duration);
        }
    }
};

function initMessages() {}

export { Message, initMessages };