<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useGameData } from "../composables/useGameData";
import { useCalculation } from "../composables/useCalculation";

const battleStore = useBattleConfigStore();
const selectionStore = useSelectionStore();

const { load, loaded, loading, error, index } = useGameData();
const { result } = useCalculation();

const { keyword, operatorId, skillId } = storeToRefs(selectionStore);

const operators = computed(() => {
  if (!index.value) return [];
  const all = Object.values(index.value.operators);
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return all;
  return all.filter((item) => item.name.toLowerCase().includes(kw));
});

const selectedOperator = computed(() => {
  if (!index.value || !operatorId.value) return null;
  return index.value.operators[operatorId.value] ?? null;
});

const selectedSkills = computed(() => selectedOperator.value?.skills ?? []);
const defaultLevelText = "按干员最高阶段满级，默认满潜、满信赖并计入可生效天赋";

watch(
  () => operatorId.value,
  () => {
    const firstSkill = selectedOperator.value?.skills[0]?.id;
    if (firstSkill) {
      selectionStore.skillId = firstSkill;
    }
  },
);

watch(
  () => [battleStore.defense, battleStore.magicResistance, battleStore.conditionEnabled, battleStore.minPhysicalDamageRatio],
  () => battleStore.persist(),
  { deep: true },
);

onMounted(async () => {
  await load();
  if (!selectionStore.operatorId && operators.value.length > 0) {
    selectionStore.operatorId = operators.value[0].id;
    selectionStore.skillId = operators.value[0].skills[0]?.id ?? "";
  }
});
</script>

