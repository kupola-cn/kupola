/**
 * @file Notification & Alert component stories.
 */
import { Notification } from '../packages/core/src/components/notification.js';
import { Alert } from '../packages/core/src/components/alert.js';
import '../packages/css/index.css';

export default {
  title: 'Feedback/Notification & Alert',
  tags: ['autodocs'],
};

export const NotificationTypes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.flexWrap = 'wrap';

    const types = ['normal', 'success', 'warning', 'error', 'info'];
    types.forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'ds-btn ds-btn-primary';
      btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      btn.addEventListener('click', () => {
        Notification.open({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
          message: `This is a ${type} notification message.`,
          type,
          duration: 3000,
        });
      });
      container.appendChild(btn);
    });

    return container;
  },
};

export const NotificationPositions = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.flexWrap = 'wrap';

    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'bottom'];
    positions.forEach(pos => {
      const btn = document.createElement('button');
      btn.className = 'ds-btn ds-btn-ghost';
      btn.textContent = pos;
      btn.addEventListener('click', () => {
        Notification.setPosition(pos);
        Notification.open({
          title: `Position: ${pos}`,
          message: 'Notification at ' + pos,
          type: 'info',
          duration: 3000,
        });
      });
      container.appendChild(btn);
    });

    return container;
  },
};

export const NotificationPersistent = {
  render: () => {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'ds-btn ds-btn-primary';
    btn.textContent = 'Persistent Notification (no auto-close)';
    btn.addEventListener('click', () => {
      Notification.open({
        title: 'Persistent',
        message: 'This notification will not auto-close. Click × to dismiss.',
        type: 'warning',
        duration: 0,
      });
    });
    container.appendChild(btn);
    return container;
  },
};

export const AlertTypes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '12px';

    const types = [
      { type: 'normal', title: 'Information', desc: 'This is a normal alert with useful information.' },
      { type: 'success', title: 'Success', desc: 'Operation completed successfully.' },
      { type: 'warning', title: 'Warning', desc: 'Please review before proceeding.' },
      { type: 'danger', title: 'Error', desc: 'Something went wrong. Please try again.' },
      { type: 'info', title: 'Tip', desc: 'Here is a helpful tip for you.' },
    ];

    types.forEach(({ type, title, desc }) => {
      const alert = Alert({ type, title, description: desc, closable: true });
      container.appendChild(alert.element);
    });

    return container;
  },
};

export const AlertClosable = {
  args: { closable: true },
  argTypes: { closable: { control: 'boolean' } },
  render: (args) => {
    const container = document.createElement('div');
    const alert = Alert({
      type: 'info',
      title: 'Closable Alert',
      description: 'Click the × button to dismiss this alert.',
      closable: args.closable,
      onClose: () => console.log('Alert dismissed'),
    });
    container.appendChild(alert.element);
    return container;
  },
};
