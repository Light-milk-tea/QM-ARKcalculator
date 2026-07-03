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
});
