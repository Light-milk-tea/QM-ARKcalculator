import { computed } from "vue";
import { calculateSkillDps } from "@qm/calc-core";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useGameData } from "./useGameData";

export function useCalculation() {
  const battleStore = useBattleConfigStore();
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
      },
      index.value,
    );
  });

  return { result };
}
