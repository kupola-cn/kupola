const Notification = {
    normal: function(options) {
        this.show({ ...options, type: 'normal' });
    },
    success: function(options) {
        this.show({ ...options, type: 'success' });
    },
    error: function(options) {
        this.show({ ...options, type: 'error' });
    },
    warning: function(options) {
        this.show({ ...options, type: 'warning' });
    },
    info: function(options) {
        this.show({ ...options, type: 'info' });
    },
    show: function(options) {
        const { title, message, type = 'normal', duration = 4000 } = options;
        
        const notification = document.createElement('div');
        notification.className = `ds-notification__item ds-notification__item--${type}`;
        
        const icons = {
            normal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        
        notification.innerHTML = `
            <div class="ds-notification__icon ds-notification__icon--${type}">${icons[type]}</div>
            <div class="ds-notification__content">
                ${title ? '<div class="ds-notification__title"></div>' : ''}
                ${message ? '<div class="ds-notification__message"></div>' : ''}
            </div>
            <button class="ds-notification__close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
        if (title) notification.querySelector('.ds-notification__title').textContent = title;
        if (message) notification.querySelector('.ds-notification__message').textContent = message;
        
        let container = document.querySelector('.ds-notification');
        if (!container) {
            container = document.createElement('div');
            container.className = 'ds-notification';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('is-visible');
        }, 10);
        
        notification.querySelector('.ds-notification__close').addEventListener('click', () => {
            notification.classList.remove('is-visible');
            notification.classList.add('is-exiting');
            setTimeout(() => notification.remove(), 300);
        });
        
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('is-visible');
                notification.classList.add('is-exiting');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }
};

function initNotifications() {}