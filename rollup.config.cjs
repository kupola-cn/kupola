const fs = require('fs');
const path = require('path');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');

const terserOptions = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.warn', 'console.error'],
    passes: 3,
    hoist_funs: true,
    hoist_vars: true,
    inline: true,
    collapse_vars: true,
    reduce_vars: true,
  },
  mangle: {
    properties: { regex: /^_/ },
    toplevel: true,
    keep_classnames: false,
    keep_fnames: false,
  },
};

function plugins(include, resolveOptions = {}) {
  return [
    replace({
      preventAssignment: true,
      values: {
        '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
      },
    }),
    nodeResolve({ browser: true, ...resolveOptions }),
    commonjs({ include, requireReturnsDefault: 'auto' }),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      extensions: ['.js'],
    }),
  ];
}

function bundle(input, outputBase, include, options = {}, resolveOptions = {}) {
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
    plugins: plugins(include, resolveOptions),
    external: ['@babel/runtime', '@kupola/core', '@kupola/core/i18n', '@kupola/core/server', '@kupola/core/directives'],
  };
}

const coreInclude = ['packages/core/src/**/*.js'];
const componentsInclude = ['packages/components/src/**/*.js'];
const aiAdapterInclude = ['packages/ai-adapter/src/**/*.js'];

const coreEntries = [
  ['packages/core/src/index.js', 'dist/kupola-core'],
  ['packages/core/src/platform.js', 'dist/kupola-platform'],
  ['packages/core/src/server.js', 'dist/kupola-core-server'],
  ['packages/core/src/directives.js', 'dist/kupola-core-directives'],
  ['packages/core/src/i18n.js', 'dist/kupola-core-i18n'],
];

const componentsDir = path.join(__dirname, 'packages/components/src/components');
const componentEntries = fs
  .readdirSync(componentsDir)
  .filter(file => file.endsWith('.js'))
  .sort()
  .map(file => {
    const name = path.basename(file, '.js');
    return [
      `packages/components/src/components/${file}`,
      `dist/kupola-components-${name}`,
    ];
  });

const componentsMainEntry = [
  ['packages/components/src/index.js', 'dist/kupola-components'],
];

const coreResolveOptions = {
  resolveDirs: [path.join(__dirname, 'packages/core/src')],
};

module.exports = [
  ...coreEntries.map(([input, outputBase]) => bundle(input, outputBase, coreInclude)),
  ...componentsMainEntry.map(([input, outputBase]) => bundle(input, outputBase, componentsInclude, {}, coreResolveOptions)),
  ...componentEntries.map(([input, outputBase]) => bundle(input, outputBase, componentsInclude, {}, coreResolveOptions)),
  bundle(
    'packages/ai-adapter/src/index.js',
    'packages/ai-adapter/dist/ai-adapter',
    aiAdapterInclude,
  ),
];