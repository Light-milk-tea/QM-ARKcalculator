<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useDevelopmentConfigStore } from "../stores/useDevelopmentConfigStore";
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
import CalculationDetailSections from "../components/CalculationDetailSections.vue";
import ruleVersionMeta from "../../../../versions/rule-version.json";
import dataVersionMeta from "../../../../versions/data-version.json";

const battleStore = useBattleConfigStore();
const developmentStore = useDevelopmentConfigStore();
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
const selectedModules = computed(() => selectedOperator.value?.modules ?? []);
const selectedModule = computed(
  () =>
    selectedModules.value.find((module) => module.id === developmentStore.moduleId) ??
    selectedModules.value[0] ??
    null,
);
const currentPanelAttack = computed(() => {
  const derived = result.value?.formula.mainHit.find((step) => step.key === "developmentBaseAttack")?.value;
  if (typeof derived === "number" && Number.isFinite(derived)) {
    return derived;
  }
  return selectedOperator.value?.baseAttack ?? 0;
});
const currentPanelAttackInterval = computed(() => {
  const derived = result.value?.formula.schedule.find((step) => step.key === "attackInterval")?.value;
  if (typeof derived === "number" && Number.isFinite(derived)) {
    return derived;
  }
  return selectedOperator.value?.baseAttackInterval ?? 0;
});
const moduleStageLabel = computed(() => {
  if (developmentStore.moduleStage === 0) return "未装配";
  return `模组${["I", "II", "III"][developmentStore.moduleStage - 1]}`;
});

const defaultLevelText = "默认 E2/专三/满潜/满信赖；可在下方改为自定义养成参数。";

const tocSections = [
  { id: "params", label: "1. 参数设置" },
  { id: "result", label: "2. 计算结果" },
  { id: "formula", label: "3. 计算公式" },
  { id: "rules", label: "4. 规则与警告" },
];

const footerRuleVersion = ruleVersionMeta.ruleVersionId;
const footerDataVersion = dataVersionMeta.dataVersionId;

watch(
  () => operatorId.value,
  () => {
    const firstSkill = selectedOperator.value?.skills[0]?.id;
    if (firstSkill) {
      selectionStore.skillId = firstSkill;
    }
    const firstModuleId = selectedOperator.value?.modules?.[0]?.id ?? "";
    if (!selectedOperator.value?.modules?.some((module) => module.id === developmentStore.moduleId)) {
      developmentStore.moduleId = firstModuleId;
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
  () => [
    developmentStore.eliteStage,
    developmentStore.skillLevel,
    developmentStore.potentialRank,
    developmentStore.trust,
    developmentStore.moduleStage,
    developmentStore.moduleId,
  ],
  () => developmentStore.persist(),
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
  if (!selectedModules.value.some((module) => module.id === developmentStore.moduleId)) {
    developmentStore.moduleId = selectedModules.value[0]?.id ?? "";
  }
});
</script>

<template>
  <div class="wiki-page min-h-screen bg-arkrec-bg">
    <AppHeader :loading="loading" :loaded="loaded" :error="error" />

    <div class="wiki-shell">
      <ArticleTitleBar title="干员伤害计算" />

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
              :selected-modules="selectedModules"
              :default-level-text="defaultLevelText"
              :elite-stage="developmentStore.eliteStage"
              :skill-level="developmentStore.skillLevel"
              :potential-rank="developmentStore.potentialRank"
              :trust="developmentStore.trust"
              :module-stage="developmentStore.moduleStage"
              :module-id="developmentStore.moduleId"
              @update:keyword="selectionStore.keyword = $event"
              @update:operator-id="selectionStore.operatorId = $event"
              @update:skill-id="selectionStore.skillId = $event"
              @update:elite-stage="developmentStore.eliteStage = $event"
              @update:skill-level="developmentStore.skillLevel = $event"
              @update:potential-rank="developmentStore.potentialRank = $event"
              @update:trust="developmentStore.trust = Math.max(0, Math.min(100, Math.round($event)))"
              @update:module-stage="developmentStore.moduleStage = $event"
              @update:module-id="developmentStore.moduleId = $event"
            />
          </section>

          <OperatorInfobox
            :operator="selectedOperator"
            :current-attack="currentPanelAttack"
            :current-attack-interval="currentPanelAttackInterval"
            :selected-module-name="selectedModule?.name ?? '未装配'"
            :module-stage-label="moduleStageLabel"
          />
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

          <CalculationDetailSections :result="result" />
        </article>
      </div>

      <ArticleFooter :rule-version="footerRuleVersion" :data-version="footerDataVersion" />
    </div>
  </div>
</template>
