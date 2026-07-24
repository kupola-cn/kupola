/**
 * {{PROJECT_NAME}} — Main entry point (TypeScript).
 *
 * Initializes the Kupola directive system and sets up interactive features.
 */

import { $, walk } from '@kupola/core/directives';

// ── Initialize directives ────────────────────────────────────────────────────
walk(document.body);

// ── Theme toggle (with localStorage persistence) ─────────────────────────────
const themeBtn = $('#theme-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('kupola-theme', next);
  });
}

console.log('🚀 {{PROJECT_NAME}} ready!');
