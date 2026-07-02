import { ref } from "vue";
import type { OperatorIndex, RawGameData } from "@qm/calc-core";
import { buildOperatorIndexFromRaw } from "@qm/calc-core";

const loaded = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const index = ref<OperatorIndex | null>(null);

const jsonFiles = [
  ["character_table", "character_table.json"],
  ["skill_table", "skill_table.json"],
  ["uniequip_table", "uniequip_table.json"],
  ["battle_equip_table", "battle_equip_table.json"],
  ["profession", "profession.json"],
  ["subProfessionId", "subProfessionId.json"],
] as const;

export function useGameData() {
  async function load() {
    if (loaded.value || loading.value) {
      return;
    }
    loading.value = true;
    error.value = null;

    try {
      const entries = await Promise.all(
        jsonFiles.map(async ([dataKey, fileName]) => {
          const response = await fetch(`/json/${fileName}`);
          if (!response.ok) {
            throw new Error(`Failed to load ${fileName}`);
          }
          return [dataKey, await response.json()] as const;
        }),
      );

      const rawData = Object.fromEntries(entries) as unknown as RawGameData;
      index.value = buildOperatorIndexFromRaw(rawData);
      loaded.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading.value = false;
    }
  }

  return {
    loaded,
    loading,
    error,
    index,
    load,
  };
}
