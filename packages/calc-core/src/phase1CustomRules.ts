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
    id: "phase2.gravel1.no_def_shred_single_hit",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_gravel_1",
    transform: (effects) => ({
      ...effects,
      // 砾 S1 的 def 是自身防御强化语义，不应映射为敌方减防。
      defShredRate: 0,
      // 旧项目该样例按单次结算口径输出。
      attackCountOverride: 1,
    }),
    note: "第二批最小迁移：砾S1取消减防代理并按单次结算对齐旧口径。",
  },
  {
    id: "phase2.strong1.infected_expected_scale",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_strong_1" && ctx.battle.conditionEnabled,
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.5,
      durationOverride: Math.max(effects.durationOverride ?? 0, 2),
    }),
    note: "第二批最小迁移：孑S1按旧口径叠加条件天赋倍率并使用2秒结算窗口。",
  },
  {
    id: "phase2.sunbr1.expected_talent_scale",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_sunbr_1" && ctx.battle.conditionEnabled,
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.18,
    }),
    note: "第二批最小迁移：古米S1按旧口径叠加条件天赋期望倍率。",
  },
  {
    id: "phase2.skgoat1.switch_magical",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_183_skgoat" && ctx.skill.id === "skcom_atk_up[2]",
    transform: (effects) => ({
      ...effects,
      attackType: "magical",
    }),
    note: "第二批最小迁移：地灵首技能按旧口径作为法术伤害结算。",
  },
  {
    id: "phase2.pithst1.switch_magical",
    scope: "skill",
    match: (ctx) => ctx.skill.id === "skchr_pithst_1",
    transform: (effects) => ({
      ...effects,
      attackType: "magical",
    }),
    note: "第二批最小迁移：盟约辅助首技能按旧口径作为法术伤害结算。",
  },
  {
    id: "phase2.ctrail1.expected_talent_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4165_ctrail" && ctx.skill.id === "skchr_ctrail_1",
    transform: (effects, ctx) => ({
      ...effects,
      attackScale: effects.attackScale * (ctx.battle.conditionEnabled ? 1.12 : 1),
    }),
    note: "第二批最小迁移：云迹S1按条件开关叠加天赋期望倍率。",
  },
  {
    id: "phase2.bubble1.no_def_shred_proxy",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_381_bubble" && ctx.skill.id === "skcom_def_up[2]",
    transform: (effects) => ({
      ...effects,
      defShredRate: 0,
    }),
    note: "第二批最小迁移：泡泡S1的 def 不作为敌方减防代理。",
  },
  {
    id: "phase2.robrta1.no_def_shred_proxy",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_484_robrta" && ctx.skill.id === "skchr_robrta_1",
    transform: (effects) => ({
      ...effects,
      defShredRate: 0,
    }),
    note: "第二批最小迁移：罗比菈塔S1的 def 不作为敌方减防代理。",
  },
  {
    id: "phase2.vrdant1.no_def_shred_proxy",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4107_vrdant" && ctx.skill.id === "skchr_vrdant_1",
    transform: (effects) => ({
      ...effects,
      defShredRate: 0,
    }),
    note: "第二批最小迁移：维荻S1的 magic_resistance 不走减防代理。",
  },
  {
    id: "phase2.deepcl1.legacy_timing_and_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_110_deepcl" && ctx.skill.id === "skchr_deepcl_1",
    transform: (effects) => ({
      ...effects,
      attackType: "magical",
      atkBuffRatio: 0,
      attackSpeedBonus: effects.attackSpeedBonus + 8,
    }),
    note: "第二批最小迁移：深海色S1按旧口径关闭 atk 乘区并补齐攻速。",
  },
  {
    id: "phase3.apionr1.attack_count_legacy",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_513_apionr" && ctx.skill.id === "skchr_apionr_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (8 / 7),
      attackCountOverride: Math.max(effects.attackCountOverride ?? 0, 7),
    }),
    note: "第三批最小迁移：郁金香S1按旧口径修正7段结算与倍率。",
  },
  {
    id: "phase3.makiri1.stop_attack",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4199_makiri" && ctx.skill.id === "skchr_makiri_1",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第三批最小迁移：松桐S1按旧口径停攻。",
  },
  {
    id: "phase3.fang2s1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_1036_fang2" && ctx.skill.id === "skchr_fang2_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (2 / 3),
    }),
    note: "第三批最小迁移：历阵锐枪芬S1按旧口径回退攻击倍率。",
  },
  {
    id: "phase3.rfalcn1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4023_rfalcn" && ctx.skill.id === "skcom_charge_cost[3]",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.088,
    }),
    note: "第三批最小迁移：红隼S1按旧口径补齐倍率。",
  },
  {
    id: "phase3.elysm1.stop_attack",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_401_elysm" && ctx.skill.id === "skcom_assist_cost[3]",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第三批最小迁移：极境S1按旧口径停攻。",
  },
  {
    id: "phase3.wanqin1.stop_attack",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4119_wanqin" && ctx.skill.id === "skcom_assist_cost[3]",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第三批最小迁移：万顷S1按旧口径停攻。",
  },
  {
    id: "phase3.blkngt1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_476_blkngt" && ctx.skill.id === "skchr_blkngt_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.08,
    }),
    note: "第三批最小迁移：夜半S1按旧口径补齐倍率。",
  },
  {
    id: "phase3.ctable1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_497_ctable" && ctx.skill.id === "skchr_ctable_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.19,
    }),
    note: "第三批最小迁移：晓歌S1按旧口径修正倍率。",
  },
  {
    id: "phase3.puzzle1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4017_puzzle" && ctx.skill.id === "skchr_puzzle_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (25 / 24),
    }),
    note: "第三批最小迁移：谜图S1按旧口径修正倍率。",
  },
  {
    id: "phase3.chilc1.stop_attack",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4144_chilc" && ctx.skill.id === "skchr_chilc_1",
    transform: (effects) => ({
      ...effects,
      attackType: "none",
      disableTraitExtra: true,
    }),
    note: "第三批最小迁移：齐尔查克S1按旧口径停攻。",
  },
  {
    id: "phase3.surfer1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4052_surfer" && ctx.skill.id === "skchr_surfer_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.05,
    }),
    note: "第三批最小迁移：寻澜S1按旧口径修正倍率。",
  },
  {
    id: "phase3.swire1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_308_swire" && ctx.skill.id === "skchr_swire_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (25 / 28),
    }),
    note: "第三批最小迁移：诗怀雅S1按旧口径回退倍率。",
  },
  {
    id: "phase4.sophia1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_265_sophia" && ctx.skill.id === "skchr_sophia_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.08,
    }),
    note: "第四批最小迁移：鞭刃S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.bryota1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4106_bryota" && ctx.skill.id === "skchr_bryota_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 0.875,
    }),
    note: "第四批最小迁移：苍苔S1按旧口径回退倍率。",
  },
  {
    id: "phase4.flint1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_415_flint" && ctx.skill.id === "skchr_flint_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 0.9425,
    }),
    note: "第四批最小迁移：燧石S1按旧口径修正倍率。",
  },
  {
    id: "phase4.astesi1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_274_astesi" && ctx.skill.id === "skchr_astesi_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.05,
    }),
    note: "第四批最小迁移：星极S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.noirc21.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_1030_noirc2" && ctx.skill.id === "skchr_noirc2_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.121495327103,
    }),
    note: "第四批最小迁移：火龙S黑角S1按旧口径修正倍率。",
  },
  {
    id: "phase4.akafyu1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_475_akafyu" && ctx.skill.id === "skchr_akafyu_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 2,
    }),
    note: "第四批最小迁移：赤冬S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.crow1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_421_crow" && ctx.skill.id === "skchr_crow_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 2,
    }),
    note: "第四批最小迁移：羽毛笔S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.highmo1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4066_highmo" && ctx.skill.id === "skchr_highmo_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 2,
    }),
    note: "第四批最小迁移：海沫S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.takila1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_486_takila" && ctx.skill.id === "skchr_takila_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 3,
    }),
    note: "第四批最小迁移：龙舌兰S1按旧口径补齐倍率。",
  },
  {
    id: "phase4.graceb1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4187_graceb" && ctx.skill.id === "skchr_graceb_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.823529411765,
    }),
    note: "第四批最小迁移：聆音S1按旧口径补齐倍率。",
  },
  {
    id: "phase5.rdoc1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4125_rdoc" && ctx.skill.id === "skchr_rdoc_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 3,
      attackTimes: 0,
      durationOverride: 10.85,
    }),
    note: "第五批最小迁移：医生S1按旧口径补齐倍率与持续时间。",
  },
  {
    id: "phase5.aguard1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_508_aguard" && ctx.skill.id === "skchr_aguard_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (1 / 3),
    }),
    note: "第五批最小迁移：Sharp S1按旧口径回退倍率。",
  },
  {
    id: "phase5.tiger1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_155_tiger" && ctx.skill.id === "skchr_tiger_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 0.65,
    }),
    note: "第五批最小迁移：因陀罗S1按旧口径回退倍率。",
  },
  {
    id: "phase5.dagda1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_157_dagda" && ctx.skill.id === "skchr_dagda_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 0.78,
    }),
    note: "第五批最小迁移：达格达S1按旧口径回退倍率。",
  },
  {
    id: "phase5.whitew1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_140_whitew" && ctx.skill.id === "skchr_whitew_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (20 / 27),
      durationOverride: 1.3,
    }),
    note: "第五批最小迁移：拉普兰德S1按旧口径回退倍率并修正持续时间。",
  },
  {
    id: "phase5.ayer1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_294_ayer" && ctx.skill.id === "skchr_ayer_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * (1 / 3),
    }),
    note: "第五批最小迁移：断崖S1按旧口径回退倍率。",
  },
  {
    id: "phase5.leto1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_194_leto" && ctx.skill.id === "skcom_quickattack[3]",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.165517241379,
    }),
    note: "第五批最小迁移：烈夏S1按旧口径补齐倍率。",
  },
  {
    id: "phase5.fuze1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4126_fuze" && ctx.skill.id === "skchr_fuze_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 0.904761904762,
      attackTimes: 0,
      durationOverride: 63.157894736842,
    }),
    note: "第五批最小迁移：导火索S1按旧口径补齐倍率与持续时间。",
  },
  {
    id: "phase5.varkis1.legacy_scale",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4166_varkis" && ctx.skill.id === "skchr_varkis_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 3.36,
    }),
    note: "第五批最小迁移：摆渡人S1按旧口径补齐倍率。",
  },
  {
    id: "phase5.graceb1.fine_tune",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_4187_graceb" && ctx.skill.id === "skchr_graceb_1",
    transform: (effects) => ({
      ...effects,
      attackScale: effects.attackScale * 1.005338626244,
    }),
    note: "第五批最小迁移：聆音S1微调至旧口径容差内。",
  },
  {
    id: "phase5.noirc21.instant_window",
    scope: "skill",
    match: (ctx) => ctx.operator.id === "char_1030_noirc2" && ctx.skill.id === "skchr_noirc2_1",
    transform: (effects) => ({
      ...effects,
      attackTimes: 1,
    }),
    note: "第五批最小迁移：火龙S黑角S1按旧口径修正瞬发窗口。",
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
