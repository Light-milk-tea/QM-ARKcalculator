<script setup lang="ts">
import type { DamageStreamResult } from "@qm/calc-core";

defineProps<{
  streams: DamageStreamResult[];
}>();

const streamIdLabels: Record<string, string> = {
  MAIN: "主伤害流",
  OTHER_TRUE: "额外真实流",
  OTHER_PHYSICAL: "额外物理流",
  OTHER_MAGICAL: "额外法术流",
};

const attackTypeLabels: Record<string, string> = {
  physical: "物理",
  magical: "法术",
  true: "真实",
  heal: "治疗",
  none: "无伤害",
};

function localizeStreamId(id: string): string {
  return streamIdLabels[id] ?? id;
}

function localizeAttackType(type: string): string {
  return attackTypeLabels[type] ?? type;
}
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
          <td>{{ localizeStreamId(stream.id) }}</td>
          <td>{{ localizeAttackType(stream.attackType) }}</td>
          <td class="font-mono">{{ stream.hitDamage.toFixed(2) }}</td>
          <td class="font-mono">{{ stream.attackCount.toFixed(2) }}</td>
          <td class="font-mono font-semibold">{{ stream.totalDamage.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
