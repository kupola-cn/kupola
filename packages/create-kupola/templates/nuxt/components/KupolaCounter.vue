<template>
  <!-- Kupola k-* directives rendered client-only -->
  <ClientOnly>
    <section class="section" v-html="counterHTML" ref="sectionRef" />
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { walk } from '@kupola/platform/directives';

const sectionRef = ref(null);

const counterHTML = `
  <h2>Counter</h2>
  <div k-data="{ count: 0 }">
    <p>Count: <strong k-text="count"></strong></p>
    <button class="btn btn-primary" k-on:click="count++">+1</button>
    <button class="btn" k-on:click="count--">-1</button>
    <button class="btn" k-on:click="count = 0">Reset</button>
  </div>
`;

onMounted(() => {
  // Initialize Kupola directives after client hydration
  if (sectionRef.value) {
    walk(sectionRef.value);
  }
});
</script>
