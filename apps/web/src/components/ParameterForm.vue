<script setup lang="ts">
import type { OperatorData, SkillData } from "@qm/calc-core";

defineProps<{
  keyword: string;
  operatorId: string;
  skillId: string;
  operators: OperatorData[];
  selectedSkills: SkillData[];
  defaultLevelText: string;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:operatorId", value: string): void;
  (e: "update:skillId", value: string): void;
}>();
</script>

<template>
  <p class="wiki-paragraph">
    在此处配置要计算的干员、技能以及目标敌人的参数。所有改动会即时反映在右侧计算结果中。
  </p>

  <div class="wiki-table-wrap">
    <table class="wiki-table wiki-table--narrow" style="max-width: 640px;">
      <tbody>
        <tr>
          <th style="width: 28%;">关键词检索</th>
          <td>
            <input
              :value="keyword"
              type="text"
              placeholder="输入干员名"
              class="wiki-input"
              @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
            />
          </td>
        </tr>
        <tr>
          <th>选择干员</th>
          <td>
            <select
              :value="operatorId"
              class="wiki-select"
              @change="emit('update:operatorId', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="op in operators" :key="op.id" :value="op.id">
                {{ op.name }} ({{ op.id }})
              </option>
            </select>
            <div class="text-[0.78rem] text-arkrec-note mt-1">* {{ defaultLevelText }}</div>
          </td>
        </tr>
        <tr>
          <th>选择技能</th>
          <td>
            <select
              :value="skillId"
              class="wiki-select"
              @change="emit('update:skillId', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="skill in selectedSkills" :key="skill.id" :value="skill.id">
                {{ skill.name }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
