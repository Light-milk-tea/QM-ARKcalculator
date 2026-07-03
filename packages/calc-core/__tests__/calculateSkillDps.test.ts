import { describe, expect, it } from "vitest";
import type { CalculationInput, OperatorIndex } from "../src";
import { calculateSkillDps } from "../src";

const index: OperatorIndex = {
  operators: {
    exusiai_like: {
      id: "exusiai_like",
      name: "能天使样例",
      baseHealth: 1000,
      baseAttack: 700,
      baseDefense: 100,
      baseMagicResistance: 0,
      baseAttackInterval: 1,
      baseAttackSpeed: 0,
      modules: [
        {
          id: "mod-alpha",
          name: "强攻模块",
          stageBonuses: [
            { atk: 0, attackSpeed: 0 },
            { atk: 20, attackSpeed: 0 },
            { atk: 40, attackSpeed: 10 },
            { atk: 60, attackSpeed: 20 },
          ],
        },
        {
          id: "mod-beta",
          name: "速攻模块",
          stageBonuses: [
            { atk: 0, attackSpeed: 0 },
            { atk: 0, attackSpeed: 10 },
            { atk: 0, attackSpeed: 20 },
            { atk: 0, attackSpeed: 35 },
          ],
        },
      ],
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
      baseHealth: 1000,
      baseAttack: 1000,
      baseDefense: 80,
      baseMagicResistance: 10,
      baseAttackInterval: 1.6,
      baseAttackSpeed: 0,
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
      baseHealth: 900,
      baseAttack: 820,
      baseDefense: 90,
      baseMagicResistance: 0,
      baseAttackInterval: 1.3,
      baseAttackSpeed: 0,
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
    expect(result.formula.mainHit.length).toBeGreaterThan(0);
    expect(result.formula.schedule.length).toBeGreaterThan(0);
    expect(result.formula.summary.length).toBeGreaterThan(0);
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

  it("切换模组与阶段后数值应变化", () => {
    const baseInput = makeInput("exusiai_like", "s3");
    const noModule = calculateSkillDps(
      {
        ...baseInput,
        development: { moduleStage: 0 },
      },
      index,
    );
    const moduleAlpha = calculateSkillDps(
      {
        ...baseInput,
        development: { moduleId: "mod-alpha", moduleStage: 3 },
      },
      index,
    );
    const moduleBeta = calculateSkillDps(
      {
        ...baseInput,
        development: { moduleId: "mod-beta", moduleStage: 3 },
      },
      index,
    );

    expect(moduleAlpha.summary.dps).toBeGreaterThan(noModule.summary.dps);
    expect(moduleBeta.summary.dps).toBeGreaterThan(noModule.summary.dps);
    expect(moduleAlpha.summary.dps).not.toBe(moduleBeta.summary.dps);
  });
});
