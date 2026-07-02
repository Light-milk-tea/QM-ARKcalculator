<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    defaultOpen?: boolean;
  }>(),
  { defaultOpen: false },
);

const open = ref(props.defaultOpen);

watch(
  () => props.defaultOpen,
  (value) => {
    open.value = value;
  },
);
</script>

<template>
  <section class="wiki-collapse">
    <button
      type="button"
      class="wiki-collapse-header"
      :aria-expanded="open"
      @click="open = !open"
    >
      <h2 class="wiki-section wiki-section--collapse">
        <span>{{ title }}</span>
      </h2>
      <span class="wiki-disclosure-indicator" aria-hidden="true">
        {{ open ? "−" : "+" }}
      </span>
    </button>
    <div v-show="open" class="wiki-collapse-body">
      <slot />
    </div>
  </section>
</template>
