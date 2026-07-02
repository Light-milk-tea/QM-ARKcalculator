import { defineStore } from "pinia";

type SelectionState = {
  operatorId: string;
  skillId: string;
  keyword: string;
};

const STORAGE_KEY = "qmcalculator.selection";

function loadInitialState(): SelectionState {
  if (typeof window === "undefined") {
    return {
      operatorId: "",
      skillId: "",
      keyword: "",
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      operatorId: "",
      skillId: "",
      keyword: "",
    };
  }

  try {
    const parsed = JSON.parse(raw) as SelectionState;
    return {
      operatorId: typeof parsed.operatorId === "string" ? parsed.operatorId : "",
      skillId: typeof parsed.skillId === "string" ? parsed.skillId : "",
      keyword: typeof parsed.keyword === "string" ? parsed.keyword : "",
    };
  } catch {
    return {
      operatorId: "",
      skillId: "",
      keyword: "",
    };
  }
}

export const useSelectionStore = defineStore("selection", {
  state: (): SelectionState => loadInitialState(),
  actions: {
    persist() {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          operatorId: this.operatorId,
          skillId: this.skillId,
          keyword: this.keyword,
        }),
      );
    },
  },
});
