/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0C0C0D' },
      ],
    },
  },
  decorators: [
    (story, context) => {
      // Auto-apply theme based on background selection
      const bg = context.globals.backgrounds?.value;
      document.documentElement.dataset.theme = bg === '#0C0C0D' ? 'dark' : 'light';
      return story();
    },
  ],
};

export default preview;
