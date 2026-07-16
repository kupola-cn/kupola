/**
 * {{PROJECT_NAME}} — Main entry point (TypeScript).
 *
 * Initializes the Kupola directive system and sets up interactive features.
 */

import { walk } from '@kupola/kupola/directives';

// ── Initialize directives ────────────────────────────────────────────────────
walk(document.body);

// ── Theme toggle ─────────────────────────────────────────────────────────────
const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  });
}

console.log('🚀 {{PROJECT_NAME}} ready!');
