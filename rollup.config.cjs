const fs = require('fs');
const path = require('path');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');

const terserOptions = {
  compress: { drop_console: true, drop_debugger: true },
  mangle: { properties: { regex: /^_/ } },
};

function plugins(include) {
  return [
    nodeResolve({ browser: true }),
    commonjs({ include, requireReturnsDefault: 'auto' }),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js'],
    }),
  ];
}

function bundle(input, outputBase, include, options = {}) {
  return {
    input,
    output: [
      {
        file: `${outputBase}.esm.js`,
        format: 'esm',
        sourcemap: false,
        plugins: [terser(terserOptions)],
      },
      {
        file: `${outputBase}.cjs`,
        format: 'cjs',
        sourcemap: false,
        exports: options.exports || 'named',
        plugins: [terser(terserOptions)],
      },
    ],
    plugins: plugins(include),
    external: ['@babel/runtime'],
  };
}

const coreInclude = ['packages/core/src/**/*.js'];
const aiAdapterInclude = ['packages/ai-adapter/src/**/*.js'];

const coreEntries = [
  ['packages/core/src/index.js', 'dist/kupola-core'],
  ['packages/core/src/server.js', 'dist/kupola-core-server'],
  ['packages/core/src/directives.js', 'dist/kupola-core-directives'],
  ['packages/core/src/i18n.js', 'dist/kupola-core-i18n'],
];

const componentDir = path.join(__dirname, 'packages/core/src/components');
const componentEntries = fs
  .readdirSync(componentDir)
  .filter(file => file.endsWith('.js'))
  .sort()
  .map(file => {
    const name = path.basename(file, '.js');
    return [
      `packages/core/src/components/${file}`,
      `dist/kupola-core-${name}`,
    ];
  });

module.exports = [
  ...coreEntries.map(([input, outputBase]) => bundle(input, outputBase, coreInclude)),
  ...componentEntries.map(([input, outputBase]) => bundle(input, outputBase, coreInclude)),
  bundle(
    'packages/ai-adapter/src/index.js',
    'packages/ai-adapter/dist/ai-adapter',
    aiAdapterInclude,
  ),
];
