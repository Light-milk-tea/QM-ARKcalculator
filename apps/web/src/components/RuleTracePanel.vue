<script setup lang="ts">
import type { CalculationWarning, RuleTrace } from "@qm/calc-core";

defineProps<{
  ruleTrace: RuleTrace[];
  warnings: CalculationWarning[];
}>();
</script>

<template>
  <h3 class="wiki-subsection">规则追踪 (Rule Trace)</h3>
  <div class="wiki-callout">
    <ul class="wiki-list-tight">
      <li v-for="trace in ruleTrace" :key="trace.ruleId" class="flex flex-wrap items-baseline gap-2">
        <span
          class="wiki-tag"
          :class="trace.applied ? 'text-arkrec-success border-arkrec-success' : 'text-arkrec-note'"
        >
          {{ trace.applied ? "已应用" : "已跳过" }}
        </span>
        <span class="font-mono text-[0.9rem]">{{ trace.ruleId }}</span>
        <span v-if="trace.note" class="text-arkrec-softInk text-[0.85rem]">— {{ trace.note }}</span>
      </li>
    </ul>
  </div>

  <h3 class="wiki-subsection">系统警告 (Warnings)</h3>
  <div v-if="warnings.length > 0" class="wiki-callout wiki-callout-danger">
    <ul class="wiki-list-tight">
      <li v-for="item in warnings" :key="`${item.code}-${item.source ?? 'none'}`" class="flex flex-wrap items-baseline gap-2">
        <span class="wiki-tag text-arkrec-danger border-arkrec-danger">{{ item.level }} · {{ item.code }}</span>
        <span>{{ item.message }}</span>
        <span v-if="item.source" class="text-arkrec-note text-[0.82rem]">({{ item.source }})</span>
      </li>
    </ul>
  </div>
  <div v-else class="wiki-callout wiki-callout-success">
    ✓ 暂无异常数据,规则覆盖良好。
  </div>
</template>
