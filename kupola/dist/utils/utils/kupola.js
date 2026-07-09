export function button(label, variant = 'brand', size = 'md') {
    return `<button class="ds-btn ds-btn--${variant} ds-btn--${size}">${label}</button>`;
}

export function input(label, name, placeholder, validate = '') {
    const validateAttr = validate ? ` data-validate="${validate}"` : '';
    return `
<div class="ds-form-item">
    <label class="ds-form-item__label">${label}</label>
    <input type="text" class="ds-input" name="${name}" placeholder="${placeholder}"${validateAttr}>
</div>`;
}

export function card(title, body, footer = '') {
    const footerHtml = footer ? `<div class="ds-card__footer">${footer}</div>` : '';
    return `
<div class="ds-card">
    <div class="ds-card__header">
        <h3 class="ds-card__title">${title}</h3>
    </div>
    <div class="ds-card__body">${body}</div>
    ${footerHtml}
</div>`;
}

export function statCard(title, value, trend = '', trendType = 'up') {
    const trendHtml = trend ? 
        `<span class="ds-stat-card__trend ${trendType === 'down' ? 'ds-stat-card__trend--down' : 'ds-stat-card__trend--up'}">${trend}</span>` : '';
    return `
<div class="ds-stat-card">
    <div class="ds-stat-card__title">${title}</div>
    <div class="ds-stat-card__value">${value}</div>
    ${trendHtml}
</div>`;
}

export function badge(text, variant = 'default') {
    return `<span class="ds-badge ds-badge--${variant}">${text}</span>`;
}

export function avatar(initials, size = 'md', variant = 'default') {
    return `<div class="ds-avatar ds-avatar--${size} ds-avatar--${variant}">${initials}</div>`;
}

export function themeScript(theme = 'dark', brand = 'zengqing') {
    return `
<script>
    if (typeof setTheme === 'function') setTheme('${theme}');
    if (typeof setBrand === 'function') setBrand('${brand}');
</script>`;
}

export function dataBind(key, bindType) {
    return `data-bind="${key}:${bindType}"`;
}

export function dataComponent(name) {
    return `data-component="${name}"`;
}

export function dataValidate(rules) {
    return `data-validate="${rules}"`;
}