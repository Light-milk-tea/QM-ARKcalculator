<script setup lang="ts">
import type { DamageStreamResult } from "@qm/calc-core";

defineProps<{
  streams: DamageStreamResult[];
}>();
</script>

<template>
  <p class="wiki-paragraph">
    伤害流区分主伤害流 (MAIN) 与其他真实伤害流 (OTHER_TRUE),分别统计单次伤害、攻击次数与总伤。
  </p>
  <div class="wiki-table-wrap">
    <table class="wiki-table wiki-table--zebra">
      <thead>
        <tr>
          <th style="width: 18%;">流 ID</th>
          <th style="width: 18%;">类型</th>
          <th>单次伤害</th>
          <th>次数</th>
          <th>总伤</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stream in streams" :key="stream.id">
          <td class="font-mono">{{ stream.id }}</td>
          <td>{{ stream.attackType }}</td>
          <td class="font-mono">{{ stream.hitDamage.toFixed(2) }}</td>
          <td class="font-mono">{{ stream.attackCount.toFixed(2) }}</td>
          <td class="font-mono font-semibold">{{ stream.totalDamage.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
