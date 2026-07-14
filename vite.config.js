import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.js'),
        core: path.resolve(__dirname, 'src/core.js'),
      },
      name: 'Kupola',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'index') {
          if (format === 'es') {
            return 'kupola.esm.js';
          }
          return `kupola.${format}.js`;
        }
        if (format === 'es') {
          return `${entryName}.esm.js`;
        }
        return `${entryName}.${format}.js`;
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
            { src: 'css/*.css', dest: 'dist/css' },
            { src: 'plugins/*.js', dest: 'dist/plugins' },
            { src: 'js/theme-preload.js', dest: 'dist' },
            { src: 'js/theme-standalone.js', dest: 'dist' },
            { src: 'js/vue-theme.js', dest: 'dist' },
            { src: 'js/react-theme.js', dest: 'dist' }
          ],
          hook: 'writeBundle'
        })
      ],
      external: [],
      output: {
        globals: {},
        exports: 'named',
        manualChunks: undefined,
      },
    },
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    emptyOutDir: false,
    chunkSizeWarningLimit: 500,
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