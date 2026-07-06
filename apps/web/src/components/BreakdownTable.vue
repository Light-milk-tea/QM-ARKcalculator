<script setup lang="ts">
import type { BreakdownItem } from "@qm/calc-core";

defineProps<{
  breakdown: BreakdownItem[];
}>();

const breakdownKeyLabels: Record<string, string> = {
  baseAttack: "基础攻击力",
  development: "养成参数",
  atkBuffRatio: "攻击加成系数",
  attackScale: "技能攻击倍率",
  damageScale: "最终伤害倍率",
  attackType: "攻击类型",
  healScale: "治疗倍率",
  healFromDamageRatio: "伤害转治疗比例",
};

const attackTypeLabels: Record<string, string> = {
  physical: "物理",
  magical: "法术",
  true: "真实",
  heal: "治疗",
  none: "无伤害",
};

function localizeKey(key: string): string {
  return breakdownKeyLabels[key] ?? key;
}

function localizeValue(key: string, value: number | string): string {
  if (key !== "attackType") {
    return typeof value === "number" ? value.toFixed(4) : String(value);
  }

  const raw = String(value);
  return attackTypeLabels[raw] ?? raw;
}
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
          <td>{{ localizeKey(item.key) }}</td>
          <td class="font-mono">{{ localizeValue(item.key, item.value) }}</td>
          <td>{{ item.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
