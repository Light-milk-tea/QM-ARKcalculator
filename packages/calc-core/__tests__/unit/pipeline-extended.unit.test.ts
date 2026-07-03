import { describe, expect, it } from "vitest";
import type { CalculationInput, OperatorIndex, RuleDefinition } from "../../src";
import { calculateSkillDps } from "../../src";

const index: OperatorIndex = {
  operators: {
    ext_case: {
      id: "ext_case",
      name: "扩展能力样例",
      baseHealth: 1000,
      baseAttack: 1000,
      baseDefense: 100,
      baseMagicResistance: 0,
      baseAttackInterval: 1.2,
      baseAttackSpeed: 0,
      defaultAttackType: "physical",
      skills: [
        {
          id: "ext_skill",
          name: "扩展排程技能",
          durationSeconds: 12,
          attackScale: 1.2,
          damageScale: 1,
        },
      ],
    },
  },
};

const baseInput: CalculationInput = {
  selection: { operatorId: "ext_case", skillId: "ext_skill" },
  enemy: { defense: 400, magicResistance: 20 },
  battle: { conditionEnabled: false, minPhysicalDamageRatio: 0.05 },
};

describe("pipeline-extended-unit", () => {
  it("支持独立附加法伤流的间隔/时长", () => {
    const rules: RuleDefinition[] = [
      {
        id: "unit.extra.magical_stream",
        scope: "skill",
        match: () => true,
        transform: (effects) => ({
          ...effects,
          extraAttackType: "magical",
          extraAttackScale: 0.5,
          extraAttackInterval: 2,
          extraDuration: 6,
        }),
        note: "单测：附加法伤流",
      },
    ];
    const result = calculateSkillDps(baseInput, index, rules);
    const extra = result.streams.find((stream) => stream.id === "OTHER_MAGICAL");
    expect(extra).toBeDefined();
    expect(extra?.attackType).toBe("magical");
    expect(extra?.interval).toBe(2);
    expect(extra?.duration).toBe(6);
    expect(extra?.totalDamage).toBeGreaterThan(0);
  });

  it("支持弹药口径下的 DPS 结算", () => {
    const rules: RuleDefinition[] = [
      {
        id: "unit.ammo.window",
        scope: "skill",
        match: () => true,
        transform: (effects) => ({
          ...effects,
          attackCountOverride: 1,
          ammoCount: 3,
        }),
        note: "单测：弹药窗口",
      },
    ];
    const result = calculateSkillDps(baseInput, index, rules);
    expect(result.schedule.ammoCount).toBe(3);
    expect(result.schedule.attackCount).toBe(1);
    expect(result.summary.dps).toBeGreaterThan(0);
    expect(result.summary.totalDamage).toBeGreaterThanOrEqual(result.summary.hitDamage * 3);
  });

  it("支持持续时间覆盖和调整", () => {
    const rules: RuleDefinition[] = [
      {
        id: "unit.duration.override",
        scope: "skill",
        match: () => true,
        transform: (effects) => ({
          ...effects,
          durationOverride: 5,
          durationAdjustment: 2,
        }),
        note: "单测：时长覆盖",
      },
    ];
    const result = calculateSkillDps(baseInput, index, rules);
    expect(result.schedule.duration).toBe(7);
    expect(result.formula.schedule.some((step) => step.key === "duration")).toBe(true);
  });
});
