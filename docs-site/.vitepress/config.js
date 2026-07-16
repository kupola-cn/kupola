import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kupola',
  description: '现代模块化 UI 组件库',
  lang: 'zh-CN',
  base: '/kupola/',
  
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'AI Adapter', link: '/ai-adapter/introduction' },
      { text: '组件', link: '/components/overview' },
      { text: '插件', link: '/plugins/vite' },
      { text: '扩展', link: '/extensions/vscode' },
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
            { text: '模板', link: '/guide/templates' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],
      '/ai-adapter/': [
        {
          text: 'AI Adapter',
          items: [
            { text: '简介', link: '/ai-adapter/introduction' },
            { text: '三引擎架构', link: '/ai-adapter/engines' },
            { text: '意图解析', link: '/ai-adapter/intent-parser' },
            { text: '中间件', link: '/ai-adapter/middleware' },
            { text: 'Kupola 集成', link: '/ai-adapter/kupola-integration' },
            { text: 'API 参考', link: '/ai-adapter/api' },
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
      '/plugins/': [
        {
          text: '插件',
          items: [
            { text: 'Vite 插件', link: '/plugins/vite' },
            { text: 'Webpack 插件', link: '/plugins/webpack' },
            { text: 'ESLint 插件', link: '/plugins/eslint' },
          ],
        },
      ],
      '/extensions/': [
        {
          text: '扩展',
          items: [
            { text: 'VS Code 扩展', link: '/extensions/vscode' },
            { text: 'AI Agent 技能', link: '/extensions/skill' },
          ],
        },
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kupola-cn/kupola' },
    ],
  },
})
