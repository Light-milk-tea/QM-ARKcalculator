<script setup lang="ts">
import type { ModuleData, OperatorData, SkillData } from "@qm/calc-core";

defineProps<{
  keyword: string;
  operatorId: string;
  skillId: string;
  operators: OperatorData[];
  selectedSkills: SkillData[];
  selectedModules: ModuleData[];
  defaultLevelText: string;
  eliteStage: 0 | 1 | 2;
  skillLevel: 7 | 8 | 9 | 10;
  potentialRank: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  trust: number;
  moduleStage: 0 | 1 | 2 | 3;
  moduleId: string;
}>();

const emit = defineEmits<{
  (e: "update:keyword", value: string): void;
  (e: "update:operatorId", value: string): void;
  (e: "update:skillId", value: string): void;
  (e: "update:eliteStage", value: 0 | 1 | 2): void;
  (e: "update:skillLevel", value: 7 | 8 | 9 | 10): void;
  (e: "update:potentialRank", value: 0 | 1 | 2 | 3 | 4 | 5 | 6): void;
  (e: "update:trust", value: number): void;
  (e: "update:moduleStage", value: 0 | 1 | 2 | 3): void;
  (e: "update:moduleId", value: string): void;
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
                {{ op.name }}
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
        <tr>
          <th>精英阶段</th>
          <td>
            <select
              :value="eliteStage"
              class="wiki-select"
              @change="emit('update:eliteStage', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2)"
            >
              <option :value="0">精英0</option>
              <option :value="1">精英1</option>
              <option :value="2">精英2</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>技能等级</th>
          <td>
            <select
              :value="skillLevel"
              class="wiki-select"
              @change="emit('update:skillLevel', Number(($event.target as HTMLSelectElement).value) as 7 | 8 | 9 | 10)"
            >
              <option :value="7">7</option>
              <option :value="8">8</option>
              <option :value="9">9</option>
              <option :value="10">10（专三）</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>潜能</th>
          <td>
            <select
              :value="potentialRank"
              class="wiki-select"
              @change="emit('update:potentialRank', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)"
            >
              <option :value="0">潜能0</option>
              <option :value="1">潜能1</option>
              <option :value="2">潜能2</option>
              <option :value="3">潜能3</option>
              <option :value="4">潜能4</option>
              <option :value="5">潜能5</option>
              <option :value="6">潜能6</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>信赖</th>
          <td>
            <input
              :value="trust"
              type="number"
              min="0"
              max="100"
              class="wiki-input"
              @input="emit('update:trust', Number(($event.target as HTMLInputElement).value))"
            />
          </td>
        </tr>
        <tr>
          <th>选择模组</th>
          <td>
            <select
              :value="moduleId"
              class="wiki-select"
              :disabled="selectedModules.length === 0"
              @change="emit('update:moduleId', ($event.target as HTMLSelectElement).value)"
            >
              <option v-if="selectedModules.length === 0" value="">
                当前干员无可用模组
              </option>
              <option v-for="module in selectedModules" :key="module.id" :value="module.id">
                {{ module.name }}
              </option>
            </select>
          </td>
        </tr>
        <tr>
          <th>模组阶段</th>
          <td>
            <select
              :value="moduleStage"
              class="wiki-select"
              @change="emit('update:moduleStage', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2 | 3)"
            >
              <option :value="0">未装配</option>
              <option :value="1">模组I</option>
              <option :value="2">模组II</option>
              <option :value="3">模组III</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
