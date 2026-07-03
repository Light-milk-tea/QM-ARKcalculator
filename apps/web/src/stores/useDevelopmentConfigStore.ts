import { defineStore } from "pinia";

type State = {
  eliteStage: 0 | 1 | 2;
  skillLevel: 7 | 8 | 9 | 10;
  potentialRank: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  trust: number;
  moduleStage: 0 | 1 | 2 | 3;
  moduleId: string;
};

const STORAGE_KEY = "qmcalculator.development-config";

function loadInitialState(): State {
  if (typeof window === "undefined") {
    return {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
      moduleId: "",
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
      moduleId: "",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      eliteStage: parsed.eliteStage === 0 || parsed.eliteStage === 1 ? parsed.eliteStage : 2,
      skillLevel:
        parsed.skillLevel === 7 || parsed.skillLevel === 8 || parsed.skillLevel === 9
          ? parsed.skillLevel
          : 10,
      potentialRank:
        parsed.potentialRank === 0 ||
        parsed.potentialRank === 1 ||
        parsed.potentialRank === 2 ||
        parsed.potentialRank === 3 ||
        parsed.potentialRank === 4 ||
        parsed.potentialRank === 5
          ? parsed.potentialRank
          : 6,
      trust:
        typeof parsed.trust === "number" && Number.isFinite(parsed.trust)
          ? Math.max(0, Math.min(100, Math.round(parsed.trust)))
          : 100,
      moduleStage:
        parsed.moduleStage === 0 ||
        parsed.moduleStage === 1 ||
        parsed.moduleStage === 2 ||
        parsed.moduleStage === 3
          ? parsed.moduleStage
          : 0,
      moduleId: typeof parsed.moduleId === "string" ? parsed.moduleId : "",
    };
  } catch {
    return {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
      moduleId: "",
    };
  }
}

export const useDevelopmentConfigStore = defineStore("developmentConfig", {
  state: (): State => loadInitialState(),
  actions: {
    persist() {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          eliteStage: this.eliteStage,
          skillLevel: this.skillLevel,
          potentialRank: this.potentialRank,
          trust: this.trust,
          moduleStage: this.moduleStage,
          moduleId: this.moduleId,
        }),
      );
    },
  },
});
