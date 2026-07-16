'use client';

import { useEffect } from 'react';
import { walk } from '@kupola/kupola/directives';

/**
 * KupolaApp — Client component that initializes Kupola directives.
 *
 * Kupola's k-* directives run client-side. This wrapper ensures
 * they are initialized after React hydration.
 */
export default function KupolaApp() {
  useEffect(() => {
    walk(document.body);
  }, []);

  return (
    <>
      {/* Counter example */}
      <section className="section" dangerouslySetInnerHTML={{ __html: `
        <h2>Counter</h2>
        <div k-data="{ count: 0 }">
          <p>Count: <strong k-text="count"></strong></p>
          <button class="btn btn-primary" k-on:click="count++">+1</button>
          <button class="btn" k-on:click="count--">-1</button>
          <button class="btn" k-on:click="count = 0">Reset</button>
        </div>
      `}} />

      {/* Theme toggle */}
      <button
        className="btn"
        style={{ position: 'fixed', top: 16, right: 16 }}
        onClick={() => {
          const html = document.documentElement;
          const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
          html.dataset.theme = next;
          localStorage.setItem('kupola-theme', next);
        }}
      >
        Toggle Theme
      </button>
    </>
  );
}
