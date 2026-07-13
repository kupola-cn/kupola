import { getSecurityConfig } from './kupola-config.js';

export function sanitizeHtml(html, options = {}) {
  const securityConfig = getSecurityConfig();
  const sanitizeConfig = securityConfig?.sanitizeHtml || {};
  
  if (!sanitizeConfig.enabled && !options.force) {
    return html;
  }
  
  const allowedTags = options.allowedTags || sanitizeConfig.allowedTags || [];
  const allowedAttributes = options.allowedAttributes || sanitizeConfig.allowedAttributes || {};
  
  if (typeof html !== 'string') {
    return html;
  }
  
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');
  const elements = doc.body.querySelectorAll('*');
  
  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    
    if (!allowedTags.includes(tagName)) {
      element.remove();
      return;
    }
    
    Array.from(element.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      const tagAllowedAttrs = allowedAttributes[tagName] || [];
      
      if (!tagAllowedAttrs.includes(attrName)) {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  return doc.body.innerHTML;
}

export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function stripHtml(html) {
  if (typeof html !== 'string') {
    return html;
  }
  
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

export function maskData(value, type, options = {}) {
  const securityConfig = getSecurityConfig();
  const maskConfig = securityConfig?.maskData || {};
  
  if (!maskConfig.enabled && !options.force) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return value;
  }
  
  const patterns = options.patterns || maskConfig.patterns || {};
  const pattern = patterns[type];
  
  if (!pattern) {
    return value;
  }
  
  const regex = typeof pattern.regex === 'string' 
    ? new RegExp(pattern.regex) 
    : pattern.regex;
  
  return String(value).replace(regex, pattern.replace);
}

export function generateSecureId(length, prefix) {
  const securityConfig = getSecurityConfig();
  const secureIdConfig = securityConfig?.secureId || {};
  
  const idLength = length || secureIdConfig.length || 16;
  const charset = secureIdConfig.charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    let result = '';
    for (let i = 0; i < idLength; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return prefix ? `${prefix}_${result}` : result;
  }
  
  const array = new Uint32Array(idLength);
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < idLength; i++) {
    result += charset[array[i] % charset.length];
  }
  
  return prefix ? `${prefix}_${result}` : result;
}