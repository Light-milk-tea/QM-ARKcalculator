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

const attackTypeLabels: Record<string, string> = {
  physical: "物理",
  magical: "法术",
  true: "真实",
  heal: "治疗",
  none: "无伤害",
};

function localizeAttackType(type: string): string {
  return attackTypeLabels[type] ?? type;
}
</script>

<template>
  <div class="wiki-table-wrap">
    <table class="wiki-table wiki-table--zebra">
      <thead>
        <tr>
          <th style="width: 18%;">干员</th>
          <th style="width: 24%;">技能</th>
          <th>类型</th>
          <template v-if="mode === 'damage'">
            <th class="font-mono">单次伤害</th>
            <th class="font-mono">总伤</th>
            <th class="font-mono">DPS</th>
          </template>
          <template v-else>
            <th class="font-mono">单次治疗</th>
            <th class="font-mono">总治疗</th>
            <th class="font-mono">HPS</th>
          </template>
          <th class="font-mono">警告数</th>
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
          <td>{{ localizeAttackType(item.attackType) }}</td>
          <template v-if="mode === 'damage'">
            <td class="font-mono">{{ item.result.summary.hitDamage.toFixed(2) }}</td>
            <td class="font-mono">{{ item.result.summary.totalDamage.toFixed(2) }}</td>
            <td class="font-mono">{{ item.result.summary.dps.toFixed(2) }}</td>
          </template>
          <template v-else>
            <td class="font-mono">
              {{ item.result.healing.enabled ? item.result.healing.hitHealing.toFixed(2) : "-" }}
            </td>
            <td class="font-mono">
              {{ item.result.healing.enabled ? item.result.healing.totalHealing.toFixed(2) : "-" }}
            </td>
            <td class="font-mono">
              {{ item.result.healing.enabled ? item.result.healing.hps.toFixed(2) : "-" }}
            </td>
          </template>
          <td class="font-mono">{{ item.result.warnings.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="rows.length === 0" class="wiki-callout mt-3">
    当前筛选条件下无数据。
  </div>
</template>
