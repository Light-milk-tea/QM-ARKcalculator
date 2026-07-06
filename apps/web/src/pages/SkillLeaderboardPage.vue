<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGameData } from "../composables/useGameData";
import { useSkillLeaderboard } from "../composables/useSkillLeaderboard";
import { useLeaderboardStore, type LeaderboardRow } from "../stores/useLeaderboardStore";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useDevelopmentConfigStore } from "../stores/useDevelopmentConfigStore";
import AppHeader from "../components/AppHeader.vue";
import ArticleTitleBar from "../components/ArticleTitleBar.vue";
import ArticleFooter from "../components/ArticleFooter.vue";
import LeaderboardFilterPanel from "../components/LeaderboardFilterPanel.vue";
import SkillLeaderboardTable from "../components/SkillLeaderboardTable.vue";
import CalculationDetailDrawer from "../components/CalculationDetailDrawer.vue";
import ruleVersionMeta from "../../../../versions/rule-version.json";
import dataVersionMeta from "../../../../versions/data-version.json";

const leaderboardStore = useLeaderboardStore();
const battleStore = useBattleConfigStore();
const developmentStore = useDevelopmentConfigStore();
const { load, loaded, loading, error } = useGameData();
const { rows } = useSkillLeaderboard();
const { keyword, mode, sortKey, desc, selectedSkillId } = storeToRefs(leaderboardStore);

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return rows.value.filter((item) => {
    if (mode.value === "healing" && !item.result.healing.enabled) return false;
    if (mode.value === "damage" && item.result.healing.enabled && item.result.summary.totalDamage <= 0) return false;
    if (!kw) return true;
    return (
      item.operatorName.toLowerCase().includes(kw) ||
      item.skillName.toLowerCase().includes(kw) ||
      item.operatorId.toLowerCase().includes(kw) ||
      item.skillId.toLowerCase().includes(kw)
    );
  });
});

const sortedRows = computed(() => {
  const list = [...filteredRows.value];
  const factor = desc.value ? -1 : 1;
  list.sort((a, b) => {
    const valueA = sortKey.value === "dps"
      ? a.result.summary.dps
      : sortKey.value === "totalDamage"
        ? a.result.summary.totalDamage
        : sortKey.value === "hitDamage"
          ? a.result.summary.hitDamage
          : sortKey.value === "hps"
            ? a.result.healing.hps
            : a.result.healing.totalHealing;
    const valueB = sortKey.value === "dps"
      ? b.result.summary.dps
      : sortKey.value === "totalDamage"
        ? b.result.summary.totalDamage
        : sortKey.value === "hitDamage"
          ? b.result.summary.hitDamage
          : sortKey.value === "hps"
            ? b.result.healing.hps
            : b.result.healing.totalHealing;
    if (valueA === valueB) return a.operatorId.localeCompare(b.operatorId) * factor;
    return (valueA > valueB ? -1 : 1) * factor;
  });
  return list;
});

const selectedRow = computed(() => sortedRows.value.find((item) => item.skillId === selectedSkillId.value) ?? null);

function handleSelect(row: LeaderboardRow) {
  leaderboardStore.selectedSkillId = row.skillId;
}

watch(
  () => [leaderboardStore.keyword, leaderboardStore.mode, leaderboardStore.sortKey, leaderboardStore.desc, leaderboardStore.selectedSkillId],
  () => leaderboardStore.persist(),
  { deep: true },
);

watch(
  () => [battleStore.defense, battleStore.magicResistance, battleStore.conditionEnabled, battleStore.minPhysicalDamageRatio],
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

onMounted(async () => {
  await load();
});
</script>

<template>
  <div class="wiki-page min-h-screen bg-arkrec-bg">
    <AppHeader :loading="loading" :loaded="loaded" :error="error" />
    <div class="wiki-shell">
      <ArticleTitleBar title="全员技能榜单" />
      <p class="wiki-paragraph">
        本页面按当前敌方参数与养成参数批量计算全员技能表现，点击任意行可查看完整公式、流明细与规则警告。
      </p>

      <LeaderboardFilterPanel
        :keyword="keyword"
        :mode="mode"
        :sort-key="sortKey"
        :desc="desc"
        @update:keyword="leaderboardStore.keyword = $event"
        @update:mode="leaderboardStore.mode = $event"
        @update:sort-key="leaderboardStore.sortKey = $event"
        @update:desc="leaderboardStore.desc = $event"
      />

      <section class="mt-4">
        <SkillLeaderboardTable
          :rows="sortedRows"
          :mode="mode"
          :selected-skill-id="selectedSkillId"
          @select="handleSelect"
        />
      </section>

      <ArticleFooter :rule-version="ruleVersionMeta.ruleVersionId" :data-version="dataVersionMeta.dataVersionId" />
    </div>

    <CalculationDetailDrawer
      :open="Boolean(selectedRow)"
      :row="selectedRow"
      @close="leaderboardStore.selectedSkillId = ''"
    />
  </div>
</template>
