import type { RuleDefinition } from "./types";

export const phase1CustomRules: RuleDefinition[] = [
  {
    id: "phase1.damage_type.switch_magical",
    scope: "skill",
    match: (ctx) => (ctx.skill.customTags ?? []).includes("switch_magical"),
    transform: (effects) => ({
      ...effects,
      attackType: "magical",
    }),
    note: "第一批迁移：伤害类型切换。",
  },
  {
    id: "phase1.defense.shred_ratio",
    scope: "skill",
    match: (ctx) =>
      ctx.battle.conditionEnabled &&
      (ctx.skill.customTags ?? []).includes("def_shred"),
    transform: (effects) => ({
      ...effects,
      defShredRate: Math.max(effects.defShredRate, 0.3),
    }),
    note: "第一批迁移：条件破甲规则。",
  },
  {
    id: "phase1.other_stream.extra_true",
    scope: "skill",
    match: (ctx) => (ctx.skill.customTags ?? []).includes("extra_true"),
    transform: (effects) => ({
      ...effects,
      extraTrueDamageScale: Math.max(effects.extraTrueDamageScale, 0.25),
    }),
    note: "第一批迁移：附加真实伤害流。",
  },
  {
    id: "phase1.duration.burst_short_window",
    scope: "skill",
    match: (ctx) => (ctx.skill.customTags ?? []).includes("burst_short"),
    transform: (effects, ctx) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + (ctx.battle.conditionEnabled ? 20 : 10),
    }),
    note: "第一批迁移：短时爆发技能排程修正。",
  },
];
