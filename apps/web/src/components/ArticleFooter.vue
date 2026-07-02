<script setup lang="ts">
defineProps<{
  ruleVersion?: string;
  dataVersion?: string;
}>();
</script>

<template>
  <footer class="wiki-footnotes">
    <span>本词条由 ARKcalculator 自动生成。</span>
    <span class="text-arkrec-note">·</span>
    <span v-if="dataVersion">
      数据版本：<a href="#">{{ dataVersion }}</a>
    </span>
    <span v-if="ruleVersion">
      规则版本：<a href="#">{{ ruleVersion }}</a>
    </span>
    <span class="text-arkrec-note">·</span>
    <a href="#">引用规范</a>
    <span class="text-arkrec-note">·</span>
    <a href="#">编辑历史</a>
  </footer>
</template>
