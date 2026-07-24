/**
 * @file Form elements stories for Storybook.
 */
import { Input } from '../packages/components/src/components/input.js';
import { Textarea } from '../packages/components/src/components/textarea.js';
import { Select } from '../packages/components/src/components/select.js';
import { Checkbox } from '../packages/components/src/components/checkbox.js';
import { Radio } from '../packages/components/src/components/radio.js';
import { Switch } from '../packages/components/src/components/switch.js';
import { NumberInput } from '../packages/components/src/components/numberinput.js';
import '../packages/css/index.css';

export default {
  title: 'Form/Elements',
  tags: ['autodocs'],
};

export const InputBasic = {
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
  },
  args: {
    placeholder: 'Enter text...',
    disabled: false,
    error: false,
    size: 'md',
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '16px';

    const input = Input({
      placeholder: args.placeholder,
      disabled: args.disabled,
      error: args.error,
      size: args.size,
      onChange: (val) => console.log('Input changed:', val),
    });
    container.appendChild(input.element);

    return container;
  },
};

export const InputWithPrefixSuffix = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '16px';

    const withPrefix = Input({
      placeholder: 'Search...',
      prefix: '🔍',
    });
    container.appendChild(withPrefix.element);

    const withSuffix = Input({
      placeholder: 'Amount',
      suffix: '¥',
    });
    container.appendChild(withSuffix.element);

    return container;
  },
};

export const TextareaBasic = {
  argTypes: {
    placeholder: { control: 'text' },
    rows: { control: 'number', min: 2, max: 10 },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'Enter your message...',
    rows: 4,
    disabled: false,
  },
  render: (args) => {
    const container = document.createElement('div');
    const textarea = Textarea({
      placeholder: args.placeholder,
      rows: args.rows,
      disabled: args.disabled,
    });
    container.appendChild(textarea.element);
    return container;
  },
};

export const SelectBasic = {
  argTypes: {
    disabled: { control: 'boolean' },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
  },
  args: {
    disabled: false,
    size: 'md',
  },
  render: (args) => {
    const container = document.createElement('div');
    const select = Select({
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
      placeholder: 'Select an option',
      disabled: args.disabled,
      size: args.size,
      onChange: (val) => console.log('Selected:', val),
    });
    container.appendChild(select.element);
    return container;
  },
};

export const SelectMultiple = {
  render: () => {
    const container = document.createElement('div');
    const select = Select({
      options: [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry' },
        { value: 'd', label: 'Date' },
      ],
      placeholder: 'Select fruits',
      multiple: true,
      onChange: (vals) => console.log('Selected:', vals),
    });
    container.appendChild(select.element);
    return container;
  },
};

export const CheckboxGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '12px';

    const fruits = ['Apple', 'Banana', 'Cherry', 'Date'];
    fruits.forEach((fruit, index) => {
      const checkbox = Checkbox({
        label: fruit,
        checked: index < 2,
        onChange: (checked) => console.log(`${fruit}:`, checked),
      });
      container.appendChild(checkbox.element);
    });

    return container;
  },
};

export const RadioGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '12px';

    const options = ['Red', 'Green', 'Blue'];
    options.forEach((opt) => {
      const radio = Radio({
        name: 'color',
        value: opt.toLowerCase(),
        label: opt,
        checked: opt === 'Green',
        onChange: (val) => console.log('Color:', val),
      });
      container.appendChild(radio.element);
    });

    return container;
  },
};

export const SwitchToggle = {
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    checked: false,
    disabled: false,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '12px';

    const label = document.createElement('span');
    label.textContent = 'Enable feature';
    container.appendChild(label);

    const toggle = Switch({
      checked: args.checked,
      disabled: args.disabled,
      onChange: (val) => console.log('Switch:', val),
    });
    container.appendChild(toggle.element);

    return container;
  },
};

export const NumberInputBasic = {
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
  },
  render: (args) => {
    const container = document.createElement('div');
    const input = NumberInput({
      min: args.min,
      max: args.max,
      step: args.step,
      defaultValue: 50,
      onChange: (val) => console.log('Number:', val),
    });
    container.appendChild(input.element);
    return container;
  },
};
