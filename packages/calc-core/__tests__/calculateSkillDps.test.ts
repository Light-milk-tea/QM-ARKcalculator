import { describe, expect, it } from "vitest";
import type { CalculationInput, OperatorIndex } from "../src";
import { calculateSkillDps } from "../src";

const index: OperatorIndex = {
  operators: {
    exusiai_like: {
      id: "exusiai_like",
      name: "能天使样例",
      baseAttack: 700,
      baseAttackInterval: 1,
      defaultAttackType: "physical",
      skills: [
        {
          id: "s3",
          name: "过载模式",
          durationSeconds: 15,
          attackScale: 1.15,
          atkBuffRatio: 0.4,
          attackSpeedBonus: 30,
          customTags: ["def_shred"],
        },
      ],
    },
    eyja_like: {
      id: "eyja_like",
      name: "艾雅法拉样例",
      baseAttack: 1000,
      baseAttackInterval: 1.6,
      defaultAttackType: "magical",
      skills: [
        {
          id: "s2",
          name: "点燃",
          durationSeconds: 20,
          attackScale: 1.9,
          damageScale: 1.1,
          attackSpeedBonus: 20,
        },
      ],
    },
    amiya_like: {
      id: "amiya_like",
      name: "阿米娅样例",
      baseAttack: 820,
      baseAttackInterval: 1.3,
      defaultAttackType: "physical",
      skills: [
        {
          id: "s3",
          name: "奇美拉",
          durationSeconds: 12,
          attackScale: 2.2,
          customTags: ["switch_magical", "extra_true"],
        },
      ],
    },
  },
};

function makeInput(operatorId: string, skillId: string): CalculationInput {
  return {
    selection: { operatorId, skillId },
    enemy: { defense: 900, magicResistance: 30 },
    battle: { conditionEnabled: true, minPhysicalDamageRatio: 0.05 },
  };
}

describe("calculateSkillDps", () => {
  it("计算物理技能并命中破甲规则", () => {
    const result = calculateSkillDps(makeInput("exusiai_like", "s3"), index);
    expect(result.summary.totalDamage).toBeGreaterThan(0);
    expect(
      result.ruleTrace.some(
        (rule) => rule.ruleId === "phase1.defense.shred_ratio" && rule.applied,
      ),
    ).toBe(true);
    expect(result.schedule.attackCount).toBeGreaterThan(1);
  });

  it("计算法术技能", () => {
    const result = calculateSkillDps(makeInput("eyja_like", "s2"), index);
    expect(result.streams[0].attackType).toBe("magical");
    expect(result.summary.dps).toBeGreaterThan(300);
  });

  it("计算切换法术并追加真实伤害", () => {
    const result = calculateSkillDps(makeInput("amiya_like", "s3"), index);
    expect(result.streams.length).toBe(2);
    expect(result.streams[1].attackType).toBe("true");
    expect(result.summary.totalDamage).toBeGreaterThan(result.streams[0].totalDamage);
  });
});
