import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kupola 3.0',
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
            { text: '书写风格', link: '/guide/authoring-style' },
            { text: '场景 Recipes', link: '/guide/recipes' },
            { text: '后端模板集成', link: '/guide/backend-template' },
            { text: '项目结构', link: '/guide/project-structure' },
            { text: '生命周期', link: '/guide/lifecycle' },
            { text: '核心概念', link: '/guide/core-concepts' },
            { text: '国际化', link: '/guide/i18n' },
            { text: '指令系统', link: '/guide/directives' },
            { text: '指令能力矩阵', link: '/guide/directive-matrix' },
            { text: '表单状态策略', link: '/guide/form-state' },
            { text: '动态片段协议', link: '/guide/dynamic-fragments' },
            { text: '诊断信息', link: '/guide/diagnostics' },
            { text: '安全边界', link: '/guide/security' },
            { text: '安全策略接入', link: '/guide/security-policy' },
            { text: '性能边界', link: '/guide/performance' },
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
          text: '组件总览',
          items: [
            { text: '概览', link: '/components/overview' },
            { text: '组件规范', link: '/components/standards' },
            { text: '覆盖层', link: '/components/overlay' },
            { text: '导航', link: '/components/navigation' },
            { text: '表单', link: '/components/forms' },
            { text: '反馈', link: '/components/feedback' },
            { text: '展示', link: '/components/display' },
            { text: '交互', link: '/components/interaction' },
            { text: '工具', link: '/components/tools' },
          ],
        },
        {
          text: '覆盖层',
          items: [
            { text: 'Modal', link: '/components/modal' },
            { text: 'Dropdown', link: '/components/dropdown' },
            { text: 'Drawer', link: '/components/drawer' },
            { text: 'Dialog', link: '/components/dialog' },
            { text: 'Notification', link: '/components/notification' },
            { text: 'Tooltip', link: '/components/tooltip' },
          ],
        },
        {
          text: '导航',
          items: [
            { text: 'Tabs', link: '/components/tabs' },
            { text: 'Pagination', link: '/components/pagination' },
            { text: 'Datepicker', link: '/components/datepicker' },
            { text: 'Breadcrumb', link: '/components/breadcrumb' },
            { text: 'Menu', link: '/components/menu' },
            { text: 'Calendar', link: '/components/calendar' },
          ],
        },
        {
          text: '表单',
          items: [
            { text: 'Form', link: '/components/form' },
            { text: 'Input', link: '/components/input' },
            { text: 'Select', link: '/components/select' },
            { text: 'Checkbox', link: '/components/checkbox' },
            { text: 'Radio', link: '/components/radio' },
            { text: 'Switch', link: '/components/switch' },
            { text: 'Slider', link: '/components/slider' },
            { text: 'NumberInput', link: '/components/numberinput' },
            { text: 'Textarea', link: '/components/textarea' },
            { text: 'Timepicker', link: '/components/timepicker' },
            { text: 'Validation', link: '/components/validation' },
          ],
        },
        {
          text: '反馈',
          items: [
            { text: 'Alert', link: '/components/alert' },
            { text: 'Progress', link: '/components/progress' },
            { text: 'Skeleton', link: '/components/skeleton' },
            { text: 'Spin', link: '/components/spin' },
            { text: 'Empty', link: '/components/empty' },
            { text: 'Countdown', link: '/components/countdown' },
          ],
        },
        {
          text: '展示',
          items: [
            { text: 'Tag', link: '/components/tag' },
            { text: 'Badge', link: '/components/badge' },
            { text: 'Divider', link: '/components/divider' },
            { text: 'Collapse', link: '/components/collapse' },
            { text: 'Timeline', link: '/components/timeline' },
            { text: 'Kbd', link: '/components/kbd' },
            { text: 'Avatar', link: '/components/avatar' },
            { text: 'Statcard', link: '/components/statcard' },
            { text: 'Tree', link: '/components/tree' },
            { text: 'Carousel', link: '/components/carousel' },
          ],
        },
        {
          text: '交互',
          items: [
            { text: 'FileUpload', link: '/components/fileupload' },
            { text: 'DynamicTags', link: '/components/dynamictags' },
            { text: 'ImagePreview', link: '/components/imagepreview' },
            { text: 'ColorPicker', link: '/components/colorpicker' },
            { text: 'VirtualList', link: '/components/virtuallist' },
          ],
        },
        {
          text: '工具',
          items: [
            { text: 'Icons', link: '/components/icons' },
            { text: 'Message', link: '/components/message' },
            { text: 'Heatmap', link: '/components/heatmap' },
            { text: 'Table', link: '/components/table' },
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
