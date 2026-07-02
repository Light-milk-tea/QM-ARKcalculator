<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useGameData } from "../composables/useGameData";
import { useCalculation } from "../composables/useCalculation";

import AppHeader from "../components/AppHeader.vue";
import ArticleTitleBar from "../components/ArticleTitleBar.vue";
import ArticleToc from "../components/ArticleToc.vue";
import ArticleFooter from "../components/ArticleFooter.vue";
import OperatorInfobox from "../components/OperatorInfobox.vue";
import ParameterForm from "../components/ParameterForm.vue";
import EnemyEffectsPanel from "../components/EnemyEffectsPanel.vue";
import ResultSummary from "../components/ResultSummary.vue";
import CollapsibleSection from "../components/CollapsibleSection.vue";
import RuleTracePanel from "../components/RuleTracePanel.vue";
import FormulaViewer from "../components/FormulaViewer.vue";

const battleStore = useBattleConfigStore();
const selectionStore = useSelectionStore();

const { load, loaded, loading, error, index } = useGameData();
const { result } = useCalculation();

const { keyword, operatorId } = storeToRefs(selectionStore);

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

const defaultLevelText =
  "按干员最高阶段满级,默认满潜、满信赖并计入可生效天赋。";

const tocSections = [
  { id: "params", label: "1. 参数设置" },
  { id: "result", label: "2. 计算结果" },
  { id: "formula", label: "3. 计算公式" },
  { id: "rules", label: "4. 规则与警告" },
];

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
  () => [
    battleStore.defense,
    battleStore.magicResistance,
    battleStore.conditionEnabled,
    battleStore.minPhysicalDamageRatio,
  ],
  () => battleStore.persist(),
  { deep: true },
);

watch(
  () => [selectionStore.operatorId, selectionStore.skillId, selectionStore.keyword],
  () => selectionStore.persist(),
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
  <div class="wiki-page min-h-screen bg-arkrec-bg">
    <AppHeader :loading="loading" :loaded="loaded" :error="error" />

    <div class="wiki-shell">
      <ArticleTitleBar title="单目标 DPS 计算闭环" />

      <div class="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        <div class="hidden lg:block">
          <ArticleToc :sections="tocSections" />
        </div>

        <article class="wiki-content">
          <section id="params">
            <h2 class="wiki-section">
              <span>参数设置</span>
            </h2>
            <ParameterForm
              :keyword="selectionStore.keyword"
              :operator-id="selectionStore.operatorId"
              :skill-id="selectionStore.skillId"
              :operators="operators"
              :selected-skills="selectedSkills"
              :default-level-text="defaultLevelText"
              @update:keyword="selectionStore.keyword = $event"
              @update:operator-id="selectionStore.operatorId = $event"
              @update:skill-id="selectionStore.skillId = $event"
            />
          </section>

          <OperatorInfobox :operator="selectedOperator" />
          <EnemyEffectsPanel
            :defense="battleStore.defense"
            :magic-resistance="battleStore.magicResistance"
            :min-physical-damage-ratio="battleStore.minPhysicalDamageRatio"
            :condition-enabled="battleStore.conditionEnabled"
            @update:defense="battleStore.defense = $event"
            @update:magic-resistance="battleStore.magicResistance = $event"
            @update:min-physical-damage-ratio="battleStore.minPhysicalDamageRatio = $event"
            @update:condition-enabled="battleStore.conditionEnabled = $event"
          />

          <section id="result">
            <h2 class="wiki-section">
              <span>计算结果</span>
            </h2>
            <ResultSummary
              v-if="result"
              :summary="result.summary"
              :schedule="result.schedule"
              :streams="result.streams"
            />
            <div v-else class="wiki-callout">
              请先在参数设置中选择有效的干员与技能以查看结果。
            </div>
          </section>

          <section v-if="result" id="formula">
            <h2 class="wiki-section">
              <span>计算公式</span>
            </h2>
            <FormulaViewer
              :formula="result.formula"
              :summary="result.summary"
              :schedule="result.schedule"
              :streams="result.streams"
              :breakdown="result.breakdown"
            />
          </section>

          <CollapsibleSection v-if="result" id="rules" title="规则与警告" :default-open="false">
            <RuleTracePanel
              :rule-trace="result.ruleTrace"
              :warnings="result.warnings"
            />
          </CollapsibleSection>
        </article>
      </div>

      <ArticleFooter rule-version="v0.1.0" data-version="2026-07-02" />
    </div>
  </div>
</template>
