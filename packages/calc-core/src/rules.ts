import type {
  CalculationContext,
  NormalizedEffects,
  RuleDefinition,
  RuleTrace,
} from "./types";
import { phase1CustomRules } from "./phase1CustomRules";

export function getBaseEffects(context: CalculationContext): NormalizedEffects {
  const skillHealFromDamageRatio =
    context.skill.healFromDamageRatio ??
    (context.operator.subProfessionId === "incantationmedic" ? 0.5 : 0);
  return {
    attackType: context.operator.defaultAttackType,
    atkBuffRatio: context.skill.atkBuffRatio ?? 0,
    flatAttack: context.skill.flatAttack ?? 0,
    attackScale: context.skill.attackScale,
    damageScale: context.skill.damageScale ?? 1,
    attackSpeedBonus: context.skill.attackSpeedBonus ?? 0,
    attackIntervalAdjustment: context.skill.attackIntervalAdjustment ?? 0,
    attackCountOverride: context.skill.attackCount,
    durationOverride: context.skill.durationOverride,
    durationAdjustment: context.skill.durationAdjustment ?? 0,
    attackTimes: context.skill.attackTimes ?? 0,
    mainAttackTimes: context.skill.mainAttackTimes ?? 1,
    ammoCount: context.skill.ammoCount ?? 0,
    defShredFlat: 0,
    defShredRate: 0,
    defPenetrateFixed: context.skill.defPenetrateFixed ?? 0,
    magicResistanceReductionFlat: context.skill.magicResistanceReduction ?? 0,
    magicResistanceReductionRatio: 0,
    extraAttackType: context.skill.extraAttackType,
    extraAttackScale: context.skill.extraAttackScale ?? 0,
    extraAttackInterval: context.skill.extraAttackInterval,
    extraAttackTimes: context.skill.extraAttackTimes,
    extraDuration: context.skill.extraDuration,
    extraTrueDamageScale: 0,
    healScale: context.skill.healScale ?? 0,
    healFlat: context.skill.healFlat ?? 0,
    healFromDamageRatio: skillHealFromDamageRatio,
    healAttackInterval: context.skill.healAttackInterval,
    healAttackTimes: context.skill.healAttackTimes,
    healDuration: context.skill.healDuration,
    disableTraitExtra: context.skill.disableTraitExtra ?? false,
  };
}

export function applyRules(
  context: CalculationContext,
  rules: RuleDefinition[],
): { effects: NormalizedEffects; trace: RuleTrace[] } {
  let effects = getBaseEffects(context);
  const trace: RuleTrace[] = [];

  for (const rule of rules) {
    const matched = rule.match(context);
    if (matched) {
      effects = rule.transform(effects, context);
    }
    trace.push({
      ruleId: rule.id,
      applied: matched,
      note: rule.note,
    });
  }

  return { effects, trace };
}

const guardRules: RuleDefinition[] = [
  {
    id: "guard.unmapped_warning_marker",
    scope: "skill",
    match: () => false,
    transform: (effects) => effects,
    note: "保留占位：未迁移语义由 warnings 输出。",
  },
];

export const defaultSkillRules: RuleDefinition[] = [...phase1CustomRules, ...guardRules];
