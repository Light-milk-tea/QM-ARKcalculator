<script setup lang="ts">
import { computed, ref } from "vue";
import type { CalculationFormula, DamageStreamResult, BreakdownItem } from "@qm/calc-core";
import StreamsTable from "./StreamsTable.vue";
import BreakdownTable from "./BreakdownTable.vue";

const props = defineProps<{
  formula: CalculationFormula;
  summary: { hitDamage: number; totalDamage: number; dps: number };
  schedule: { attackInterval: number; attackCount: number; duration: number };
  streams: DamageStreamResult[];
  breakdown: BreakdownItem[];
  healing?: {
    enabled: boolean;
    hitHealing: number;
    totalHealing: number;
    hps: number;
  };
}>();

const showDetails = ref(false);

const dpsEquation = computed(
  () =>
    `DPS = 总伤 / 持续时间 = ${props.summary.totalDamage.toFixed(2)} / ${props.schedule.duration.toFixed(2)} = ${props.summary.dps.toFixed(2)}`,
);

const hpsEquation = computed(() => {
  if (!props.healing?.enabled) return "";
  return `HPS = 总治疗 / 持续时间 = ${props.healing.totalHealing.toFixed(2)} / ${props.schedule.duration.toFixed(2)} = ${props.healing.hps.toFixed(2)}`;
});

