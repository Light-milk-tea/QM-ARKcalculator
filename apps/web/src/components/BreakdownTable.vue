<script setup lang="ts">
import type { BreakdownItem } from "@qm/calc-core";

defineProps<{
  breakdown: BreakdownItem[];
}>();
</script>

<template>
  <p class="wiki-paragraph">
    公式分解以键值对形式给出核心中间量,便于与游戏内日志或第三方计算器交叉核对。
  </p>
  <div class="wiki-table-wrap">
    <table class="wiki-table wiki-table--zebra">
      <thead>
        <tr>
          <th style="width: 22%;">字段</th>
          <th style="width: 22%;">值</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in breakdown" :key="item.key">
          <td class="font-mono">{{ item.key }}</td>
          <td class="font-mono">{{ typeof item.value === "number" ? item.value.toFixed(4) : item.value }}</td>
          <td>{{ item.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
