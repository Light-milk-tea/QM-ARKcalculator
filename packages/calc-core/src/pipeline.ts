import { applyRules, defaultSkillRules } from "./rules";
import type {
  CalculationContext,
  CalculationInput,
  CalculationResult,
  DamageStreamResult,
  NormalizedEffects,
  OperatorIndex,
  RuleDefinition,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildCalculationContext(
  input: CalculationInput,
  index: OperatorIndex,
): CalculationContext {
  const operator = index.operators[input.selection.operatorId];
  if (!operator) {
    throw new Error(`Operator not found: ${input.selection.operatorId}`);
  }

  const skill = operator.skills.find((item) => item.id === input.selection.skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${input.selection.skillId}`);
  }

  return {
    operator,
    skill,
    enemy: input.enemy,
    battle: input.battle,
  };
}

function buildSchedule(context: CalculationContext, effects: NormalizedEffects) {
  const duration = Math.max(0.1, context.skill.durationSeconds);
  const aspdFactor = 100 / (100 + effects.attackSpeedBonus);
  const attackInterval = Math.max(0.1, context.operator.baseAttackInterval * aspdFactor);
  const attackCount = Math.max(
    1,
    context.skill.attackCount ?? duration / attackInterval,
  );
  return { duration, attackInterval, attackCount };
}

function calculateOneHitMainDamage(
  context: CalculationContext,
  effects: NormalizedEffects,
): number {
  const attack = context.operator.baseAttack * (1 + effects.atkBuffRatio);
  const scaledAttack = attack * effects.attackScale * effects.damageScale;

  if (effects.attackType === "physical") {
    const defenseAfterShred = Math.max(
      context.enemy.defense * (1 - effects.defShredRate) - effects.defShredFlat,
      0,
    );
    const raw = scaledAttack - defenseAfterShred;
    return Math.max(raw, scaledAttack * context.battle.minPhysicalDamageRatio);
  }

  if (effects.attackType === "magical") {
    const mr = clamp(context.enemy.magicResistance, 0, 95);
    return scaledAttack * (1 - mr / 100);
  }

  return scaledAttack;
}

export function calculateSkillDps(
  input: CalculationInput,
  index: OperatorIndex,
  rules: RuleDefinition[] = defaultSkillRules,
): CalculationResult {
  const context = buildCalculationContext(input, index);
  const { effects, trace } = applyRules(context, rules);
  const schedule = buildSchedule(context, effects);
  const mainHitDamage = calculateOneHitMainDamage(context, effects);

  const streams: DamageStreamResult[] = [
    {
      id: "MAIN",
      attackType: effects.attackType,
      hitDamage: mainHitDamage,
      attackCount: schedule.attackCount,
      totalDamage: mainHitDamage * schedule.attackCount,
    },
  ];

  if (effects.extraTrueDamageScale > 0) {
    const extraHitDamage = context.operator.baseAttack * effects.extraTrueDamageScale;
    streams.push({
      id: "OTHER_TRUE",
      attackType: "true",
      hitDamage: extraHitDamage,
      attackCount: schedule.attackCount,
      totalDamage: extraHitDamage * schedule.attackCount,
    });
  }

  const totalDamage = streams.reduce((sum, item) => sum + item.totalDamage, 0);
  const dps = totalDamage / schedule.duration;

  const warnings: string[] = [];
  if ((context.skill.customTags ?? []).includes("legacy_unmapped")) {
    warnings.push("技能存在未迁移语义，请补充 custom 规则。");
  }

  return {
    summary: {
      hitDamage: streams[0].hitDamage,
      totalDamage,
      dps,
    },
    schedule: {
      attackInterval: schedule.attackInterval,
      attackCount: schedule.attackCount,
      duration: schedule.duration,
    },
    streams,
    breakdown: [
      { key: "baseAttack", value: context.operator.baseAttack, description: "基础攻击力" },
      { key: "atkBuffRatio", value: effects.atkBuffRatio, description: "攻击力百分比加成" },
      { key: "attackScale", value: effects.attackScale, description: "技能攻击倍率" },
      { key: "damageScale", value: effects.damageScale, description: "最终伤害倍率" },
      { key: "attackType", value: effects.attackType, description: "当前攻击类型" },
    ],
    ruleTrace: trace,
    warnings,
  };
}
