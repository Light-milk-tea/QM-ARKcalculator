<script setup lang="ts">
import type { CalculationResult } from "@qm/calc-core";
import ResultSummary from "./ResultSummary.vue";
import FormulaViewer from "./FormulaViewer.vue";
import RuleTracePanel from "./RuleTracePanel.vue";
import CollapsibleSection from "./CollapsibleSection.vue";

defineProps<{
  result: CalculationResult | null;
  collapsibleRules?: boolean;
}>();
</script>

<template>
  <section id="result">
    <h2 class="wiki-section">
      <span>计算结果</span>
    </h2>
    <ResultSummary
      v-if="result"
      :summary="result.summary"
      :schedule="result.schedule"
      :streams="result.streams"
      :healing="result.healing"
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
      :healing="result.healing"
    />
  </section>

  <template v-if="result">
    <CollapsibleSection
      v-if="collapsibleRules !== false"
      id="rules"
      title="规则与警告"
      :default-open="false"
    >
      <RuleTracePanel
        :rule-trace="result.ruleTrace"
        :warnings="result.warnings"
      />
    </CollapsibleSection>
    <section v-else>
      <h2 class="wiki-section">
        <span>规则与警告</span>
      </h2>
      <RuleTracePanel
        :rule-trace="result.ruleTrace"
        :warnings="result.warnings"
      />
    </section>
  </template>
</template>
