import { defineStore } from "pinia";
import type { CalculationResult } from "@qm/calc-core";

export type LeaderboardMode = "damage" | "healing";

export interface LeaderboardRow {
  operatorId: string;
  operatorName: string;
  skillId: string;
  skillName: string;
  attackType: string;
  result: CalculationResult;
}

type SortKey = "dps" | "totalDamage" | "hitDamage" | "hps" | "totalHealing";

type State = {
  keyword: string;
  mode: LeaderboardMode;
  sortKey: SortKey;
  desc: boolean;
  selectedSkillId: string;
};

const STORAGE_KEY = "qmcalculator.leaderboard";

function loadInitialState(): State {
  if (typeof window === "undefined") {
    return {
      keyword: "",
      mode: "damage",
      sortKey: "dps",
      desc: true,
      selectedSkillId: "",
    };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      keyword: "",
      mode: "damage",
      sortKey: "dps",
      desc: true,
      selectedSkillId: "",
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      keyword: typeof parsed.keyword === "string" ? parsed.keyword : "",
      mode: parsed.mode === "healing" ? "healing" : "damage",
      sortKey:
        parsed.sortKey === "totalDamage" ||
        parsed.sortKey === "hitDamage" ||
        parsed.sortKey === "hps" ||
        parsed.sortKey === "totalHealing"
          ? parsed.sortKey
          : "dps",
      desc: parsed.desc !== false,
      selectedSkillId: typeof parsed.selectedSkillId === "string" ? parsed.selectedSkillId : "",
    };
  } catch {
    return {
      keyword: "",
      mode: "damage",
      sortKey: "dps",
      desc: true,
      selectedSkillId: "",
    };
  }
}

export const useLeaderboardStore = defineStore("leaderboard", {
  state: (): State => loadInitialState(),
  actions: {
    persist() {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          keyword: this.keyword,
          mode: this.mode,
          sortKey: this.sortKey,
          desc: this.desc,
          selectedSkillId: this.selectedSkillId,
        }),
      );
    },
  },
});
