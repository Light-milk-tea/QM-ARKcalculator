import { computed } from "vue";
import { calculateSkillDps } from "@qm/calc-core";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useDevelopmentConfigStore } from "../stores/useDevelopmentConfigStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useGameData } from "./useGameData";

export function useCalculation() {
  const battleStore = useBattleConfigStore();
  const developmentStore = useDevelopmentConfigStore();
  const selectionStore = useSelectionStore();
  const { index } = useGameData();

  const result = computed(() => {
    if (!index.value) return null;
    if (!selectionStore.operatorId || !selectionStore.skillId) return null;

    return calculateSkillDps(
      {
        selection: {
          operatorId: selectionStore.operatorId,
          skillId: selectionStore.skillId,
        },
        enemy: {
          defense: battleStore.defense,
          magicResistance: battleStore.magicResistance,
        },
        battle: {
          conditionEnabled: battleStore.conditionEnabled,
          minPhysicalDamageRatio: battleStore.minPhysicalDamageRatio,
        },
        development: {
          eliteStage: developmentStore.eliteStage,
          skillLevel: developmentStore.skillLevel,
          potentialRank: developmentStore.potentialRank,
          trust: developmentStore.trust,
          moduleStage: developmentStore.moduleStage,
          moduleId: developmentStore.moduleId,
        },
      },
      index.value,
    );
  });

  return { result };
}
