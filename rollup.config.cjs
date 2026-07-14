const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const copy = require('rollup-plugin-copy');

module.exports = [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/kupola.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola.cjs.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'auto',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola.umd.js',
        format: 'umd',
        name: 'Kupola',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola.min.js',
        format: 'umd',
        name: 'Kupola',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs({
        include: ['js/**/*.js'],
        requireReturnsDefault: 'auto'
      }),
      copy({
        targets: [
          { src: 'types/kupola.d.ts', dest: 'dist/types' },
          { src: 'icons/', dest: 'dist/icons' }
        ]
      })
    ],
    external: []
  },
  {
    input: 'src/core.js',
    output: [
      {
        file: 'dist/core.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/core.cjs.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'auto',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/core.umd.js',
        format: 'umd',
        name: 'KupolaCore',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs({
        include: ['js/**/*.js'],
        requireReturnsDefault: 'auto'
      })
    ],
    external: []
  },
  {
    input: 'src/index-lite.js',
    output: [
      {
        file: 'dist/kupola-lite.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-lite.cjs.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'auto',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs({
        include: ['js/**/*.js'],
        requireReturnsDefault: 'auto'
      })
    ],
    external: []
  }
];