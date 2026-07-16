const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const babel = require('@rollup/plugin-babel');

module.exports = [
  // ── @kupola/core (2.0 reactivity engine) ──────────────────────────────
  {
    input: 'packages/core/src/index.js',
    output: [
      {
        file: 'dist/kupola-core.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/server (SSR layer) ────────────────────────────────────
  {
    input: 'packages/core/src/server.js',
    output: [
      {
        file: 'dist/kupola-core-server.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-server.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/directives (directive system) ─────────────────────────
  {
    input: 'packages/core/src/directives.js',
    output: [
      {
        file: 'dist/kupola-core-directives.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-directives.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/i18n (internationalization) ─────────────────────────
  {
    input: 'packages/core/src/i18n.js',
    output: [
      {
        file: 'dist/kupola-core-i18n.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-i18n.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/modal ──────────────────────────────────────
  {
    input: 'packages/core/src/components/modal.js',
    output: [
      {
        file: 'dist/kupola-core-modal.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-modal.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/dropdown ───────────────────────────────────
  {
    input: 'packages/core/src/components/dropdown.js',
    output: [
      {
        file: 'dist/kupola-core-dropdown.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-dropdown.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/drawer ─────────────────────────────────────
  {
    input: 'packages/core/src/components/drawer.js',
    output: [
      {
        file: 'dist/kupola-core-drawer.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-drawer.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/collapse ───────────────────────────────────
  {
    input: 'packages/core/src/components/collapse.js',
    output: [
      {
        file: 'dist/kupola-core-collapse.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-collapse.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/tabs ───────────────────────────────────────
  {
    input: 'packages/core/src/components/tabs.js',
    output: [
      {
        file: 'dist/kupola-core-tabs.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-tabs.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/select ─────────────────────────────────────
  {
    input: 'packages/core/src/components/select.js',
    output: [
      {
        file: 'dist/kupola-core-select.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-select.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/pagination ─────────────────────────────────
  {
    input: 'packages/core/src/components/pagination.js',
    output: [
      {
        file: 'dist/kupola-core-pagination.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-pagination.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/datepicker ─────────────────────────────────
  {
    input: 'packages/core/src/components/datepicker.js',
    output: [
      {
        file: 'dist/kupola-core-datepicker.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-datepicker.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/dialog ─────────────────────────────────────
  {
    input: 'packages/core/src/components/dialog.js',
    output: [
      {
        file: 'dist/kupola-core-dialog.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-dialog.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/notification ───────────────────────────────
  {
    input: 'packages/core/src/components/notification.js',
    output: [
      {
        file: 'dist/kupola-core-notification.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-notification.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/tooltip ────────────────────────────────────
  {
    input: 'packages/core/src/components/tooltip.js',
    output: [
      {
        file: 'dist/kupola-core-tooltip.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-tooltip.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/alert ──────────────────────────────────────
  {
    input: 'packages/core/src/components/alert.js',
    output: [
      {
        file: 'dist/kupola-core-alert.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-alert.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/switch ─────────────────────────────────────
  {
    input: 'packages/core/src/components/switch.js',
    output: [
      {
        file: 'dist/kupola-core-switch.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-switch.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/progress ───────────────────────────────────
  {
    input: 'packages/core/src/components/progress.js',
    output: [
      {
        file: 'dist/kupola-core-progress.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-progress.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/tag ────────────────────────────────────────
  {
    input: 'packages/core/src/components/tag.js',
    output: [
      {
        file: 'dist/kupola-core-tag.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-tag.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/badge ──────────────────────────────────────
  {
    input: 'packages/core/src/components/badge.js',
    output: [
      {
        file: 'dist/kupola-core-badge.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-badge.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/divider ────────────────────────────────────
  {
    input: 'packages/core/src/components/divider.js',
    output: [
      {
        file: 'dist/kupola-core-divider.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-divider.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/skeleton ───────────────────────────────────
  {
    input: 'packages/core/src/components/skeleton.js',
    output: [
      {
        file: 'dist/kupola-core-skeleton.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-skeleton.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/spin ───────────────────────────────────────
  {
    input: 'packages/core/src/components/spin.js',
    output: [
      {
        file: 'dist/kupola-core-spin.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-spin.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/empty ──────────────────────────────────────
  {
    input: 'packages/core/src/components/empty.js',
    output: [
      {
        file: 'dist/kupola-core-empty.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-empty.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/timeline ───────────────────────────────────
  {
    input: 'packages/core/src/components/timeline.js',
    output: [
      {
        file: 'dist/kupola-core-timeline.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-timeline.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/kbd ────────────────────────────────────────
  {
    input: 'packages/core/src/components/kbd.js',
    output: [
      {
        file: 'dist/kupola-core-kbd.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-kbd.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/countdown ──────────────────────────────────
  {
    input: 'packages/core/src/components/countdown.js',
    output: [
      {
        file: 'dist/kupola-core-countdown.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-countdown.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/breadcrumb ─────────────────────────────────
  {
    input: 'packages/core/src/components/breadcrumb.js',
    output: [
      {
        file: 'dist/kupola-core-breadcrumb.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-breadcrumb.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/checkbox ───────────────────────────────────
  {
    input: 'packages/core/src/components/checkbox.js',
    output: [
      {
        file: 'dist/kupola-core-checkbox.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-checkbox.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/radio ──────────────────────────────────────
  {
    input: 'packages/core/src/components/radio.js',
    output: [
      {
        file: 'dist/kupola-core-radio.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-radio.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/input ──────────────────────────────────────
  {
    input: 'packages/core/src/components/input.js',
    output: [
      {
        file: 'dist/kupola-core-input.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-input.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/avatar ─────────────────────────────────────
  {
    input: 'packages/core/src/components/avatar.js',
    output: [
      {
        file: 'dist/kupola-core-avatar.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-avatar.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/slider ─────────────────────────────────────
  {
    input: 'packages/core/src/components/slider.js',
    output: [
      {
        file: 'dist/kupola-core-slider.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-slider.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/numberinput ──────────────────────────────────
  {
    input: 'packages/core/src/components/numberinput.js',
    output: [
      {
        file: 'dist/kupola-core-numberinput.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-numberinput.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/textarea ─────────────────────────────────────
  {
    input: 'packages/core/src/components/textarea.js',
    output: [
      {
        file: 'dist/kupola-core-textarea.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-textarea.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/statcard ─────────────────────────────────────
  {
    input: 'packages/core/src/components/statcard.js',
    output: [
      {
        file: 'dist/kupola-core-statcard.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-statcard.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/timepicker ──────────────────────────────────
  {
    input: 'packages/core/src/components/timepicker.js',
    output: [
      {
        file: 'dist/kupola-core-timepicker.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-timepicker.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/carousel ──────────────────────────────────
  {
    input: 'packages/core/src/components/carousel.js',
    output: [
      {
        file: 'dist/kupola-core-carousel.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-carousel.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/tree ──────────────────────────────────
  {
    input: 'packages/core/src/components/tree.js',
    output: [
      {
        file: 'dist/kupola-core-tree.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-tree.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/menu ──────────────────────────────────────
  {
    input: 'packages/core/src/components/menu.js',
    output: [
      {
        file: 'dist/kupola-core-menu.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-menu.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/fileupload ──────────────────────────────────
  {
    input: 'packages/core/src/components/fileupload.js',
    output: [
      {
        file: 'dist/kupola-core-fileupload.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-fileupload.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/dynamictags ──────────────────────────────────
  {
    input: 'packages/core/src/components/dynamictags.js',
    output: [
      {
        file: 'dist/kupola-core-dynamictags.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-dynamictags.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/imagepreview ──────────────────────────────────
  {
    input: 'packages/core/src/components/imagepreview.js',
    output: [
      {
        file: 'dist/kupola-core-imagepreview.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-imagepreview.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/colorpicker ──────────────────────────────────
  {
    input: 'packages/core/src/components/colorpicker.js',
    output: [
      {
        file: 'dist/kupola-core-colorpicker.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-colorpicker.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/core/components/virtuallist ──────────────────────────────────
  {
    input: 'packages/core/src/components/virtuallist.js',
    output: [
      {
        file: 'dist/kupola-core-virtuallist.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/kupola-core-virtuallist.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/icons ──────────────────────────────────
  {
input: 'packages/core/src/components/icons.js',
    output: [
      {
file: 'dist/kupola-core-icons.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-icons.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/message ──────────────────────────────────
  {
input: 'packages/core/src/components/message.js',
    output: [
      {
file: 'dist/kupola-core-message.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-message.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/heatmap ──────────────────────────────────
  {
input: 'packages/core/src/components/heatmap.js',
    output: [
      {
file: 'dist/kupola-core-heatmap.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-heatmap.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/calendar ──────────────────────────────────
  {
input: 'packages/core/src/components/calendar.js',
    output: [
      {
file: 'dist/kupola-core-calendar.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-calendar.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/validation ──────────────────────────────────
  {
input: 'packages/core/src/components/validation.js',
    output: [
      {
file: 'dist/kupola-core-validation.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-validation.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/form ──────────────────────────────────
  {
input: 'packages/core/src/components/form.js',
    output: [
      {
file: 'dist/kupola-core-form.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-form.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
// ── @kupola/core/components/table ──────────────────────────────────
  {
input: 'packages/core/src/components/table.js',
    output: [
      {
file: 'dist/kupola-core-table.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
file: 'dist/kupola-core-table.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/core/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  },
  // ── @kupola/ai-adapter (AI operation engine) ─────────────────────────
  {
    input: 'packages/ai-adapter/src/index.js',
    output: [
      {
        file: 'dist/ai-adapter.esm.js',
        format: 'esm',
        sourcemap: false,
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      },
      {
        file: 'dist/ai-adapter.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
        plugins: [terser({
          compress: { drop_console: true, drop_debugger: true },
          mangle: { properties: { regex: /^_/ } }
        })]
      }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      commonjs({ include: ['packages/ai-adapter/src/**/*.js'], requireReturnsDefault: 'auto' }),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.js'],
      })
    ],
    external: ['@babel/runtime']
  }
];