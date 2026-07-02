<script setup lang="ts">
import type { OperatorData } from "@qm/calc-core";

defineProps<{
  operator: OperatorData | null;
}>();
</script>

<template>
  <aside class="wiki-infobox wiki-infobox--attached" v-if="operator">
    <div class="wiki-infobox-header">{{ operator.name }}</div>
    <table class="wiki-infobox-table">
      <tbody>
        <tr>
          <th>生命上限</th>
          <td>{{ operator.baseHealth }}</td>
        </tr>
        <tr>
          <th>攻击</th>
          <td>{{ operator.baseAttack }}</td>
        </tr>
        <tr>
          <th>防御</th>
          <td>{{ operator.baseDefense }}</td>
        </tr>
        <tr>
          <th>法术抗性</th>
          <td>{{ operator.baseMagicResistance }}</td>
        </tr>
        <tr>
          <th>攻击间隔</th>
          <td>{{ operator.baseAttackInterval.toFixed(2) }} s</td>
        </tr>
        <tr>
          <th>攻击类型</th>
          <td>{{ operator.defaultAttackType }}</td>
        </tr>
      </tbody>
    </table>
    <slot name="footer" />
  </aside>
  <aside class="wiki-infobox wiki-infobox--attached" v-else>
    <div class="wiki-infobox-header">干员信息</div>
    <div class="px-2 py-4 text-center text-arkrec-note text-[0.85rem]">
      请先在参数设置中选择干员。
    </div>
    <slot name="footer" />
  </aside>
</template>
