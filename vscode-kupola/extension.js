/**
 * vscode-kupola — VS Code extension for Kupola UI framework.
 *
 * Provides:
 * - HTML snippets for Kupola directives (via contributes.snippets)
 * - JS snippets for Kupola API usage (via contributes.snippets)
 * - HTML attribute auto-completion & hover docs (via html.customData)
 *
 * This extension.js is the activation entry point (currently minimal
 * since most features are declarative via package.json contributes).
 */

// @ts-check
'use strict';

/**
 * @param {import('vscode').ExtensionContext} context
 */
function activate(context) {
  // All features are declarative via package.json contributes:
  // - snippets/kupola.json    → HTML directive snippets
  // - snippets/kupola-js.json → JS API snippets
  // - html-custom-data.json   → attribute hover docs & completion
  //
  // Future enhancements can register providers here:
  // - CompletionItemProvider for k-* attribute suggestions
  // - DiagnosticCollection for real-time directive validation
  // - CodeActionProvider for quick-fixes
  console.log('Kupola UI extension activated');
}

function deactivate() {}

module.exports = { activate, deactivate };
