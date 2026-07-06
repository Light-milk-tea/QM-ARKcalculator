<script setup lang="ts">
import type { LeaderboardRow } from "../stores/useLeaderboardStore";

defineProps<{
  rows: LeaderboardRow[];
  mode: "damage" | "healing";
  selectedSkillId: string;
}>();

const emit = defineEmits<{
  (e: "select", value: LeaderboardRow): void;
}>();
</script>

<template>
  <div class="wiki-table-wrap">
    <table class="wiki-table wiki-table--zebra">
      <thead>
        <tr>
          <th style="width: 18%;">干员</th>
          <th style="width: 24%;">技能</th>
          <th>类型</th>
          <th class="font-mono">单次伤害</th>
          <th class="font-mono">总伤</th>
          <th class="font-mono">DPS</th>
          <th class="font-mono">HPS</th>
          <th class="font-mono">总治疗</th>
          <th class="font-mono">Warnings</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in rows"
          :key="`${item.operatorId}-${item.skillId}`"
          :class="item.skillId === selectedSkillId ? 'bg-arkrec-sub' : ''"
          class="cursor-pointer"
          @click="emit('select', item)"
        >
          <td>{{ item.operatorName }}</td>
          <td>{{ item.skillName }}</td>
          <td>{{ item.attackType }}</td>
          <td class="font-mono">{{ item.result.summary.hitDamage.toFixed(2) }}</td>
          <td class="font-mono">{{ item.result.summary.totalDamage.toFixed(2) }}</td>
          <td class="font-mono">{{ item.result.summary.dps.toFixed(2) }}</td>
          <td class="font-mono">
            {{ item.result.healing.enabled ? item.result.healing.hps.toFixed(2) : "-" }}
          </td>
          <td class="font-mono">
            {{ item.result.healing.enabled ? item.result.healing.totalHealing.toFixed(2) : "-" }}
          </td>
          <td class="font-mono">{{ item.result.warnings.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="rows.length === 0" class="wiki-callout mt-3">
    当前筛选条件下无数据。
  </div>
</template>
