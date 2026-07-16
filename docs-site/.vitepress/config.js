import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kupola',
  description: '现代模块化 UI 组件库',
  lang: 'zh-CN',
  base: '/kupola/',
  
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/overview' },
      { text: 'FAQ', link: '/guide/faq' },
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心概念', link: '/guide/core-concepts' },
            { text: '指令系统', link: '/guide/directives' },
            { text: 'SSR', link: '/guide/ssr' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/components/': [
        {
          text: '组件',
          items: [
            { text: '概览', link: '/components/overview' },
            { text: 'Modal', link: '/components/modal' },
            { text: 'Table', link: '/components/table' },
            { text: 'Form', link: '/components/form' },
          ],
        },
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kupola-cn/kupola' },
    ],
  },
})
