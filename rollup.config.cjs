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

function bundle(input, outputBase, include, options = {}, resolveOptions = {}, externalPkgs = ['@babel/runtime']) {
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
    external: externalPkgs,
  };
}

const coreInclude = ['packages/core/src/**/*.js'];
const platformInclude = ['packages/platform/src/**/*.js'];
const componentsInclude = ['packages/components/src/**/*.js'];
const aiAdapterInclude = ['packages/ai-adapter/src/**/*.js'];

// ── @kupola/core entries ─────────────────────────────────────────────────────
const coreEntries = [
  ['packages/core/src/index.js', 'dist/kupola-core'],
  ['packages/core/src/devtools.js', 'dist/kupola-core-devtools'],
];

// ── @kupola/platform entries ─────────────────────────────────────────────────
const platformEntries = [
  ['packages/platform/src/platform.js', 'dist/kupola-platform'],
  ['packages/platform/src/template.js', 'dist/kupola-platform-template'],
  ['packages/platform/src/render.js', 'dist/kupola-platform-render'],
  ['packages/platform/src/component.js', 'dist/kupola-platform-component'],
  ['packages/platform/src/directives.js', 'dist/kupola-platform-directives'],
  ['packages/platform/src/theme.js', 'dist/kupola-platform-theme'],
  ['packages/platform/src/lazy.js', 'dist/kupola-platform-lazy'],
  ['packages/platform/src/server.js', 'dist/kupola-platform-server'],
  ['packages/platform/src/i18n.js', 'dist/kupola-platform-i18n'],
  ['packages/platform/src/errors.js', 'dist/kupola-platform-errors'],
];

// ── @kupola/components entries ───────────────────────────────────────────────
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

// ── Resolve options ──────────────────────────────────────────────────────────
const platformResolveOptions = {
  resolveDirs: [
    path.join(__dirname, 'packages/core/src'),
    path.join(__dirname, 'packages/platform/src'),
  ],
};

// ── External packages ────────────────────────────────────────────────────────
const coreExternal = ['@babel/runtime'];
const platformExternal = ['@babel/runtime', '@kupola/core'];
const componentsExternal = ['@babel/runtime', '@kupola/core', '@kupola/platform'];

module.exports = [
  // @kupola/core
  ...coreEntries.map(([input, outputBase]) =>
    bundle(input, outputBase, coreInclude, {}, {}, coreExternal),
  ),

  // @kupola/platform
  ...platformEntries.map(([input, outputBase]) =>
    bundle(input, outputBase, platformInclude, {}, platformResolveOptions, platformExternal),
  ),

  // @kupola/components
  ...componentsMainEntry.map(([input, outputBase]) =>
    bundle(input, outputBase, componentsInclude, {}, platformResolveOptions, componentsExternal),
  ),
  ...componentEntries.map(([input, outputBase]) =>
    bundle(input, outputBase, componentsInclude, {}, platformResolveOptions, componentsExternal),
  ),

  // @kupola/ai-adapter
  bundle(
    'packages/ai-adapter/src/index.js',
    'packages/ai-adapter/dist/ai-adapter',
    aiAdapterInclude,
  ),
];
