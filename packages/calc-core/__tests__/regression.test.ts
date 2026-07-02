import { describe, expect, it } from "vitest";
import type { CalculationInput, OperatorIndex } from "../src";
import { calculateSkillDps } from "../src";

const sampleIndex: OperatorIndex = {
  operators: {
    phys: {
      id: "phys",
      name: "物理样例",
      baseHealth: 1000,
      baseAttack: 600,
      baseDefense: 100,
      baseMagicResistance: 0,
      baseAttackInterval: 1,
      defaultAttackType: "physical",
      skills: [{ id: "s1", name: "物理技能", durationSeconds: 10, attackScale: 1.5 }],
    },
    arts: {
      id: "arts",
      name: "法术样例",
      baseHealth: 1200,
      baseAttack: 950,
      baseDefense: 80,
      baseMagicResistance: 10,
      baseAttackInterval: 1.6,
      defaultAttackType: "magical",
      skills: [{ id: "s2", name: "法术技能", durationSeconds: 15, attackScale: 1.8 }],
    },
    switcher: {
      id: "switcher",
      name: "切换态样例",
      baseHealth: 1500,
      baseAttack: 800,
      baseDefense: 120,
      baseMagicResistance: 0,
      baseAttackInterval: 1.2,
      defaultAttackType: "physical",
      skills: [
        {
          id: "s3",
          name: "切换法术技能",
          durationSeconds: 12,
          attackScale: 2,
          customTags: ["switch_magical"],
        },
      ],
    },
  },
};

function buildInput(operatorId: string, skillId: string): CalculationInput {
  return {
    selection: { operatorId, skillId },
    enemy: { defense: 500, magicResistance: 20 },
    battle: { conditionEnabled: false, minPhysicalDamageRatio: 0.05 },
  };
}

describe("regression-baseline", () => {
  it("三个代表干员结果稳定且有限", () => {
    const cases: Array<[string, string, number]> = [
      ["phys", "s1", 350],
      ["arts", "s2", 700],
      ["switcher", "s3", 1000],
    ];

    for (const [operatorId, skillId, minDps] of cases) {
      const result = calculateSkillDps(buildInput(operatorId, skillId), sampleIndex);
      expect(Number.isFinite(result.summary.totalDamage)).toBe(true);
      expect(Number.isFinite(result.summary.dps)).toBe(true);
      expect(result.summary.dps).toBeGreaterThan(minDps);
    }
  });
});
