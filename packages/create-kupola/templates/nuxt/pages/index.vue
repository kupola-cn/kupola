<template>
  <main>
    <h1>Welcome to {{PROJECT_NAME}}</h1>
    <p>
      Built with <strong>Kupola 2.0</strong> + <strong>Nuxt 3</strong> — hybrid SSR + declarative directives.
    </p>

    <!-- Theme toggle (Vue reactive) -->
    <button class="btn" style="position: fixed; top: 16px; right: 16px" @click="toggleTheme">
      Toggle Theme
    </button>

    <!-- Kupola directives (client-side) -->
    <KupolaCounter />
  </main>
</template>

<script setup>
function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  localStorage.setItem('kupola-theme', next);
}
</script>
