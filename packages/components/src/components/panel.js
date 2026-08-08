// SPDX-License-Identifier: MIT
/**
 * Declarative panel container with optional header, body, and footer slots.
 *
 * @module components/panel
 */

import { defineComponent } from '@kupola/platform/component';
import { html } from '@kupola/platform/template';
import { isSignalLike } from '@kupola/platform/render';

let panelId = 0;

function resolveValue(prop) {
  let value = prop?.value;
  if (typeof value === 'function') {value = value();}
  if (isSignalLike(value)) {value = value.value;}
  return value;
}

function hasRenderableValue(value) {
  return value !== undefined && value !== null && value !== false && value !== '';
}

function normalizeOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeClassName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getPanelClasses(props) {
  const density = normalizeOption(
    resolveValue(props.density),
    [ 'compact', 'default', 'comfortable' ],
    'default',
  );
  const headerTone = normalizeOption(
    resolveValue(props.headerTone),
    [ 'plain', 'muted' ],
    'plain',
  );
  const classes = [ 'ds-panel', `ds-panel--density-${density}` ];
  if (headerTone === 'muted') {classes.push('ds-panel--header-muted');}
  if (resolveValue(props.fill) === true) {classes.push('ds-panel--fill');}
  const customClassName = normalizeClassName(resolveValue(props.className));
  if (customClassName) {classes.push(customClassName);}
  return classes.join(' ');
}

function getBodyClasses(props) {
  const padding = normalizeOption(
    resolveValue(props.bodyPadding),
    [ 'none', 'compact', 'default', 'comfortable' ],
    'default',
  );
  const classes = [ 'ds-panel__body', `ds-panel__body--padding-${padding}` ];
  if (resolveValue(props.bodyScrollable) === true) {
    classes.push('ds-panel__body--scrollable');
  }
  const customClassName = normalizeClassName(resolveValue(props.bodyClassName));
  if (customClassName) {classes.push(customClassName);}
  return classes.join(' ');
}

function renderDefaultHeader({ title, subtitle, icon, actions, titleId }) {
  return html`
    <div class="ds-panel__heading">
      ${hasRenderableValue(icon) ? html`<span class="ds-panel__icon" aria-hidden="true">${icon}</span>` : ''}
      <div class="ds-panel__heading-copy">
        ${hasRenderableValue(title) ? html`<h2 class="ds-panel__title" id="${titleId}">${title}</h2>` : ''}
        ${hasRenderableValue(subtitle) ? html`<p class="ds-panel__subtitle">${subtitle}</p>` : ''}
      </div>
    </div>
    ${hasRenderableValue(actions) ? html`<div class="ds-panel__actions">${actions}</div>` : ''}
  `;
}

export const Panel = defineComponent({
  props: [
    'title',
    'subtitle',
    'icon',
    'actions',
    'header',
    'footer',
    'density',
    'headerTone',
    'bodyScrollable',
    'bodyPadding',
    'bodyClassName',
    'fill',
    'className',
    'role',
    'ariaLabel',
  ],
  setup({ props, children }) {
    const titleId = `ds-panel-title-${++panelId}`;

    const hasTitle = () => hasRenderableValue(resolveValue(props.title));
    const hasHeader = () => (
      hasRenderableValue(resolveValue(props.header))
      || hasTitle()
      || hasRenderableValue(resolveValue(props.subtitle))
      || hasRenderableValue(resolveValue(props.icon))
      || hasRenderableValue(resolveValue(props.actions))
    );

    const renderHeader = () => {
      const customHeader = resolveValue(props.header);
      return html`
        <header class="ds-panel__header">
          ${hasRenderableValue(customHeader)
    ? customHeader
    : renderDefaultHeader({
      title: resolveValue(props.title),
      subtitle: resolveValue(props.subtitle),
      icon: resolveValue(props.icon),
      actions: resolveValue(props.actions),
      titleId,
    })}
        </header>
      `;
    };

    return () => html`
      <section
        class="${() => getPanelClasses(props)}"
        role="${() => resolveValue(props.role) || null}"
        aria-label="${() => resolveValue(props.ariaLabel) || null}"
        aria-labelledby="${() => resolveValue(props.ariaLabel) || !hasTitle() ? null : titleId}"
      >
        ${() => hasHeader() ? renderHeader() : ''}
        <div class="${() => getBodyClasses(props)}">${children}</div>
        ${() => hasRenderableValue(resolveValue(props.footer))
    ? html`<footer class="ds-panel__footer">${resolveValue(props.footer)}</footer>`
    : ''}
      </section>
    `;
  },
});
