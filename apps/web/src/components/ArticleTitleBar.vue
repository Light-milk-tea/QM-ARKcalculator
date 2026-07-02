<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <header>
    <h1 class="wiki-titlebar">{{ title }}</h1>
  </header>
</template>
