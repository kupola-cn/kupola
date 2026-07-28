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
    external: id => externalPkgs.some(pkg => id === pkg || id.startsWith(`${pkg}/`)),
  };
}

const coreInclude = ['packages/core/src/**/*.js'];
const platformInclude = ['packages/platform/src/**/*.js'];
const componentsInclude = ['packages/components/src/**/*.js'];
const aiAdapterInclude = ['packages/ai-adapter/src/**/*.js'];
const authInclude = ['packages/auth/src/**/*.js'];
const routerInclude = ['packages/router/src/**/*.js', 'packages/platform/src/**/*.js'];

// ── @kupola/core entries ─────────────────────────────────────────────────────
const coreEntries = [
  ['packages/core/src/index.js', 'packages/core/dist/kupola-core'],
  ['packages/core/src/devtools.js', 'packages/core/dist/kupola-core-devtools'],
];

// ── @kupola/platform entries ─────────────────────────────────────────────────
const platformEntries = [
  ['packages/platform/src/platform.js', 'packages/platform/dist/kupola-platform'],
  ['packages/platform/src/template.js', 'packages/platform/dist/kupola-platform-template'],
  ['packages/platform/src/render.js', 'packages/platform/dist/kupola-platform-render'],
  ['packages/platform/src/component.js', 'packages/platform/dist/kupola-platform-component'],
  ['packages/platform/src/directives.js', 'packages/platform/dist/kupola-platform-directives'],
  ['packages/platform/src/theme.js', 'packages/platform/dist/kupola-platform-theme'],
  ['packages/platform/src/lazy.js', 'packages/platform/dist/kupola-platform-lazy'],
  ['packages/platform/src/server.js', 'packages/platform/dist/kupola-platform-server'],
  ['packages/platform/src/i18n.js', 'packages/platform/dist/kupola-platform-i18n'],
  ['packages/platform/src/errors.js', 'packages/platform/dist/kupola-platform-errors'],
];

// ── @kupola/components entries ───────────────────────────────────────────────
const componentsDir = path.join(__dirname, 'packages/components/src/components');
const componentsPackage = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'packages/components/package.json'), 'utf8'),
);
const componentEntries = Object.entries(componentsPackage.exports)
  .filter(([subpath]) => subpath !== '.')
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([subpath, entry]) => {
    const name = subpath.replace(/^\.\//, '');
    const input = path.join(componentsDir, `${name}.js`);
    const expectedImport = `./dist/kupola-components-${name}.esm.js`;
    const expectedRequire = `./dist/kupola-components-${name}.cjs`;

    if (!/^\.\/[a-z0-9-]+$/.test(subpath)) {
      throw new Error(`Unsupported @kupola/components export subpath: ${subpath}`);
    }
    if (!entry || entry.import !== expectedImport || entry.require !== expectedRequire) {
      throw new Error(
        `Invalid @kupola/components export targets for ${subpath}; expected ` +
        `${expectedImport} and ${expectedRequire}.`,
      );
    }
    if (!fs.existsSync(input)) {
      throw new Error(`Missing source for @kupola/components export ${subpath}: ${input}`);
    }

    return [
      path.relative(__dirname, input).replace(/\\/g, '/'),
      `packages/components/dist/kupola-components-${name}`,
    ];
  });

const componentsMainEntry = [
  ['packages/components/src/index.js', 'packages/components/dist/kupola-components'],
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

  // @kupola/auth
  bundle(
    'packages/auth/src/index.js',
    'packages/auth/dist/kupola-auth',
    authInclude,
  ),
  bundle(
    'packages/auth/src/directive.js',
    'packages/auth/dist/kupola-auth-directive',
    authInclude,
  ),
  bundle(
    'packages/auth/src/http-guard.js',
    'packages/auth/dist/kupola-auth-http',
    authInclude,
  ),
  bundle(
    'packages/auth/src/auth-context.js',
    'packages/auth/dist/kupola-auth-context',
    authInclude,
  ),

  // @kupola/router
  bundle(
    'packages/router/src/index.js',
    'packages/router/dist/kupola-router',
    routerInclude,
    {},
    platformResolveOptions,
    ['@babel/runtime', '@kupola/core', '@kupola/platform'],
  ),
  bundle(
    'packages/router/src/link.js',
    'packages/router/dist/kupola-router-link',
    routerInclude,
    {},
    platformResolveOptions,
    ['@babel/runtime', '@kupola/core', '@kupola/platform'],
  ),
  bundle(
    'packages/router/src/view.js',
    'packages/router/dist/kupola-router-view',
    routerInclude,
    {},
    platformResolveOptions,
    ['@babel/runtime', '@kupola/core', '@kupola/platform'],
  ),
  bundle(
    'packages/router/src/auth.js',
    'packages/router/dist/kupola-router-auth',
    routerInclude,
    {},
    platformResolveOptions,
    ['@babel/runtime', '@kupola/core', '@kupola/platform'],
  ),
  bundle(
    'packages/router/src/server.js',
    'packages/router/dist/kupola-router-server',
    routerInclude,
    {},
    platformResolveOptions,
    ['@babel/runtime', '@kupola/core', '@kupola/platform'],
  ),
];
