import type {
  CalculationContext,
  NormalizedEffects,
  RuleDefinition,
  RuleTrace,
} from "./types";
import { phase1CustomRules } from "./phase1CustomRules";

export function getBaseEffects(context: CalculationContext): NormalizedEffects {
  return {
    attackType: context.operator.defaultAttackType,
    atkBuffRatio: context.skill.atkBuffRatio ?? 0,
    attackScale: context.skill.attackScale,
    damageScale: context.skill.damageScale ?? 1,
    attackSpeedBonus: context.skill.attackSpeedBonus ?? 0,
    defShredFlat: 0,
    defShredRate: 0,
    extraTrueDamageScale: 0,
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
