import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';
import path from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: {
        'kupola-core': path.resolve(__dirname, 'packages/core/src/index.js'),
        'kupola-core-server': path.resolve(__dirname, 'packages/core/src/server.js'),
        'kupola-core-directives': path.resolve(__dirname, 'packages/core/src/directives.js'),
      },
      name: 'Kupola',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'es') {
          return `${entryName}.esm.js`;
        }
        return `${entryName}.${format}.js`;
      },
    },
    rollupOptions: {
      plugins: [
        babel({
          babelHelpers: 'runtime',
          exclude: 'node_modules/**',
          extensions: ['.js'],
        }),
      ],
      external: ['@babel/runtime'],
      output: {
        exports: 'named',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'packages/core/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
});