<template>
  <div class="min-h-screen bg-arkrec-bg">
    <!-- Top Nav -->
    <header class="bg-white border-b border-arkrec-border shadow-sm">
      <div class="mx-auto w-full max-w-[1000px] px-4 h-12 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="text-lg font-bold text-arkrec-text tracking-wide">
            ARKcalculator
          </div>
          <div class="text-sm text-arkrec-muted hidden sm:block">
            单目标 DPS 计算
          </div>
        </div>
        
        <div class="flex items-center gap-4 text-sm font-medium">
          <span v-if="loading" class="text-arkrec-primary">数据加载中...</span>
          <span v-else-if="error" class="text-arkrec-danger">加载失败：{{ error }}</span>
          <span v-else-if="loaded" class="text-arkrec-success">系统就绪</span>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <main class="mx-auto w-full max-w-[1000px] px-4 py-8">
      <h1 class="wiki-header">单目标 DPS 计算闭环</h1>
      <p class="text-sm mb-6 text-arkrec-muted">
        基于最新游戏数据的完全解耦计算引擎。支持详细的 ruleTrace 追踪与 warning 异常报告。
      </p>

      <div class="flex flex-col md:flex-row gap-8 items-start">
        
        <!-- Left Column: Input Form -->
        <aside class="w-full md:w-[320px] shrink-0">
          <h2 class="wiki-subheader mt-0">干员与技能</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-bold mb-1">关键词检索</label>
              <input 
                v-model="keyword" 
                type="text" 
                placeholder="输入干员名" 
                class="wiki-input"
              />
            </div>

            <div>
              <label class="block text-sm font-bold mb-1">选择干员</label>
              <select v-model="operatorId" class="wiki-select">
                <option v-for="op in operators" :key="op.id" :value="op.id">
                  {{ op.name }} ({{ op.id }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold mb-1">选择技能</label>
              <select v-model="skillId" class="wiki-select">
                <option v-for="skill in selectedSkills" :key="skill.id" :value="skill.id">
                  {{ skill.name }}
                </option>
              </select>
            </div>
            
            <p class="text-xs text-arkrec-muted pt-1">
              * {{ defaultLevelText }}
            </p>
          </div>

          <h2 class="wiki-subheader">敌方参数设置</h2>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-bold mb-1">敌方防御</label>
                <input v-model.number="battleStore.defense" type="number" min="0" class="wiki-input" />
              </div>
              <div>
                <label class="block text-sm font-bold mb-1">敌方法抗</label>
                <input v-model.number="battleStore.magicResistance" type="number" min="0" max="100" class="wiki-input" />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-1">物理最低伤害比例</label>
              <input v-model.number="battleStore.minPhysicalDamageRatio" type="number" min="0" max="1" step="0.01" class="wiki-input" />
            </div>
            
            <label class="flex items-center gap-2 cursor-pointer pt-2">
              <input v-model="battleStore.conditionEnabled" type="checkbox" class="wiki-checkbox" />
              <span class="text-sm">启用条件效果 (如天赋)</span>
            </label>
          </div>
        </aside>

        <!-- Right Column: Results & Stats -->
        <div class="flex-1 w-full">
          
          <h2 class="wiki-subheader mt-0">干员基础属性</h2>
          <table class="wiki-table" v-if="selectedOperator">
            <tbody>
              <tr>
                <th>生命值</th><td>{{ selectedOperator.baseHealth }}</td>
                <th>攻击力</th><td>{{ selectedOperator.baseAttack }}</td>
              </tr>
              <tr>
                <th>防御力</th><td>{{ selectedOperator.baseDefense }}</td>
                <th>法术抗性</th><td>{{ selectedOperator.baseMagicResistance }}</td>
              </tr>
              <tr>
                <th>攻击间隔</th><td>{{ selectedOperator.baseAttackInterval.toFixed(2) }}s</td>
                <th>攻击类型</th><td>{{ selectedOperator.defaultAttackType }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-sm text-arkrec-muted mb-4">请先选择干员</p>

          <h2 class="wiki-subheader">计算结果</h2>
          <div v-if="!result" class="text-sm text-arkrec-muted p-4 bg-arkrec-panel border border-arkrec-border text-center">
            等待输入参数...
          </div>
          
          <div v-else>
            <table class="wiki-table">
              <tbody>
                <tr>
                  <th>单次伤害 (DPH)</th>
                  <td class="font-bold text-arkrec-primary">{{ result.summary.hitDamage.toFixed(2) }}</td>
                  <th>秒伤 (DPS)</th>
                  <td class="font-bold text-arkrec-danger">{{ result.summary.dps.toFixed(2) }}</td>
                </tr>
                <tr>
                  <th>技能总伤</th>
                  <td class="font-bold" colspan="3">{{ result.summary.totalDamage.toFixed(2) }}</td>
                </tr>
                <tr>
                  <th>攻击次数</th>
                  <td>{{ result.schedule.attackCount.toFixed(2) }} 次</td>
                  <th>实际攻击间隔</th>
                  <td>{{ result.schedule.attackInterval.toFixed(2) }}s</td>
                </tr>
                <tr>
                  <th>技能持续时间</th>
                  <td colspan="3">{{ result.schedule.duration.toFixed(2) }}s</td>
                </tr>
              </tbody>
            </table>

            <h2 class="wiki-subheader">规则追踪 (Rule Trace)</h2>
            <div class="max-h-[200px] overflow-y-auto border border-arkrec-border bg-arkrec-panel p-3 mb-4">
              <ul class="text-sm space-y-1">
                <li v-for="trace in result.ruleTrace" :key="trace.ruleId">
                  <span :class="trace.applied ? 'text-arkrec-success font-bold' : 'text-arkrec-muted'">
                    [{{ trace.applied ? '应用' : '跳过' }}]
                  </span>
                  <span class="ml-2 font-mono">{{ trace.ruleId }}</span>
                  <span v-if="trace.note" class="text-arkrec-muted ml-1">- {{ trace.note }}</span>
                </li>
              </ul>
            </div>

            <h2 class="wiki-subheader">系统警告 (Warnings)</h2>
            <div v-if="result.warnings.length > 0" class="border border-arkrec-danger bg-red-50 p-3">
              <ul class="wiki-list text-arkrec-danger mb-0">
                <li v-for="item in result.warnings" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div v-else class="text-sm text-arkrec-success p-3 border border-arkrec-border bg-arkrec-panel">
              ✓ 暂无异常数据，规则覆盖良好
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 移除多余的自定义滚动条，使用浏览器默认样式，符合 wiki 风格 */
</style>
