import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick, ref } from "vue";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { OperatorIndex, RawGameData } from "@qm/calc-core";
import { buildOperatorIndexFromRaw } from "@qm/calc-core";

const mockIndexRef = ref<OperatorIndex | null>(null);

vi.mock("./useGameData", () => ({
  useGameData: () => ({
    index: mockIndexRef,
    load: vi.fn(),
    loaded: ref(true),
    loading: ref(false),
    error: ref(null),
  }),
}));

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

describe("useCalculation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const rawData = {
      character_table: loadJson<Record<string, unknown>>("../../public/json/character_table.json"),
      skill_table: loadJson<Record<string, unknown>>("../../public/json/skill_table.json"),
      uniequip_table: loadJson<Record<string, unknown>>("../../public/json/uniequip_table.json"),
      battle_equip_table: loadJson<Record<string, unknown>>("../../public/json/battle_equip_table.json"),
      profession: loadJson<Record<string, unknown>>("../../public/json/profession.json"),
      subProfessionId: loadJson<Record<string, unknown>>("../../public/json/subProfessionId.json"),
    } satisfies RawGameData;

    mockIndexRef.value = buildOperatorIndexFromRaw(rawData);
  });

  it("在参数变更时刷新计算结果", async () => {
    const { useSelectionStore } = await import("../stores/useSelectionStore");
    const { useBattleConfigStore } = await import("../stores/useBattleConfigStore");
    const { useCalculation } = await import("./useCalculation");

    const selectionStore = useSelectionStore();
    const battleStore = useBattleConfigStore();
    const { result } = useCalculation();

    expect(result.value).toBeNull();

    selectionStore.operatorId = "char_172_svrash";
    selectionStore.skillId = "skchr_svrash_3";
    battleStore.defense = 1000;
    battleStore.magicResistance = 20;
    battleStore.conditionEnabled = true;

    await nextTick();
    expect(result.value).not.toBeNull();

    const firstDps = result.value!.summary.dps;
    battleStore.defense = 1200;
    await nextTick();

    expect(result.value).not.toBeNull();
    expect(result.value!.summary.dps).not.toBe(firstDps);
  });

  it("条件开关切换会影响结果", async () => {
    const { useSelectionStore } = await import("../stores/useSelectionStore");
    const { useBattleConfigStore } = await import("../stores/useBattleConfigStore");
    const { useCalculation } = await import("./useCalculation");

    const selectionStore = useSelectionStore();
    const battleStore = useBattleConfigStore();
    const { result } = useCalculation();

    selectionStore.operatorId = "char_4039_horn";
    selectionStore.skillId = "skchr_horn_3";
    battleStore.defense = 1000;
    battleStore.magicResistance = 30;
    battleStore.conditionEnabled = false;

    await nextTick();
    const dpsWhenOff = result.value!.summary.dps;

    battleStore.conditionEnabled = true;
    await nextTick();

    expect(result.value!.summary.dps).toBeGreaterThan(dpsWhenOff);
  });

  it("切换干员技能后，warning 区状态会更新", async () => {
    const { useSelectionStore } = await import("../stores/useSelectionStore");
    const { useBattleConfigStore } = await import("../stores/useBattleConfigStore");
    const { useCalculation } = await import("./useCalculation");

    const selectionStore = useSelectionStore();
    const battleStore = useBattleConfigStore();
    const { result } = useCalculation();

    battleStore.defense = 1200;
    battleStore.magicResistance = 20;
    battleStore.conditionEnabled = true;

    selectionStore.operatorId = "char_172_svrash";
    selectionStore.skillId = "skchr_svrash_3";
    await nextTick();
    expect(result.value).not.toBeNull();
    const warningCountBefore = result.value!.warnings.length;

    selectionStore.operatorId = "char_1013_chen2";
    selectionStore.skillId = "skchr_chen2_3";
    await nextTick();

    expect(result.value).not.toBeNull();
    expect(result.value!.warnings.length).toBeGreaterThanOrEqual(warningCountBefore);
    expect(result.value!.warnings.some((warning) => warning.code === "WARN_ASSUMPTION_APPLIED")).toBe(
      true,
    );
  });

  it("调整养成参数会影响 DPS", async () => {
    const { useSelectionStore } = await import("../stores/useSelectionStore");
    const { useBattleConfigStore } = await import("../stores/useBattleConfigStore");
    const { useDevelopmentConfigStore } = await import("../stores/useDevelopmentConfigStore");
    const { useCalculation } = await import("./useCalculation");

    const selectionStore = useSelectionStore();
    const battleStore = useBattleConfigStore();
    const developmentStore = useDevelopmentConfigStore();
    const { result } = useCalculation();

    selectionStore.operatorId = "char_350_surtr";
    selectionStore.skillId = "skchr_surtr_3";
    battleStore.defense = 400;
    battleStore.magicResistance = 50;
    battleStore.conditionEnabled = true;
    developmentStore.skillLevel = 10;
    developmentStore.eliteStage = 2;
    developmentStore.potentialRank = 6;
    developmentStore.trust = 100;
    developmentStore.moduleStage = 0;

    await nextTick();
    const baseline = result.value!.summary.dps;

    developmentStore.skillLevel = 7;
    developmentStore.potentialRank = 0;
    developmentStore.trust = 0;
    developmentStore.eliteStage = 0;
    await nextTick();

    expect(result.value!.summary.dps).toBeLessThan(baseline);
  });

  it("切换模组后结果会刷新且数值变化", async () => {
    const { useSelectionStore } = await import("../stores/useSelectionStore");
    const { useBattleConfigStore } = await import("../stores/useBattleConfigStore");
    const { useDevelopmentConfigStore } = await import("../stores/useDevelopmentConfigStore");
    const { useCalculation } = await import("./useCalculation");

    mockIndexRef.value = {
      operators: {
        module_case: {
          id: "module_case",
          name: "模组验证样例",
          baseHealth: 1000,
          baseAttack: 700,
          baseDefense: 100,
          baseMagicResistance: 0,
          baseAttackInterval: 1,
          baseAttackSpeed: 0,
          defaultAttackType: "physical",
          modules: [
            {
              id: "mod-atk",
              name: "攻击模组",
              stageBonuses: [
                {
                  atk: 0,
                  attackSpeed: 0,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 20,
                  attackSpeed: 0,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 40,
                  attackSpeed: 5,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 60,
                  attackSpeed: 10,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
              ],
            },
            {
              id: "mod-aspd",
              name: "攻速模组",
              stageBonuses: [
                {
                  atk: 0,
                  attackSpeed: 0,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 0,
                  attackSpeed: 10,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 0,
                  attackSpeed: 20,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
                {
                  atk: 0,
                  attackSpeed: 35,
                  atkScale: 1,
                  damageScale: 1,
                  defPenetrateFixed: 0,
                  magicResistanceReduction: 0,
                },
              ],
            },
          ],
          skills: [{ id: "skill", name: "测试技能", durationSeconds: 20, attackScale: 1.4 }],
        },
      },
    };

    const selectionStore = useSelectionStore();
    const battleStore = useBattleConfigStore();
    const developmentStore = useDevelopmentConfigStore();
    const { result } = useCalculation();

    selectionStore.operatorId = "module_case";
    selectionStore.skillId = "skill";
    battleStore.defense = 300;
    battleStore.magicResistance = 10;
    battleStore.conditionEnabled = true;
    developmentStore.moduleStage = 3;
    developmentStore.moduleId = "mod-atk";

    await nextTick();
    const atkModuleDps = result.value!.summary.dps;

    developmentStore.moduleId = "mod-aspd";
    await nextTick();

    expect(result.value).not.toBeNull();
    expect(result.value!.summary.dps).not.toBe(atkModuleDps);
  });
});
