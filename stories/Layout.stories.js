/**
 * @file Layout components stories for Storybook.
 */
import { Divider } from '../packages/components/src/components/divider.js';
import { Collapse } from '../packages/components/src/components/collapse.js';
import { Empty } from '../packages/components/src/components/empty.js';
import { Avatar } from '../packages/components/src/components/avatar.js';
import { Spin } from '../packages/components/src/components/spin.js';
import { Skeleton } from '../packages/components/src/components/skeleton.js';
import '../packages/css/index.css';

export default {
  title: 'Layout',
  tags: ['autodocs'],
};

export const DividerBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '16px';

    const content1 = document.createElement('p');
    content1.textContent = 'Above divider';
    container.appendChild(content1);

    const divider1 = Divider({});
    container.appendChild(divider1.element);

    const content2 = document.createElement('p');
    content2.textContent = 'Below divider';
    container.appendChild(content2);

    const divider2 = Divider({ dashed: true });
    container.appendChild(divider2.element);

    const content3 = document.createElement('p');
    content3.textContent = 'Dashed divider';
    container.appendChild(content3);

    const divider3 = Divider({ orientation: 'vertical' });
    const horizontal = document.createElement('div');
    horizontal.style.display = 'flex';
    horizontal.style.alignItems = 'center';
    horizontal.style.gap = '16px';
    horizontal.appendChild(document.createTextNode('Left'));
    horizontal.appendChild(divider3.element);
    horizontal.appendChild(document.createTextNode('Right'));
    container.appendChild(horizontal);

    return container;
  },
};

export const CollapseBasic = {
  render: () => {
    const container = document.createElement('div');

    const collapse = Collapse({
      items: [
        { key: 'panel1', title: 'Panel 1', content: 'Content for panel 1' },
        { key: 'panel2', title: 'Panel 2', content: 'Content for panel 2' },
        { key: 'panel3', title: 'Panel 3', content: 'Content for panel 3' },
      ],
      activeKey: 'panel1',
      onChange: (key) => console.log('Collapse changed:', key),
    });

    container.appendChild(collapse.element);
    return container;
  },
};

export const CollapseAccordion = {
  render: () => {
    const container = document.createElement('div');

    const collapse = Collapse({
      accordion: true,
      items: [
        { key: 'a', title: 'Section A', content: 'Only one panel can be open at a time.' },
        { key: 'b', title: 'Section B', content: 'This is the accordion mode.' },
        { key: 'c', title: 'Section C', content: 'Useful for FAQ sections.' },
      ],
    });

    container.appendChild(collapse.element);
    return container;
  },
};

export const EmptyBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '400px';

    const empty = Empty({
      description: 'No data available',
    });

    container.appendChild(empty.element);
    return container;
  },
};

export const EmptyWithImage = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '400px';

    const empty = Empty({
      image: 'https://via.placeholder.com/120',
      description: 'Your cart is empty',
      action: {
        text: 'Go Shopping',
        onClick: () => console.log('Go shopping clicked'),
      },
    });

    container.appendChild(empty.element);
    return container;
  },
};

export const AvatarBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '12px';
    container.style.alignItems = 'center';

    const sizes = ['sm', 'md', 'lg', 'xl'];
    sizes.forEach((size) => {
      const avatar = Avatar({
        size,
        icon: 'user',
      });
      container.appendChild(avatar.element);
    });

    return container;
  },
};

export const AvatarWithText = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '12px';
    container.style.alignItems = 'center';

    const avatar1 = Avatar({ text: 'AB' });
    const avatar2 = Avatar({ text: 'CD', type: 'success' });
    const avatar3 = Avatar({ text: 'EF', type: 'warning' });
    const avatar4 = Avatar({ text: 'GH', type: 'danger' });

    [avatar1, avatar2, avatar3, avatar4].forEach((av) => container.appendChild(av.element));

    return container;
  },
};

export const SpinBasic = {
  argTypes: {
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    text: { control: 'text' },
  },
  args: {
    size: 'md',
    text: 'Loading...',
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = '16px';

    const spin = Spin({
      size: args.size,
      text: args.text,
    });
    container.appendChild(spin.element);

    return container;
  },
};

export const SpinInsideContainer = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '200px';
    container.style.border = '1px solid #e8e8e8';
    container.style.position = 'relative';

    const spin = Spin({ size: 'lg', text: 'Loading content...', fullscreen: false });
    container.appendChild(spin.element);

    return container;
  },
};

export const SkeletonBasic = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '400px';

    const skeleton = Skeleton({
      rows: 4,
    });

    container.appendChild(skeleton.element);
    return container;
  },
};

export const SkeletonWithAvatar = {
  render: () => {
    const container = document.createElement('div');

    const skeleton = Skeleton({
      avatar: true,
      title: true,
      rows: 3,
    });

    container.appendChild(skeleton.element);
    return container;
  },
};
