<script setup lang="ts">
import type { LeaderboardRow } from "../stores/useLeaderboardStore";
import CalculationDetailSections from "./CalculationDetailSections.vue";

defineProps<{
  open: boolean;
  row: LeaderboardRow | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <div v-if="open && row" class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
    <aside class="absolute right-0 top-0 h-full w-full max-w-[760px] overflow-y-auto bg-arkrec-panel p-4 shadow-xl">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">{{ row.operatorName }} - {{ row.skillName }}</h3>
          <p class="text-[0.82rem] text-arkrec-note">{{ row.operatorId }} / {{ row.skillId }}</p>
        </div>
        <button type="button" class="wiki-input !w-auto px-3 py-1 cursor-pointer" @click="emit('close')">
          关闭
        </button>
      </div>
      <CalculationDetailSections :result="row.result" :collapsible-rules="false" />
    </aside>
  </div>
</template>
