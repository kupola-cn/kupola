const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const postcss = require('rollup-plugin-postcss');
const copy = require('rollup-plugin-copy');

module.exports = [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/js/kupola.esm.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/js/kupola.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'auto'
      },
      {
        file: 'dist/js/kupola.umd.js',
        format: 'umd',
        name: 'Kupola',
        sourcemap: true
      },
      {
        file: 'dist/js/kupola.min.js',
        format: 'umd',
        name: 'Kupola',
        sourcemap: true,
        plugins: [terser()]
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
    input: 'src/index.css',
    output: [
      {
        file: 'dist/css/kupola.css',
        format: 'esm'
      },
      {
        file: 'dist/css/kupola.min.css',
        format: 'esm',
        plugins: [terser()]
      }
    ],
    plugins: [
      postcss({
        extract: true,
        minimize: true
      })
    ]
  }
];