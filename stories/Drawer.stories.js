/**
 * @file Drawer component stories.
 */
import { Drawer } from '../packages/core/src/components/drawer.js';
import { html } from '../packages/core/src/template.js';
import '../packages/css/index.css';

export default {
  title: 'Overlay/Drawer',
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    placement: { control: 'select', options: ['right', 'left', 'top', 'bottom'] },
    width: { control: 'text' },
  },
};

export const Default = {
  args: {
    title: 'Settings',
    placement: 'right',
    width: '400px',
  },
  render: (args) => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Open Drawer';

    const drawer = Drawer({
      title: args.title,
      placement: args.placement,
      width: args.width,
    }, html`
      <div style="padding: 16px;">
        <h3>Drawer Content</h3>
        <p>This is a drawer panel that slides in from the ${args.placement}.</p>
      </div>
    `);

    btn.addEventListener('click', () => drawer.open());
    container.appendChild(btn);
    container.appendChild(drawer.element);
    return container;
  },
};

export const LeftDrawer = {
  render: () => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Navigation Menu';

    const drawer = Drawer({
      title: 'Navigation',
      placement: 'left',
      width: '280px',
    }, html`
      <nav style="padding: 8px;">
        <a href="#" style="display:block; padding:10px; text-decoration:none; color:inherit; border-radius:6px;">Dashboard</a>
        <a href="#" style="display:block; padding:10px; text-decoration:none; color:inherit; border-radius:6px;">Users</a>
        <a href="#" style="display:block; padding:10px; text-decoration:none; color:inherit; border-radius:6px;">Settings</a>
        <a href="#" style="display:block; padding:10px; text-decoration:none; color:inherit; border-radius:6px;">Help</a>
      </nav>
    `);

    btn.addEventListener('click', () => drawer.open());
    container.appendChild(btn);
    container.appendChild(drawer.element);
    return container;
  },
};
