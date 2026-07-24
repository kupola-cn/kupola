/**
 * @file Navigation components stories for Storybook.
 */
import { Menu } from '../packages/components/src/components/menu.js';
import { Tabs } from '../packages/components/src/components/tabs.js';
import { Breadcrumb } from '../packages/components/src/components/breadcrumb.js';
import { Pagination } from '../packages/components/src/components/pagination.js';
import '../packages/css/index.css';

export default {
  title: 'Navigation',
  tags: ['autodocs'],
};

export const MenuVertical = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '200px';

    const menu = Menu({
      mode: 'vertical',
      items: [
        { key: 'home', label: 'Home', icon: 'home' },
        { key: 'users', label: 'Users', icon: 'user', children: [
          { key: 'list', label: 'User List' },
          { key: 'add', label: 'Add User' },
        ]},
        { key: 'settings', label: 'Settings', icon: 'settings' },
        { key: 'help', label: 'Help', icon: 'help-circle' },
      ],
      onSelect: (key) => console.log('Menu selected:', key),
    });

    container.appendChild(menu.element);
    return container;
  },
};

export const MenuHorizontal = {
  render: () => {
    const container = document.createElement('div');

    const menu = Menu({
      mode: 'horizontal',
      items: [
        { key: 'home', label: 'Home' },
        { key: 'products', label: 'Products', children: [
          { key: 'list', label: 'Product List' },
          { key: 'categories', label: 'Categories' },
          { key: 'add', label: 'Add Product' },
        ]},
        { key: 'orders', label: 'Orders' },
        { key: 'reports', label: 'Reports' },
      ],
    });

    container.appendChild(menu.element);
    return container;
  },
};

export const TabsBasic = {
  argTypes: {
    type: { control: { type: 'select', options: ['line', 'card', 'border-card'] } },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
  },
  args: {
    type: 'line',
    size: 'md',
  },
  render: (args) => {
    const container = document.createElement('div');

    const tabs = Tabs({
      type: args.type,
      size: args.size,
      activeKey: 'tab1',
      tabs: [
        { key: 'tab1', label: 'Tab 1' },
        { key: 'tab2', label: 'Tab 2' },
        { key: 'tab3', label: 'Tab 3' },
      ],
      content: {
        tab1: '<p>Content for Tab 1</p>',
        tab2: '<p>Content for Tab 2</p>',
        tab3: '<p>Content for Tab 3</p>',
      },
      onChange: (key) => console.log('Tab changed:', key),
    });

    container.appendChild(tabs.element);
    return container;
  },
};

export const TabsWithIcon = {
  render: () => {
    const container = document.createElement('div');

    const tabs = Tabs({
      activeKey: 'profile',
      tabs: [
        { key: 'home', label: 'Home', icon: 'home' },
        { key: 'profile', label: 'Profile', icon: 'user' },
        { key: 'settings', label: 'Settings', icon: 'settings' },
      ],
      content: {
        home: '<p>Welcome home!</p>',
        profile: '<p>Your profile information</p>',
        settings: '<p>Configure your settings</p>',
      },
    });

    container.appendChild(tabs.element);
    return container;
  },
};

export const BreadcrumbBasic = {
  render: () => {
    const container = document.createElement('div');

    const breadcrumb = Breadcrumb({
      items: [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Category', href: '/products/category' },
        { label: 'Item', active: true },
      ],
      separator: '>',
    });

    container.appendChild(breadcrumb.element);
    return container;
  },
};

export const PaginationBasic = {
  argTypes: {
    current: { control: 'number', min: 1 },
    pageSize: { control: 'number', min: 1, max: 50 },
    total: { control: 'number', min: 1 },
  },
  args: {
    current: 1,
    pageSize: 10,
    total: 100,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';

    const pagination = Pagination({
      current: args.current,
      pageSize: args.pageSize,
      total: args.total,
      onChange: (page, size) => console.log(`Page: ${page}, Size: ${size}`),
    });

    container.appendChild(pagination.element);
    return container;
  },
};

export const PaginationSimple = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';

    const pagination = Pagination({
      current: 5,
      total: 50,
      simple: true,
      onChange: (page) => console.log('Page:', page),
    });

    container.appendChild(pagination.element);
    return container;
  },
};
