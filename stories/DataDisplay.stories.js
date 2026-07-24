/**
 * @file Data display components stories for Storybook.
 */
import { Table } from '../packages/components/src/components/table.js';
import { Tree } from '../packages/components/src/components/tree.js';
import { Tag } from '../packages/components/src/components/tag.js';
import { StatCard } from '../packages/components/src/components/statcard.js';
import { Timeline } from '../packages/components/src/components/timeline.js';
import { Badge } from '../packages/components/src/components/badge.js';
import '../packages/css/index.css';

export default {
  title: 'Data Display',
  tags: ['autodocs'],
};

export const TableBasic = {
  render: () => {
    const container = document.createElement('div');

    const table = Table({
      columns: [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age' },
        { key: 'role', title: 'Role' },
        { key: 'status', title: 'Status' },
      ],
      data: [
        { name: 'Alice', age: 28, role: 'Admin', status: 'Active' },
        { name: 'Bob', age: 32, role: 'User', status: 'Inactive' },
        { name: 'Carol', age: 24, role: 'Editor', status: 'Active' },
        { name: 'David', age: 35, role: 'Admin', status: 'Active' },
      ],
    });

    container.appendChild(table.element);
    return container;
  },
};

export const TableWithSelection = {
  render: () => {
    const container = document.createElement('div');

    const table = Table({
      columns: [
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age' },
        { key: 'role', title: 'Role' },
      ],
      data: [
        { name: 'Alice', age: 28, role: 'Admin' },
        { name: 'Bob', age: 32, role: 'User' },
        { name: 'Carol', age: 24, role: 'Editor' },
      ],
      selectable: true,
      onSelect: (selected) => console.log('Selected:', selected),
    });

    container.appendChild(table.element);
    return container;
  },
};

export const TableWithSort = {
  render: () => {
    const container = document.createElement('div');

    const table = Table({
      columns: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'age', title: 'Age', sortable: true },
        { key: 'role', title: 'Role' },
      ],
      data: [
        { name: 'Alice', age: 28, role: 'Admin' },
        { name: 'Bob', age: 32, role: 'User' },
        { name: 'Carol', age: 24, role: 'Editor' },
      ],
      onSort: (key, order) => console.log(`Sort: ${key} ${order}`),
    });

    container.appendChild(table.element);
    return container;
  },
};

export const TreeBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '300px';

    const tree = Tree({
      data: [
        {
          title: 'Root',
          key: 'root',
          children: [
            {
              title: 'Folder 1',
              key: 'f1',
              children: [
                { title: 'File 1-1', key: 'f1-1' },
                { title: 'File 1-2', key: 'f1-2' },
              ],
            },
            {
              title: 'Folder 2',
              key: 'f2',
              children: [
                { title: 'File 2-1', key: 'f2-1' },
              ],
            },
          ],
        },
      ],
      defaultExpandAll: true,
      onSelect: (key) => console.log('Tree selected:', key),
    });

    container.appendChild(tree.element);
    return container;
  },
};

export const TreeWithCheckbox = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '300px';

    const tree = Tree({
      data: [
        {
          title: 'Products',
          key: 'products',
          children: [
            { title: 'Electronics', key: 'elec' },
            { title: 'Clothing', key: 'cloth' },
            { title: 'Books', key: 'books' },
          ],
        },
      ],
      checkable: true,
      defaultExpandAll: true,
      onCheck: (checkedKeys) => console.log('Checked:', checkedKeys),
    });

    container.appendChild(tree.element);
    return container;
  },
};

export const TagBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.flexWrap = 'wrap';

    const types = ['normal', 'success', 'warning', 'danger', 'info'];
    types.forEach((type) => {
      const tag = Tag({
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      });
      container.appendChild(tag.element);
    });

    return container;
  },
};

export const TagClosable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';

    ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'].forEach((label) => {
      const tag = Tag({
        label,
        closable: true,
        onClose: () => console.log(`Closed: ${label}`),
      });
      container.appendChild(tag.element);
    });

    return container;
  },
};

export const BadgeBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '16px';
    container.style.alignItems = 'center';

    const badge1 = Badge({ count: 5, dot: false });
    const badge2 = Badge({ count: 0, dot: true });
    const badge3 = Badge({ count: 99, max: 99 });
    const badge4 = Badge({ count: 100, max: 99 });

    ['Notifications', 'Messages', 'Tasks', 'Alerts'].forEach((text, i) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '4px';

      const span = document.createElement('span');
      span.textContent = text;
      div.appendChild(span);

      const badges = [badge1, badge2, badge3, badge4];
      div.appendChild(badges[i].element);

      container.appendChild(div);
    });

    return container;
  },
};

export const StatCardBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    container.style.gap = '16px';

    const stats = [
      { title: 'Users', value: '1,234', icon: 'user', trend: '+12%' },
      { title: 'Revenue', value: '$56,789', icon: 'dollar', trend: '+8%' },
      { title: 'Orders', value: '987', icon: 'shopping-cart', trend: '-2%' },
      { title: 'Conversion', value: '3.2%', icon: 'trending-up', trend: '+5%' },
    ];

    stats.forEach((stat) => {
      const card = StatCard({
        title: stat.title,
        value: stat.value,
        icon: stat.icon,
        trend: stat.trend,
      });
      container.appendChild(card.element);
    });

    return container;
  },
};

export const TimelineBasic = {
  render: () => {
    const container = document.createElement('div');

    const timeline = Timeline({
      items: [
        { content: 'Project started', time: '2024-01-01' },
        { content: 'First release', time: '2024-02-15', type: 'success' },
        { content: 'Major update', time: '2024-04-20', type: 'warning' },
        { content: 'Current version', time: '2024-06-01', type: 'info' },
      ],
    });

    container.appendChild(timeline.element);
    return container;
  },
};