function toNumber(value: number | string | undefined): number | null {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

function toFixedSafe(value: number | string | undefined, digits = 2): string {
  const numeric = toNumber(value);
  return numeric === null ? "-" : numeric.toFixed(digits);
}

function describe(
  step: { key: string; value: number | string; inputs?: Record<string, number | string> },
): string {
  const inputs = step.inputs ?? {};
  switch (step.key) {
    case "baseAttack":
      return `取干员面板攻击力：${toFixedSafe(step.value)}`;
    case "attack":
      return `攻击加成后攻击力 = ${toFixedSafe(inputs.baseAttack)} × (1 + ${toFixedSafe(inputs.atkBuffRatio, 4)}) = ${toFixedSafe(step.value)}`;
    case "scaledAttack":
      return `倍率结算后攻击力 = ${toFixedSafe(inputs.attack)} × ${toFixedSafe(inputs.attackScale, 4)} × ${toFixedSafe(inputs.damageScale, 4)} = ${toFixedSafe(step.value)}`;
    case "defenseAfterShred":
      return `目标有效防御 = max(${toFixedSafe(inputs.enemyDefense)} × (1 - ${toFixedSafe(inputs.defShredRate, 4)}) - ${toFixedSafe(inputs.defShredFlat)}, 0) = ${toFixedSafe(step.value)}`;
    case "rawPhysicalDamage":
      return `物理原始伤害 = ${toFixedSafe(inputs.scaledAttack)} - ${toFixedSafe(inputs.defenseAfterShred)} = ${toFixedSafe(step.value)}`;
    case "minimumPhysicalDamage":
      return `物理保底伤害 = ${toFixedSafe(inputs.scaledAttack)} × ${toFixedSafe(inputs.minPhysicalDamageRatio, 4)} = ${toFixedSafe(step.value)}`;
    case "clampedMagicResistance":
      return `目标生效法抗（0~95）= ${toFixedSafe(step.value)}`;
    case "magicMultiplier":
      return `法术伤害系数 = 1 - ${toFixedSafe(inputs.mr, 4)} / 100 = ${toFixedSafe(step.value, 4)}`;
    case "hitDamage":
      return `单次伤害结果 = ${toFixedSafe(step.value)}`;
    case "baseAttackInterval":
      return `取干员基础攻击间隔：${toFixedSafe(step.value, 4)} 秒`;
    case "aspdFactor":
      return `攻速换算系数 = 100 / (100 + ${toFixedSafe(inputs.attackSpeedBonus)}) = ${toFixedSafe(step.value, 4)}`;
    case "attackInterval":
      return `实际攻击间隔 = max(0.1, ${toFixedSafe(inputs.baseAttackInterval, 4)} × ${toFixedSafe(inputs.aspdFactor, 4)}) = ${toFixedSafe(step.value, 4)} 秒`;
    case "attackCount":
      return `攻击次数 = ${toFixedSafe(step.value, 4)} 次`;
    case "duration":
      return `技能持续时间 = ${toFixedSafe(step.value, 4)} 秒`;
    case "streamTotal":
      return `总伤害 = 各伤害流总和 = ${toFixedSafe(step.value)}`;
    case "dps":
      return `DPS = ${toFixedSafe(inputs.totalDamage)} / ${toFixedSafe(inputs.duration, 4)} = ${toFixedSafe(step.value)}`;
    default:
      return typeof step.value === "number" ? step.value.toFixed(4) : String(step.value);
  }
}
</script>

<template>
  <p class="wiki-paragraph">
    本节展示从面板属性到最终 DPS 的完整推导过程,展开后可逐行核对计算内核的中间值。
  </p>

  <button
    type="button"
    class="wiki-input !w-auto inline-block px-3 py-1.5 bg-arkrec-panel hover:bg-arkrec-sub text-[0.88rem] cursor-pointer"
    @click="showDetails = !showDetails"
  >
    {{ showDetails ? "收起公式过程" : "展开公式过程" }}
  </button>

  <div v-if="showDetails" class="mt-4 space-y-6">
    <div class="wiki-formula-equation">{{ dpsEquation }}</div>
    <div v-if="healing?.enabled" class="wiki-formula-equation">{{ hpsEquation }}</div>

    <section>
      <h4 class="wiki-minor">步骤 1：单次伤害推导</h4>
      <div class="wiki-table-wrap">
        <table class="wiki-table wiki-table--zebra">
          <thead>
            <tr>
              <th style="width: 22%;">步骤</th>
              <th>中文说明</th>
              <th style="width: 18%;">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in formula.mainHit" :key="item.key">
              <td>{{ item.label }}</td>
              <td>{{ describe(item) }}</td>
              <td class="font-mono text-[0.88rem]">
                {{ typeof item.value === "number" ? item.value.toFixed(4) : item.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h4 class="wiki-minor">步骤 2：排程推导</h4>
      <div class="wiki-table-wrap">
        <table class="wiki-table wiki-table--zebra">
          <thead>
            <tr>
              <th style="width: 22%;">步骤</th>
              <th>中文说明</th>
              <th style="width: 18%;">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in formula.schedule" :key="item.key">
              <td>{{ item.label }}</td>
              <td>{{ describe(item) }}</td>
              <td class="font-mono text-[0.88rem]">
                {{ typeof item.value === "number" ? item.value.toFixed(4) : item.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h4 class="wiki-minor">步骤 3：总伤与 DPS</h4>
      <div class="wiki-table-wrap">
        <table class="wiki-table wiki-table--zebra">
          <thead>
            <tr>
              <th style="width: 22%;">步骤</th>
              <th>中文说明</th>
              <th style="width: 18%;">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in formula.summary" :key="item.key">
              <td>{{ item.label }}</td>
              <td>{{ describe(item) }}</td>
              <td class="font-mono text-[0.88rem]">
                {{ typeof item.value === "number" ? item.value.toFixed(4) : item.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="formula.healing && formula.healing.length > 0">
      <h4 class="wiki-minor">步骤 3b：总治疗与 HPS</h4>
      <div class="wiki-table-wrap">
        <table class="wiki-table wiki-table--zebra">
          <thead>
            <tr>
              <th style="width: 22%;">步骤</th>
              <th>中文说明</th>
              <th style="width: 18%;">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in formula.healing" :key="item.key">
              <td>{{ item.label }}</td>
              <td>{{ describe(item) }}</td>
              <td class="font-mono text-[0.88rem]">
                {{ typeof item.value === "number" ? item.value.toFixed(4) : item.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h4 class="wiki-minor">步骤 4：伤害流明细</h4>
      <StreamsTable :streams="props.streams" />
    </section>

    <section>
      <h4 class="wiki-minor">步骤 5：公式分解</h4>
      <BreakdownTable :breakdown="props.breakdown" />
    </section>
  </div>
</template>
