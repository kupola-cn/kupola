/**
 * @file Form components stories (Select, Input, Checkbox).
 */
import { Select } from '../packages/core/src/components/select.js';
import { Input } from '../packages/core/src/components/input.js';
import { Checkbox } from '../packages/core/src/components/checkbox.js';
import '../packages/css/index.css';

export default {
  title: 'Form/Select & Input',
  tags: ['autodocs'],
};

export const SelectBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '300px';

    const select = Select({
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
        { label: 'Durian', value: 'durian' },
        { label: 'Elderberry', value: 'elderberry' },
      ],
      placeholder: 'Choose a fruit',
      onChange: (val) => console.log('Selected:', val),
    });

    container.appendChild(select.element);
    return container;
  },
};

export const SelectWithLabel = {
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '300px';

    const select = Select({
      label: 'Country',
      options: [
        { label: 'China', value: 'cn' },
        { label: 'Japan', value: 'jp' },
        { label: 'United States', value: 'us' },
        { label: 'Germany', value: 'de' },
      ],
      onChange: (val) => console.log('Country:', val),
    });

    container.appendChild(select.element);
    return container;
  },
};

export const SelectSearchable = {
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '300px';

    const items = [];
    const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    names.forEach(n => items.push({ label: n, value: n.toLowerCase() }));

    const select = Select({
      label: 'Search User',
      options: items,
      searchable: true,
      placeholder: 'Type to search...',
      onChange: (val) => console.log('User:', val),
    });

    container.appendChild(select.element);
    return container;
  },
};

export const InputBasic = {
  argTypes: {
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
  },
  args: { placeholder: 'Enter text...', type: 'text' },
  render: (args) => {
    const container = document.createElement('div');
    container.style.maxWidth = '300px';
    container.style.display = 'grid';
    container.style.gap = '12px';

    const input = Input({
      placeholder: args.placeholder,
      type: args.type,
      onChange: (val) => console.log('Value:', val),
    });
    container.appendChild(input.element);

    return container;
  },
};

export const InputWithLabel = {
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '300px';
    container.style.display = 'grid';
    container.style.gap = '12px';

    const nameInput = Input({ label: 'Full Name', placeholder: 'John Doe' });
    const emailInput = Input({ label: 'Email', type: 'email', placeholder: 'john@example.com' });

    container.appendChild(nameInput.element);
    container.appendChild(emailInput.element);
    return container;
  },
};

export const CheckboxBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '8px';

    const cb1 = Checkbox({ label: 'Accept terms and conditions' });
    const cb2 = Checkbox({ label: 'Subscribe to newsletter', checked: true });
    const cb3 = Checkbox({ label: 'Disabled option', disabled: true });

    container.appendChild(cb1.element);
    container.appendChild(cb2.element);
    container.appendChild(cb3.element);
    return container;
  },
};
