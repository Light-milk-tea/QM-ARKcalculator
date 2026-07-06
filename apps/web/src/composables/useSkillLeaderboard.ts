import { computed } from "vue";
import { calculateSkillDps, type CalculationInput } from "@qm/calc-core";
import { useBattleConfigStore } from "../stores/useBattleConfigStore";
import { useDevelopmentConfigStore } from "../stores/useDevelopmentConfigStore";
import { useGameData } from "./useGameData";
import type { LeaderboardRow } from "../stores/useLeaderboardStore";

function createInput(params: {
  operatorId: string;
  skillId: string;
  defense: number;
  magicResistance: number;
  conditionEnabled: boolean;
  minPhysicalDamageRatio: number;
  eliteStage: 0 | 1 | 2;
  skillLevel: 7 | 8 | 9 | 10;
  potentialRank: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  trust: number;
  moduleStage: 0 | 1 | 2 | 3;
  moduleId: string;
}): CalculationInput {
  return {
    selection: {
      operatorId: params.operatorId,
      skillId: params.skillId,
    },
    enemy: {
      defense: params.defense,
      magicResistance: params.magicResistance,
    },
    battle: {
      conditionEnabled: params.conditionEnabled,
      minPhysicalDamageRatio: params.minPhysicalDamageRatio,
    },
    development: {
      eliteStage: params.eliteStage,
      skillLevel: params.skillLevel,
      potentialRank: params.potentialRank,
      trust: params.trust,
      moduleStage: params.moduleStage,
      moduleId: params.moduleId || undefined,
    },
  };
}

export function useSkillLeaderboard() {
  const battleStore = useBattleConfigStore();
  const developmentStore = useDevelopmentConfigStore();
  const { index } = useGameData();

  const rows = computed<LeaderboardRow[]>(() => {
    if (!index.value) return [];
    const list: LeaderboardRow[] = [];

    for (const operator of Object.values(index.value.operators)) {
      const moduleId = operator.modules?.[0]?.id ?? "";
      for (const skill of operator.skills) {
        const result = calculateSkillDps(
          createInput({
            operatorId: operator.id,
            skillId: skill.id,
            defense: battleStore.defense,
            magicResistance: battleStore.magicResistance,
            conditionEnabled: battleStore.conditionEnabled,
            minPhysicalDamageRatio: battleStore.minPhysicalDamageRatio,
            eliteStage: developmentStore.eliteStage,
            skillLevel: developmentStore.skillLevel,
            potentialRank: developmentStore.potentialRank,
            trust: developmentStore.trust,
            moduleStage: developmentStore.moduleStage,
            moduleId: developmentStore.moduleStage > 0 ? moduleId : "",
          }),
          index.value,
        );

        list.push({
          operatorId: operator.id,
          operatorName: operator.name,
          skillId: skill.id,
          skillName: skill.name,
          attackType: result.streams[0]?.attackType ?? operator.defaultAttackType,
          result,
        });
      }
    }
    return list;
  });

  return { rows };
}
