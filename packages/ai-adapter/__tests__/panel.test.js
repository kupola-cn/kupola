// SPDX-License-Identifier: MIT
/**
 * AIPanel tests — mount / open / close / destroy / message rendering
 *
 * Uses jsdom (Jest default environment) for DOM simulation.
 */

import { AIAdapter } from '../src/ai-adapter.js';
import { AIPanel } from '../src/panel.js';
import { createAuthGuard } from '../src/middlewares.js';

function createMockStorage() {
  let data = null;
  return { get: () => data, set: (d) => { data = d; } };
}

describe('AIPanel', () => {
  let adapter;
  let panel;
  let container;

  beforeEach(() => {
    adapter = new AIAdapter({
      flow: { storage: createMockStorage() },
      action: { requireConfirm: false },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new AIPanel(adapter, { title: 'Test AI', showTimestamp: true });
  });

  afterEach(() => {
    panel.destroy();
    if (container.parentNode) container.parentNode.removeChild(container);
  });

  it('should construct with adapter and options', () => {
    expect(panel.adapter).toBe(adapter);
    expect(panel.options.title).toBe('Test AI');
    expect(panel.options.showTimestamp).toBe(true);
  });

  it('should mount into a DOM container', () => {
    panel.mount(container);
    expect(container.querySelector('.ds-ai-panel')).not.toBeNull();
    expect(container.querySelector('.ds-ai-messages')).not.toBeNull();
    expect(container.querySelector('.ds-ai-input')).not.toBeNull();
    expect(container.querySelector('.ds-ai-send-btn')).not.toBeNull();
  });

  it('should display title in header', () => {
    panel.mount(container);
    const title = container.querySelector('.ds-ai-title');
    expect(title.textContent).toBe('Test AI');
  });

  it('should open and close', () => {
    panel.mount(container);
    panel.open();
    const panelEl = container.querySelector('.ds-ai-panel');
    expect(panelEl.style.display).toBe('flex');

    panel.close();
    expect(panelEl.style.display).toBe('none');
  });

  it('should toggle visibility', () => {
    panel.mount(container);
    panel.toggle(); // open
    expect(container.querySelector('.ds-ai-panel').style.display).toBe('flex');
    panel.toggle(); // close
    expect(container.querySelector('.ds-ai-panel').style.display).toBe('none');
  });

  it('should add messages programmatically', () => {
    panel.mount(container);
    panel.addMessage('user', 'Hello');
    panel.addMessage('system', 'Hi there!');

    const msgs = container.querySelectorAll('.ds-ai-msg');
    expect(msgs.length).toBe(2);
    expect(msgs[0].textContent).toContain('Hello');
    expect(msgs[1].textContent).toContain('Hi there');
  });

  it('should render action buttons with messages', () => {
    panel.mount(container);
    const actions = [
      { label: 'OK', action: jest.fn() },
      { label: 'Cancel', action: jest.fn() },
    ];
    panel.addMessage('suggestion', 'Create a flow?', actions);

    const buttons = container.querySelectorAll('.ds-ai-msg button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('OK');
  });

  it('should send input when send button clicked', async () => {
    adapter.query.register('search', async () => [{ id: 1 }]);
    panel.mount(container);

    const input = container.querySelector('.ds-ai-input');
    input.value = '查询 test';
    container.querySelector('.ds-ai-send-btn').click();

    // Wait for async process
    await new Promise(r => setTimeout(r, 100));

    const msgs = container.querySelectorAll('.ds-ai-msg');
    expect(msgs.length).toBeGreaterThanOrEqual(1); // at least user message
  });

  it('should expose query result data in a global result viewer', async () => {
    adapter.query.register('search', async () => [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'Operator' },
    ]);
    panel.mount(container);

    const input = container.querySelector('.ds-ai-input');
    input.value = '查询 roles';
    container.querySelector('.ds-ai-send-btn').click();

    await new Promise(r => setTimeout(r, 100));

    const viewButton = [...container.querySelectorAll('.ds-ai-msg button')]
      .find(btn => btn.textContent === '查看数据');
    expect(viewButton).toBeTruthy();

    viewButton.click();

    const viewer = document.body.querySelector('.ds-ai-result-viewer');
    expect(viewer).not.toBeNull();
    expect(viewer.textContent).toContain('查询结果：search');
    expect(viewer.textContent).toContain('Admin');
    expect(viewer.textContent).toContain('Operator');
  });

  it('should pass panel context into adapter permissions', async () => {
    adapter.query.register('search', jest.fn().mockResolvedValue([{ id: 1 }]));
    adapter.use(createAuthGuard({ restrictedQueries: ['search'], allowedRoles: ['admin'] }));
    panel.destroy();
    panel = new AIPanel(adapter, { context: () => ({ role: 'user' }) });
    panel.mount(container);

    const input = container.querySelector('.ds-ai-input');
    input.value = '查询 roles';
    container.querySelector('.ds-ai-send-btn').click();

    await new Promise(r => setTimeout(r, 100));

    const text = container.textContent;
    expect(text).toContain('无权限');
  });

  it('should destroy cleanly', () => {
    panel.mount(container);
    panel.destroy();
    expect(container.querySelector('.ds-ai-panel')).toBeNull();
    expect(document.body.querySelector('.ds-ai-result-viewer')).toBeNull();
  });

  it('should render existing adapter messages on mount', () => {
    adapter.query.register('search', async () => []);
    // Pre-populate adapter messages
    adapter._addMessage('user', 'pre-existing');
    adapter._addMessage('system', 'pre-response');

    panel.mount(container);
    const msgs = container.querySelectorAll('.ds-ai-msg');
    expect(msgs.length).toBe(2);
  });
});
