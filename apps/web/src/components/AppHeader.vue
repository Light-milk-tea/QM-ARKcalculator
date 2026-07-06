<script setup lang="ts">
defineProps<{
  loading: boolean;
  loaded: boolean;
  error: string | null;
}>();
</script>

<template>
  <header class="wiki-sitebar">
    <div class="wiki-sitebar-inner">
      <div class="flex items-baseline gap-4">
        <span class="wiki-sitelogo">ARKcalculator</span>
        <nav class="hidden md:flex items-center gap-3 text-[0.85rem]">
          <RouterLink to="/" class="text-arkrec-link hover:underline">单技能计算</RouterLink>
          <RouterLink to="/leaderboard/skills" class="text-arkrec-link hover:underline">全员榜单</RouterLink>
        </nav>
      </div>
      <div class="wiki-sitestatus">
        <span v-if="loading" class="text-arkrec-link">数据加载中…</span>
        <span v-else-if="error" class="text-arkrec-danger">加载失败：{{ error }}</span>
        <span v-else-if="loaded" class="text-arkrec-success">系统就绪</span>
        <span v-else class="text-arkrec-note">未初始化</span>
      </div>
    </div>
  </header>
</template>
