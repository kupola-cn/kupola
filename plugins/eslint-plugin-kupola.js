// SPDX-License-Identifier: MIT
/**
 * eslint-plugin-kupola — ESLint rules for Kupola projects.
 *
 * Provides rules to enforce best practices when using the Kupola
 * directive system and component library.
 *
 * Usage:
 * ```js
 * // .eslintrc.cjs
 * const kupolaPlugin = require('@kupola/platform/plugins/eslint-plugin-kupola');
 *
 * module.exports = {
 *   plugins: ['kupola'],
 *   rules: {
 *     'kupola/no-invalid-directives': 'warn',
 *     'kupola/prefer-t-function': 'warn',
 *     'kupola/no-innerhtml-user-input': 'error',
 *   },
 * };
 * ```
 *
 * @module eslint-plugin-kupola
 */

// ── Valid Kupola directives ──────────────────────────────────────────────────

const VALID_DIRECTIVES = new Set([
  'k-data',
  'k-show',
  'k-text',
  'k-html',
  'k-bind',
  'k-on',
  'k-model',
  'k-for',
  'k-if',
  'k-else',
  'k-cloak',
]);

// Shorthand patterns: :attr, @event
const SHORTHAND_BIND = /^:[\w-]+$/;
const SHORTHAND_ON = /^@[\w-]+$/;

// ── Rules ────────────────────────────────────────────────────────────────────

/**
 * Rule: no-invalid-directives
 *
 * Warns when HTML strings in template literals contain `k-*` attributes
 * that are not recognized Kupola directives.
 *
 * This catches typos like `k-date` (should be `k-data`) early.
 */
const noInvalidDirectives = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unknown Kupola k-* directives in template literals',
      recommended: true,
    },
    schema: [],
    messages: {
      unknownDirective: 'Unknown Kupola directive "{{name}}". Did you mean one of: {{suggestions}}?',
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node) {
        // Only check html`` tagged templates
        if (node.tag.name !== 'html') {return;}

        for (const quasi of node.quasi.quasis) {
          const raw = quasi.value.raw;
          // Find k-* attributes
          const matches = raw.matchAll(/\bk-([\w-]+)(?:\s|=|>)/g);
          for (const match of matches) {
            const fullDirective = `k-${match[1]}`;
            if (!VALID_DIRECTIVES.has(fullDirective)) {
              // Find closest valid directive
              const suggestions = Array.from(VALID_DIRECTIVES)
                .filter(d => d.startsWith('k-' + match[1].charAt(0)))
                .join(', ') || Array.from(VALID_DIRECTIVES).slice(0, 5).join(', ');

              context.report({
                node: quasi,
                messageId: 'unknownDirective',
                data: { name: fullDirective, suggestions },
              });
            }
          }
        }
      },
    };
  },
};

/**
 * Rule: prefer-t-function
 *
 * Suggests using `t()` from i18n for common user-facing strings
 * instead of hardcoded English/Chinese text in component options.
 */
const preferTFunction = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest using t() for user-facing strings in component options',
      recommended: false,
    },
    schema: [],
    messages: {
      preferT: 'Consider using t("{{key}}") instead of hardcoded "{{text}}" for internationalization.',
    },
  },
  create(context) {
    // Common component option keys that should use i18n
    const I18N_OPTION_KEYS = new Set([
      'emptyText', 'placeholder', 'confirmText', 'cancelText',
      'loadingText', 'okText', 'cancelText',
    ]);

    // Common hardcoded strings
    const KNOWN_KEYS = {
      'No data': 'table.empty',
      '暂无数据': 'table.empty',
      'Select...': 'select.placeholder',
      '请选择': 'select.placeholder',
      'OK': 'dialog.ok',
      '确定': 'dialog.ok',
      'Cancel': 'dialog.cancel',
      '取消': 'dialog.cancel',
      'Select date': 'datepicker.placeholder',
      '选择日期': 'datepicker.placeholder',
      'Select time': 'timepicker.placeholder',
      '选择时间': 'timepicker.placeholder',
      'Loading...': 'table.loading',
      'Close': 'modal.close',
      '关闭': 'modal.close',
    };

    return {
      Property(node) {
        if (!I18N_OPTION_KEYS.has(node.key.name || node.key.value)) {return;}
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') {return;}

        const text = node.value.value;
        const key = KNOWN_KEYS[text];
        if (key) {
          context.report({
            node: node.value,
            messageId: 'preferT',
            data: { key, text },
          });
        }
      },
    };
  },
};

/**
 * Rule: no-innerhtml-user-input
 *
 * Prevents direct assignment of user-controlled variables to innerHTML
 * without escaping, which is a common XSS vector.
 */
const noInnerHtmlUserInput = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow assigning user-controlled data to innerHTML without escaping',
      recommended: true,
    },
    schema: [],
    messages: {
      noInnerHtml: 'Avoid assigning "{{name}}" directly to innerHTML. Use textContent or escape HTML first.',
    },
  },
  create(context) {
    // Suspicious variable names that likely come from user input
    const USER_INPUT_NAMES = new Set([
      'userInput', 'userData', 'userName', 'userComment',
      'input', 'comment', 'message', 'content', 'description',
      'title', 'name', 'bio', 'body', 'text',
    ]);

    return {
      AssignmentExpression(node) {
        // Check: el.innerHTML = userInput
        if (
          node.left.type === 'MemberExpression' &&
          node.left.property.name === 'innerHTML' &&
          node.right.type === 'Identifier' &&
          USER_INPUT_NAMES.has(node.right.name)
        ) {
          context.report({
            node,
            messageId: 'noInnerHtml',
            data: { name: node.right.name },
          });
        }
      },
    };
  },
};

// ── Plugin export ────────────────────────────────────────────────────────────

module.exports = {
  rules: {
    'no-invalid-directives': noInvalidDirectives,
    'prefer-t-function': preferTFunction,
    'no-innerhtml-user-input': noInnerHtmlUserInput,
  },
  configs: {
    recommended: {
      plugins: ['kupola'],
      rules: {
        'kupola/no-invalid-directives': 'warn',
        'kupola/prefer-t-function': 'warn',
        'kupola/no-innerhtml-user-input': 'error',
      },
    },
  },
};
