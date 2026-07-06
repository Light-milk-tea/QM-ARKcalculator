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
            { atk: 0, attackSpeed: 0, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 20, attackSpeed: 0, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 40, attackSpeed: 10, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 60, attackSpeed: 20, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
          ],
        },
        {
          id: "mod-beta",
          name: "速攻模块",
          stageBonuses: [
            { atk: 0, attackSpeed: 0, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 0, attackSpeed: 10, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 0, attackSpeed: 20, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
            { atk: 0, attackSpeed: 35, atkScale: 1, damageScale: 1, defPenetrateFixed: 0, magicResistanceReduction: 0 },
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
    fang_like: {
      id: "fang_like",
      name: "芬样例",
      baseHealth: 1300,
      baseAttack: 325,
      baseDefense: 200,
      baseMagicResistance: 0,
      baseAttackInterval: 1,
      baseAttackSpeed: 0,
      defaultAttackType: "physical",
      skills: [
        {
          id: "utility",
          name: "无输出技能",
          durationSeconds: 0.1,
          attackScale: 1,
        },
      ],
    },
    spot_like: {
      id: "spot_like",
      name: "斑点样例",
      baseHealth: 1450,
      baseAttack: 350,
      baseDefense: 260,
      baseMagicResistance: 0,
      baseAttackInterval: 1.2,
      baseAttackSpeed: 0,
      defaultAttackType: "physical",
      skills: [
        {
          id: "skchr_spot_1",
          name: "次级治疗模式",
          durationSeconds: 25,
          attackScale: 1.45,
        },
      ],
    },
    kroos_like: {
      id: "char_124_kroos",
      name: "克洛丝样例",
      baseHealth: 1060,
      baseAttack: 375,
      baseDefense: 126,
      baseMagicResistance: 0,
      baseAttackInterval: 1,
      baseAttackSpeed: 0,
      defaultAttackType: "physical",
      skills: [
        {
          id: "skchr_kroos_1",
          name: "二连射",
          durationSeconds: 1,
          attackScale: 1.66,
          attackCount: 2,
        },
      ],
    },
    medic_like: {
      id: "medic_like",
      name: "治疗样例",
      baseHealth: 800,
      baseAttack: 450,
      baseDefense: 60,
      baseMagicResistance: 0,
      baseAttackInterval: 2.85,
      baseAttackSpeed: 0,
      defaultAttackType: "heal",
      skills: [
        {
          id: "heal_s1",
          name: "治疗强化",
          durationSeconds: 15,
          attackScale: 1,
          healScale: 1.2,
        },
      ],
    },
    incantation_like: {
      id: "incantation_like",
      name: "咒愈样例",
      baseHealth: 950,
      baseAttack: 600,
      baseDefense: 80,
      baseMagicResistance: 0,
      baseAttackInterval: 1.8,
      baseAttackSpeed: 0,
      subProfessionId: "incantationmedic",
      defaultAttackType: "magical",
      skills: [
        {
          id: "incant_s2",
          name: "伤疗转换",
          durationSeconds: 18,
          attackScale: 1.4,
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

  it("无输出瞬发技能不应被 0.1 秒放大 DPS", () => {
    const result = calculateSkillDps(makeInput("fang_like", "utility"), index);
    expect(result.schedule.duration).toBe(1);
    expect(result.summary.dps).toBeCloseTo(result.summary.totalDamage, 6);
  });

  it("斑点 S1 停攻技能应输出 0 伤害", () => {
    const result = calculateSkillDps(makeInput("spot_like", "skchr_spot_1"), index);
    expect(result.summary.hitDamage).toBe(0);
    expect(result.summary.totalDamage).toBe(0);
    expect(result.summary.dps).toBe(0);
    expect(result.streams[0].attackType).toBe("none");
    expect(
      result.ruleTrace.some(
        (rule) => rule.ruleId === "phase2.skill.stop_attacking_minset" && rule.applied,
      ),
    ).toBe(true);
  });

  it("克洛丝 S1 在条件开启时应叠加天赋期望倍率", () => {
    const on = calculateSkillDps(
      {
        ...makeInput("kroos_like", "skchr_kroos_1"),
        enemy: { defense: 0, magicResistance: 0 },
        battle: { conditionEnabled: true, minPhysicalDamageRatio: 0.05 },
      },
      index,
    );
    const off = calculateSkillDps(
      {
        ...makeInput("kroos_like", "skchr_kroos_1"),
        enemy: { defense: 0, magicResistance: 0 },
        battle: { conditionEnabled: false, minPhysicalDamageRatio: 0.05 },
      },
      index,
    );
    expect(on.summary.hitDamage / off.summary.hitDamage).toBeCloseTo(1.12, 6);
    expect(
      on.ruleTrace.some(
        (rule) => rule.ruleId === "phase2.kroos1.expected_talent_scale" && rule.applied,
      ),
    ).toBe(true);
  });

  it("治疗技能应输出 HPS 与治疗流", () => {
    const result = calculateSkillDps(makeInput("medic_like", "heal_s1"), index);
    expect(result.healing.enabled).toBe(true);
    expect(result.healing.hps).toBeGreaterThan(0);
    expect(result.healing.streams.some((stream) => stream.id === "HEAL_MAIN")).toBe(true);
    expect(result.formula.healing?.length ?? 0).toBeGreaterThan(0);
  });

  it("咒愈师应输出伤害转治疗流", () => {
    const result = calculateSkillDps(makeInput("incantation_like", "incant_s2"), index);
    expect(result.healing.enabled).toBe(true);
    expect(result.healing.streams.some((stream) => stream.id === "HEAL_FROM_DAMAGE")).toBe(true);
  });
});
