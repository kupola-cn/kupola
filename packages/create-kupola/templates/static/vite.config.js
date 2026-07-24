import { defineConfig } from 'vite';
import { kupola } from '@kupola/platform/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    kupola({
      autoCSS: false,
      themePreload: true,
    }),
  ],
  resolve: {
    alias: [
      { find: /^kupola$/, replacement: '@kupola/platform' },
      { find: /^kupola\/core$/, replacement: '@kupola/core' },
      { find: /^kupola\/components$/, replacement: '@kupola/components' },
      { find: /^kupola\/components\/(.*)$/, replacement: '@kupola/components/$1' },
    ],
  },
  assetsInclude: [ '**/*.svg', '**/*.png', '**/*.jpg' ],
});
