import { defineConfig } from 'vite';
import { kupola } from '@kupola/kupola/vite';
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
      { find: /^kupola$/, replacement: '@kupola/kupola' },
      { find: /^kupola\/core$/, replacement: '@kupola/kupola/core' },
      { find: /^kupola\/components$/, replacement: '@kupola/kupola/components' },
      { find: /^kupola\/components\/(.*)$/, replacement: '@kupola/kupola/components/$1' },
      { find: /^kupola\/icons$/, replacement: '@kupola/kupola/icons' },
      { find: /^kupola\/kupola\.css$/, replacement: '@kupola/kupola/dist/css/kupola.css' },
    ],
  },
  assetsInclude: [ '**/*.svg', '**/*.png', '**/*.jpg' ],
});
