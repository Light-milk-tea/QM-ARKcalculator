import type { RuleDefinition } from "./types";

export const phase1CustomRules: RuleDefinition[] = [
  {
    id: "phase1.lava.s1.schedule_parity",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_121_lava" && ctx.skill.id === "skcom_magic_rage[1]",
    transform: (effects) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + 8,
    }),
    note: "第一批迁移：炎熔S1排程口径对齐旧版。",
  },
  {
    id: "phase1.gdglow3.multi_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_gdglow_3",
    transform: (effects) => ({
      ...effects,
      attackScale: Math.max(effects.attackScale, 1.8),
    }),
    note: "第一批迁移：澄闪S3多段主流修正。",
  },
  {
    id: "phase1.chen2s3.holiday_trigger_window",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_chen2_3",
    transform: (effects, ctx) => ({
      ...effects,
      defShredFlat: ctx.battle.conditionEnabled ? Math.max(effects.defShredFlat, 220) : effects.defShredFlat,
      extraTrueDamageScale: ctx.battle.conditionEnabled
        ? Math.max(effects.extraTrueDamageScale, 0.15)
        : effects.extraTrueDamageScale,
    }),
    note: "第一批迁移：假日威龙陈S3触发窗与减防语义修正。",
  },
  {
    id: "phase1.mizuki2.attack_interval_shift",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_mizuki_2",
    transform: (effects) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + 90,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.3),
    }),
    note: "第一批迁移：水月S2攻间位移语义近似修正。",
  },
  {
    id: "phase1.thorns3.stable_stage",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_thorns_3",
    transform: (effects, ctx) => ({
      ...effects,
      atkBuffRatio: ctx.battle.conditionEnabled ? Math.max(effects.atkBuffRatio, 1.2) : effects.atkBuffRatio,
      attackSpeedBonus: ctx.battle.conditionEnabled
        ? effects.attackSpeedBonus + 50
        : effects.attackSpeedBonus,
    }),
    note: "第一批迁移：棘刺S3稳定阶段口径修正。",
  },
  {
    id: "phase1.chen2.instant_multi_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_chen_2",
    transform: (effects) => ({
      ...effects,
      attackScale: Math.max(effects.attackScale, 5),
      attackSpeedBonus: effects.attackSpeedBonus + 80,
    }),
    note: "第一批迁移：陈S2瞬发多段结算修正。",
  },
  {
    id: "phase1.horn3.conditional_overload",
    scope: "skill",
    match: (ctx) =>
      ctx.skill.id === "skchr_horn_3" &&
      ctx.battle.conditionEnabled,
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 1.4),
      attackSpeedBonus: effects.attackSpeedBonus + 120,
    }),
    note: "第一批迁移：号角S3过载阶段条件修正。",
  },
  {
    id: "phase1.texas2.appear_extra_stream",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_texas2_3",
    transform: (effects) => ({
      ...effects,
      extraTrueDamageScale: Math.max(effects.extraTrueDamageScale, 0.4),
    }),
    note: "第一批迁移：缄默德克萨斯S3额外伤害流修正。",
  },
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
