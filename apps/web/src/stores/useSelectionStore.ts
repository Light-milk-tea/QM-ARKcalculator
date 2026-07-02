import { defineStore } from "pinia";

type SelectionState = {
  operatorId: string;
  skillId: string;
  keyword: string;
};

export const useSelectionStore = defineStore("selection", {
  state: (): SelectionState => ({
    operatorId: "",
    skillId: "",
    keyword: "",
  }),
});
