import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Kupola',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'kupola.esm.js';
        }
        return `kupola.${format}.js`;
      },
    },
    rollupOptions: {
      plugins: [
        nodeResolve(),
        commonjs(),
        copy({
          targets: [
            { src: 'types/kupola.d.ts', dest: 'dist/types' },
            { src: 'icons/', dest: 'dist/icons' },
            { src: 'css/kupola.css', dest: 'dist/css' },
            { src: 'utils/', dest: 'dist/utils' }
          ],
          hook: 'writeBundle'
        })
      ],
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@js': path.resolve(__dirname, 'js'),
      '@css': path.resolve(__dirname, 'css'),
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
});