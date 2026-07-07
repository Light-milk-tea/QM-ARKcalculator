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
      attackCountOverride: 48.4615384615,
    }),
    note: "第一批迁移修订：澄闪S3沿用旧口径固定主流段数。",
  },
  {
    id: "phase1.chen2s3.holiday_trigger_window",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_chen2_3",
    transform: (effects, ctx) => ({
      ...effects,
      attackScale: effects.attackScale * 1.14,
      attackIntervalAdjustment: effects.attackIntervalAdjustment + 0.4,
      ammoCount: Math.max(effects.ammoCount, 32),
      defShredFlat: ctx.battle.conditionEnabled ? Math.max(effects.defShredFlat, 220) : effects.defShredFlat,
      extraTrueDamageScale: 0,
    }),
    note: "第一批迁移修订：假日威龙陈S3回退到旧口径的弹药窗与主流结算。",
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
    note: "第一批迁移修订：陈S2按旧口径作为瞬发结算，避免总伤重复叠乘。",
  },
  {
    id: "phase1.horn3.base_overload_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_horn_3",
    transform: (effects) => ({
      ...effects,
    }),
    note: "第一批迁移修订：号角S3默认沿用基础结算。",
  },
  {
    id: "phase1.horn3.conditional_overload",
    scope: "skill",
    match: (ctx) =>
      ctx.skill.id === "skchr_horn_3" &&
      ctx.battle.conditionEnabled,
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 1.55),
      attackSpeedBonus: effects.attackSpeedBonus + 40,
    }),
    note: "第一批迁移修订：号角S3条件开启时进一步抬升，保留 on > off 行为。",
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
    id: "phase1.ifrit2.burn_resistance_semantic",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_ifrit_2",
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.4),
      attackScale: Math.max(effects.attackScale, 1.45),
      // 保持现阶段数值口径稳定，后续再引入更精细减抗分段模型。
      magicResistanceReductionFlat: effects.magicResistanceReductionFlat,
    }),
    note: "第一批迁移：伊芙利特S2减抗语义显式化，替换防御代理口径。",
  },
  {
    id: "phase1.cerber2.hotblade_aspd_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_cerber_2",
    transform: (effects) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + 65,
      attackScale: Math.max(effects.attackScale, 1.2),
    }),
    note: "第一批迁移：刻俄柏S2高频打击语义近似。",
  },
  {
    id: "phase1.mlynar3.verdict_true_stream",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_mlynar_3",
    transform: (effects, ctx) => ({
      ...effects,
      attackScale: Math.max(effects.attackScale, 2.4),
      defShredRate: Math.max(effects.defShredRate, 0.55),
      extraTrueDamageScale: ctx.battle.conditionEnabled
        ? Math.max(effects.extraTrueDamageScale, 0.35)
        : effects.extraTrueDamageScale,
    }),
    note: "第一批迁移：玛恩纳S3裁决附伤与破甲语义近似。",
  },
  {
    id: "phase1.ghost23.burst_threshold_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_ghost2_3",
    transform: (effects, ctx) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.55),
      attackScale: Math.max(effects.attackScale, 1.9),
      attackSpeedBonus: effects.attackSpeedBonus + 35,
      extraTrueDamageScale: ctx.battle.conditionEnabled
        ? Math.max(effects.extraTrueDamageScale, 0.12)
        : effects.extraTrueDamageScale,
    }),
    note: "第一批迁移：归鲨S3阈值爆发近似处理。",
  },
  {
    id: "phase1.ironmn2.iter_amp_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_ironmn_2",
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.45),
      attackSpeedBonus: effects.attackSpeedBonus + 45,
      attackScale: Math.max(effects.attackScale, 1.1),
    }),
    note: "第一批迁移：白铁S2增幅节奏语义近似。",
  },
  {
    id: "phase1.qiubai3.switch_magical_burst",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_qiubai_3",
    transform: (effects) => ({
      ...effects,
      attackType: "magical",
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.9),
      attackSpeedBonus: effects.attackSpeedBonus + 80,
    }),
    note: "第一批迁移：仇白S3法伤化与爆发近似。",
  },
  {
    id: "phase1.logos3.arts_burst_variant",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_logos_3",
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.75),
      attackScale: Math.max(effects.attackScale, 1.7),
    }),
    note: "第一批迁移：逻各斯S3高阶术式爆发近似。",
  },
  {
    id: "phase1.reed23.burn_echo_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_reed2_3",
    transform: (effects, ctx) => ({
      ...effects,
      atkBuffRatio: Math.max(effects.atkBuffRatio, 0.65),
      attackScale: Math.max(effects.attackScale, 1.4),
      extraTrueDamageScale: ctx.battle.conditionEnabled
        ? Math.max(effects.extraTrueDamageScale, 0.3)
        : effects.extraTrueDamageScale,
    }),
    note: "第一批迁移：焰影苇草S3灼地回响近似。",
  },
  {
    id: "phase1.surtr3.instant_dps_window",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_surtr_3",
    transform: (effects) => ({
      ...effects,
      attackTimes: 0,
      durationOverride: 1.25,
      attackCountOverride: 1,
    }),
    note: "第一批迁移修订：史尔特尔S3按旧口径由持续窗口计算 DPS。",
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
  {
    id: "phase2.skill.stop_attacking_minset",
    scope: "skill",
    match: (ctx) =>
      new Set([
        "skchr_myrtle_1",
        "skchr_myrtle_2",
        "skchr_podego_1",
        "skchr_gummy_1",
        "skchr_spot_1",
      ]).has(ctx.skill.id),
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第二批最小迁移：停攻技能标记为 none，避免错误输出伤害。",
  },
  {
    id: "phase2.kroos1.expected_talent_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_124_kroos" && ctx.skill.id === "skchr_kroos_1",
    transform: (effects, ctx) => ({
      ...effects,
      attackScale: effects.attackScale * (ctx.battle.conditionEnabled ? 1.12 : 1),
    }),
    note: "第二批最小迁移：克洛丝天赋期望倍率按条件开关生效。",
  },
  {
    id: "phase2.adnach.attack_speed_talent",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_211_adnach",
    transform: (effects) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + 8,
    }),
    note: "第二批最小迁移：安德切尔天赋攻速常驻加成。",
  },
  {
    id: "phase2.skill.magical_extra_stream_minset",
    scope: "skill",
    match: (ctx) =>
      new Set([
        "skchr_indigo_2",
        "skchr_whitew_1",
        "skchr_liesel_2",
      ]).has(ctx.skill.id),
    transform: (effects) => ({
      ...effects,
      extraAttackType: "magical",
      extraAttackScale: Math.max(effects.extraAttackScale, 0.35),
      extraAttackInterval: effects.extraAttackInterval ?? 1,
    }),
    note: "第二批最小迁移：附加法伤流基础口径。",
  },
  {
    id: "phase2.funnel.trait_extra_stream",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_328_cammou" && ctx.skill.id === "skcom_atk_up[2]",
    transform: (effects) => ({
      ...effects,
      // 旧项目口径下，卡达该样例还叠加了分支常驻攻速（等效 +18）。
      attackSpeedBonus: effects.attackSpeedBonus + 18,
      extraAttackType: "magical",
      extraAttackScale: effects.disableTraitExtra
        ? effects.extraAttackScale
        : Math.max(effects.extraAttackScale, 1.1),
    }),
    note: "第二批最小迁移：驭械术师分支附加法伤流（旧口径 1.1x）。",
  },
  {
    id: "phase2.indigo1.attack_count_proxy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_indigo_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: Math.max(effects.attackCountOverride ?? 0, 20 / 3),
    }),
    note: "第二批最小迁移：深靛S1按旧口径使用固定段数。",
  },
  {
    id: "phase2.jesica1.single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_jesica_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：杰西卡S1按旧口径视为单次结算。",
  },
  {
    id: "phase2.shotst1.defense_break_single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_shotst_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.4,
      attackCountOverride: 1,
      defShredRate: Math.max(effects.defShredRate, 0.35),
    }),
    note: "第二批最小迁移：流星S1按旧口径叠加天赋倍率并单次破甲结算（35%减防）。",
  },
  {
    id: "phase2.mm1.single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_mm_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：梅S1按旧口径视为单次结算。",
  },
  {
    id: "phase2.pinecn1.single_hit_penetrate",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_pinecn_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.5,
      attackCountOverride: 1,
      defPenetrateFixed: Math.max(effects.defPenetrateFixed, 250),
    }),
    note: "第二批最小迁移：松果S1按旧口径应用散射手倍率与固定穿防并单次结算。",
  },
  {
    id: "phase2.glaze1.interval_legacy",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_glaze_1",
    transform: (effects) => ({
      ...effects,
      attackSpeedBonus: effects.attackSpeedBonus + 6,
    }),
    note: "第二批最小迁移：安比尔S1按旧口径修正攻速。",
  },
  {
    id: "phase2.totter1.single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_totter_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：铅踝S1按旧口径视为单次结算。",
  },
  {
    id: "phase2.caper1.expected_talent",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_caper_1",
    transform: (effects, ctx) => ({
      ...effects,
      attackScale: effects.attackScale * (ctx.battle.conditionEnabled ? 1.15 : 1),
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：跃跃S1按条件开关叠加天赋期望倍率并单次结算。",
  },
  {
    id: "phase2.vigna1.expected_talent_attack",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_vigna_1",
    transform: (effects, ctx) => ({
      ...effects,
      atkBuffRatio: effects.atkBuffRatio + (ctx.battle.conditionEnabled ? 0.33 : 0),
    }),
    note: "第二批最小迁移：红豆S1在条件开启时叠加天赋期望攻击加成。",
  },
  {
    id: "phase2.myrtle.shared_cost_stop_attack",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_151_myrtle" && ctx.skill.id === "skcom_assist_cost[2]",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第二批最小迁移：桃金娘共享回费技能按停攻口径结算。",
  },
  {
    id: "phase2.wintim1.single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_wintim_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：冬时S1按旧口径视为单次结算。",
  },
  {
    id: "phase2.doberm1.single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_doberm_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：杜宾S1按旧口径视为单次结算。",
  },
  {
    id: "phase2.cutter1.multi_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_cutter_1",
    transform: (effects) => ({
      ...effects,
      attackCountOverride: Math.max(effects.attackCountOverride ?? 0, 4),
    }),
    note: "第二批最小迁移：刻刀S1按旧口径使用四段结算。",
  },
  {
    id: "phase2.utage1.stop_attack",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_utage_1",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第二批最小迁移：宴S1按旧口径停攻。",
  },
  {
    id: "phase2.spikes1.double_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_spikes_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.43,
      attackCountOverride: Math.max(effects.attackCountOverride ?? 0, 23.0769230769),
    }),
    note: "第二批最小迁移：芳汀S1按旧口径叠加天赋倍率并使用双段时窗结算。",
  },
  {
    id: "phase2.wscoot1.guard_counter",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_wscoot_1",
    transform: (effects) => ({
      ...effects,
      atkBuffRatio: effects.atkBuffRatio + 2,
      defShredRate: 0,
      extraAttackType: "physical",
      extraAttackScale: Math.max(effects.extraAttackScale, 0.43),
    }),
    note: "第二批最小迁移：骋风S1按旧口径追加反击流并取消正向def键减防代理。",
  },
  {
    id: "phase2.heal.default_heal_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.defaultAttackType === "heal" && (ctx.skill.healScale ?? 0) <= 0,
    transform: (effects) => ({
      ...effects,
      healScale: Math.max(effects.healScale, 1),
    }),
    note: "第二批最小迁移：治疗职业默认治疗倍率兜底。",
  },
  {
    id: "phase2.heal.incantation_ratio",
    scope: "skill",
    match: (ctx) => ctx.operator.subProfessionId === "incantationmedic",
    transform: (effects) => ({
      ...effects,
      healFromDamageRatio: Math.max(effects.healFromDamageRatio, 0.5),
    }),
    note: "第二批最小迁移：咒愈师按伤害转治疗口径结算。",
  },
  {
    id: "phase2.heal.finlpp.legacy_alignment",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_385_finlpp",
    transform: (effects, ctx) => ({
      ...effects,
      // 与旧项目保持一致：清流的 heal_scale / attack@heal_scale 不直接作为最终治疗倍率使用。
      healScale: 1,
      // 清流 S2（涌泉）在旧口径中包含 +0.12 的攻间修正。
      attackIntervalAdjustment:
        ctx.skill.id === "skchr_finlpp_2"
          ? effects.attackIntervalAdjustment + 0.12
          : effects.attackIntervalAdjustment,
    }),
    note: "第二批最小迁移：清流治疗倍率与排程口径对齐旧项目。",
  },
];
