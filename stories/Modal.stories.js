/**
 * @file Modal component stories for Storybook.
 */
import { Modal } from '../packages/core/src/components/modal.js';
import { html } from '../packages/core/src/template.js';
import '../packages/css/index.css';

export default {
  title: 'Overlay/Modal',
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Modal title' },
    width: { control: 'text', description: 'Modal width (e.g. "480px")' },
    closableOnMask: { control: 'boolean', description: 'Close on mask click' },
    escClose: { control: 'boolean', description: 'Close on ESC key' },
    content: { control: 'text', description: 'Body content text' },
  },
};

export const Default = {
  args: {
    title: 'Hello Modal',
    width: '480px',
    closableOnMask: true,
    escClose: true,
    content: 'This is a modal dialog with Kupola 2.0.',
  },
  render: (args) => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Open Modal';

    const modal = Modal({
      title: args.title,
      width: args.width,
      closableOnMask: args.closableOnMask,
      escClose: args.escClose,
    }, html`<p>${args.content}</p>`);

    btn.addEventListener('click', () => modal.open());
    container.appendChild(btn);
    container.appendChild(modal.element);
    return container;
  },
};

export const WithForm = {
  render: () => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Open Form Modal';

    const modal = Modal({ title: 'User Settings', width: '400px' }, html`
      <div style="display:grid; gap:12px;">
        <label>Name: <input class="ds-input" placeholder="Your name" /></label>
        <label>Email: <input class="ds-input" type="email" placeholder="you@example.com" /></label>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
          <button class="ds-btn ds-btn-ghost" id="cancel-btn">Cancel</button>
          <button class="ds-btn ds-btn-primary" id="save-btn">Save</button>
        </div>
      </div>
    `);

    btn.addEventListener('click', () => modal.open());
    container.appendChild(btn);
    container.appendChild(modal.element);

    // Bind close handlers after render
    setTimeout(() => {
      modal.element.querySelector('#cancel-btn')?.addEventListener('click', () => modal.close());
      modal.element.querySelector('#save-btn')?.addEventListener('click', () => {
        alert('Saved!');
        modal.close();
      });
    }, 0);

    return container;
  },
};

export const WideModal = {
  render: () => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Open Wide Modal';

    const modal = Modal({ title: 'Data Overview', width: '800px' }, html`
      <table class="ds-table" style="width:100%;">
        <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Role</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Alice</td><td>Active</td><td>Admin</td></tr>
          <tr><td>2</td><td>Bob</td><td>Inactive</td><td>User</td></tr>
          <tr><td>3</td><td>Carol</td><td>Active</td><td>Editor</td></tr>
        </tbody>
      </table>
    `);

    btn.addEventListener('click', () => modal.open());
    container.appendChild(btn);
    container.appendChild(modal.element);
    return container;
  },
};
