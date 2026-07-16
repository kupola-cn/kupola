// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  css: [
    '@kupola/kupola/css',
    '~/assets/css/main.css',
  ],

  app: {
    head: {
      htmlAttrs: { 'data-theme': 'dark' },
      script: [
        {
          // Anti-FOUC: blocking theme preload
          innerHTML: `(function(){var t=localStorage.getItem('kupola-theme')||'dark';document.documentElement.dataset.theme=t;})()`,
        },
      ],
    },
  },
});
