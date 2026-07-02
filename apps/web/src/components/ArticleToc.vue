<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

type Section = { id: string; label: string };

const props = defineProps<{
  sections: Section[];
}>();

const activeId = ref<string>(props.sections[0]?.id ?? "");

function handleScroll() {
  if (typeof window === "undefined") return;
  const offset = 80;
  let current = activeId.value;
  for (const section of props.sections) {
    const el = document.getElementById(section.id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top - offset <= 0) {
      current = section.id;
    }
  }
  if (current !== activeId.value) {
    activeId.value = current;
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav class="wiki-toc" aria-label="目录">
    <div class="wiki-toc-title">本页目录</div>
    <ul class="wiki-toc-list">
      <li v-for="s in sections" :key="s.id">
        <a
          :href="`#${s.id}`"
          class="wiki-toc-link"
          :class="{ 'wiki-toc-link--active': activeId === s.id }"
        >
          {{ s.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>
