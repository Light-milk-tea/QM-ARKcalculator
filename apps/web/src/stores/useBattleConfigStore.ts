import { defineStore } from "pinia";

type State = {
  defense: number;
  magicResistance: number;
  conditionEnabled: boolean;
  minPhysicalDamageRatio: number;
};

const STORAGE_KEY = "qmcalculator.battle-config";

function loadInitialState(): State {
  if (typeof window === "undefined") {
    return {
      defense: 0,
      magicResistance: 0,
      conditionEnabled: true,
      minPhysicalDamageRatio: 0.05,
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      defense: 0,
      magicResistance: 0,
      conditionEnabled: true,
      minPhysicalDamageRatio: 0.05,
    };
  }

  try {
    const parsed = JSON.parse(raw) as State;
    return {
      defense: Number.isFinite(parsed.defense) ? parsed.defense : 0,
      magicResistance: Number.isFinite(parsed.magicResistance) ? parsed.magicResistance : 0,
      conditionEnabled: Boolean(parsed.conditionEnabled),
      minPhysicalDamageRatio: Number.isFinite(parsed.minPhysicalDamageRatio)
        ? parsed.minPhysicalDamageRatio
        : 0.05,
    };
  } catch {
    return {
      defense: 0,
      magicResistance: 0,
      conditionEnabled: true,
      minPhysicalDamageRatio: 0.05,
    };
  }
}

export const useBattleConfigStore = defineStore("battleConfig", {
  state: (): State => loadInitialState(),
  actions: {
    persist() {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          defense: this.defense,
          magicResistance: this.magicResistance,
          conditionEnabled: this.conditionEnabled,
          minPhysicalDamageRatio: this.minPhysicalDamageRatio,
        }),
      );
    },
  },
});
