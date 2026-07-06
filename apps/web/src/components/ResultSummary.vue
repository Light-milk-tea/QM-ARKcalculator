<script setup lang="ts">
import { computed } from "vue";
import type { DamageStreamResult } from "@qm/calc-core";

const props = defineProps<{
  summary: { hitDamage: number; totalDamage: number; dps: number };
  schedule: {
    attackInterval: number;
    attackCount: number;
    attackCountFromSkill: boolean;
    duration: number;
  };
  streams: DamageStreamResult[];
  healing?: {
    enabled: boolean;
    hitHealing: number;
    totalHealing: number;
    hps: number;
  };
}>();

const streamIdLabels: Record<string, string> = {
  MAIN: "主伤害流",
  OTHER_TRUE: "额外真实流",
};

function localizeStreamId(streamId: string): string {
  return streamIdLabels[streamId] ?? streamId;
}

const streamBreakdown = computed(() =>
  props.streams
    .map(
      (s) =>
        `${localizeStreamId(s.id)}(${s.hitDamage.toFixed(2)} × ${s.attackCount.toFixed(2)}) = ${s.totalDamage.toFixed(2)}`,
    )
    .join("  +  "),
);

const attackCountExpression = computed(() =>
  props.schedule.attackCountFromSkill
    ? "max(1, 技能攻击次数)"
    : `max(1, 技能持续时间 / 实际攻击间隔) = max(1, ${props.schedule.duration.toFixed(2)} / ${props.schedule.attackInterval.toFixed(2)})`,
);
</script>

<template>
  <div class="wiki-table-wrap">
    <table class="wiki-table" style="max-width: 760px;">
      <caption>摘要由计算内核直接产出,所有数值均基于当前参数设置。</caption>
      <tbody>
        <tr>
          <th style="width: 20%;">单次伤害 (DPH)</th>
          <td class="font-mono font-semibold" style="width: 30%;">
            {{ summary.hitDamage.toFixed(2) }}
          </td>
          <th style="width: 20%;">秒伤 (DPS)</th>
          <td class="font-mono font-semibold text-arkrec-link" style="width: 30%;">
            {{ summary.dps.toFixed(2) }}
          </td>
        </tr>
        <tr v-if="healing?.enabled">
          <th>单次治疗</th>
          <td class="font-mono font-semibold">
            {{ healing.hitHealing.toFixed(2) }}
          </td>
          <th>每秒治疗 (HPS)</th>
          <td class="font-mono font-semibold text-arkrec-success">
            {{ healing.hps.toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>技能总伤</th>
          <td colspan="3" class="font-mono">
            <div class="font-semibold text-[0.95rem]">
              = {{ summary.totalDamage.toFixed(2) }}
            </div>
            <div class="text-arkrec-softInk text-[0.78rem] leading-5 mt-0.5 break-all">
              = 各伤害流总和  =  {{ streamBreakdown }}
            </div>
          </td>
        </tr>
        <tr v-if="healing?.enabled">
          <th>技能总治疗</th>
          <td colspan="3" class="font-mono font-semibold">
            {{ healing.totalHealing.toFixed(2) }}
          </td>
        </tr>
        <tr>
          <th>攻击次数</th>
          <td colspan="3" class="font-mono">
            <div class="font-semibold text-[0.95rem]">
              = {{ schedule.attackCount.toFixed(4) }} 次
            </div>
            <div class="text-arkrec-softInk text-[0.78rem] leading-5 mt-0.5">
              = {{ attackCountExpression }}
            </div>
          </td>
        </tr>
        <tr>
          <th>实际攻击间隔</th>
          <td class="font-mono">
            <div>= {{ schedule.attackInterval.toFixed(2) }} s</div>
            <div class="text-arkrec-softInk text-[0.78rem] leading-5 mt-0.5">
              = max(0.1, 基础攻击间隔 × 攻速系数)
            </div>
          </td>
          <th>技能持续时间</th>
          <td class="font-mono">
            <div>= {{ schedule.duration.toFixed(2) }} s</div>
            <div class="text-arkrec-softInk text-[0.78rem] leading-5 mt-0.5">
              = max(0.1, 技能持续秒数)
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
