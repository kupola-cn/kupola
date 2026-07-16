/**
 * @file Table component stories.
 */
import { Table } from '../packages/core/src/components/table.js';
import '../packages/css/index.css';

const sampleData = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'User', status: 'Inactive' },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'User', status: 'Active' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'Active' },
];

const basicColumns = [
  { key: 'id', title: 'ID', width: 60 },
  { key: 'name', title: 'Name' },
  { key: 'email', title: 'Email' },
  { key: 'role', title: 'Role' },
  { key: 'status', title: 'Status' },
];

export default {
  title: 'Data Display/Table',
  tags: ['autodocs'],
};

export const Basic = {
  render: () => {
    const container = document.createElement('div');
    const table = Table({
      columns: basicColumns,
      data: sampleData,
    });
    container.appendChild(table.element);
    return container;
  },
};

export const Sortable = {
  render: () => {
    const container = document.createElement('div');
    const table = Table({
      columns: basicColumns.map(c => ({ ...c, sortable: true })),
      data: sampleData,
    });
    container.appendChild(table.element);
    return container;
  },
};

export const WithPagination = {
  render: () => {
    const container = document.createElement('div');
    // Generate more data
    const data = [];
    for (let i = 1; i <= 50; i++) {
      data.push({ id: i, name: `User ${i}`, email: `user${i}@example.com`, role: i % 3 === 0 ? 'Admin' : 'User', status: i % 2 === 0 ? 'Active' : 'Inactive' });
    }
    const table = Table({
      columns: basicColumns,
      data,
      pagination: { pageSize: 10 },
    });
    container.appendChild(table.element);
    return container;
  },
};

export const WithSelection = {
  render: () => {
    const container = document.createElement('div');
    const table = Table({
      columns: basicColumns,
      data: sampleData,
      selection: { type: 'checkbox' },
      onSelect: (selected) => console.log('Selected:', selected),
    });
    container.appendChild(table.element);
    return container;
  },
};

export const WithFilter = {
  render: () => {
    const container = document.createElement('div');
    const table = Table({
      columns: basicColumns.map(c => ({ ...c, filterable: true })),
      data: sampleData,
    });
    container.appendChild(table.element);
    return container;
  },
};

export const Empty = {
  render: () => {
    const container = document.createElement('div');
    const table = Table({
      columns: basicColumns,
      data: [],
    });
    container.appendChild(table.element);
    return container;
  },
};
