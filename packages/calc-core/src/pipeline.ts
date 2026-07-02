import { applyRules, defaultSkillRules } from "./rules";
import { warningCatalog } from "./warningCatalog";
import type {
  CalculationContext,
  CalculationFormula,
  CalculationInput,
  CalculationResult,
  CalculationWarning,
  DamageStreamResult,
  FormulaStep,
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
  const attackCountFromSkill = context.skill.attackCount !== undefined;
  const attackCount = Math.max(
    1,
    context.skill.attackCount ?? duration / attackInterval,
  );
  return { duration, aspdFactor, attackInterval, attackCount, attackCountFromSkill };
}

function buildScheduleFormula(
  context: CalculationContext,
  effects: NormalizedEffects,
  schedule: ReturnType<typeof buildSchedule>,
): FormulaStep[] {
  const sourceExpression = schedule.attackCountFromSkill
    ? "attackCount = max(1, skill.attackCount)"
    : "attackCount = max(1, duration / attackInterval)";

  return [
    {
      key: "baseAttackInterval",
      label: "基础攻击间隔",
      expression: "baseAttackInterval = operator.baseAttackInterval",
      value: context.operator.baseAttackInterval,
    },
    {
      key: "aspdFactor",
      label: "攻速换算系数",
      expression: "aspdFactor = 100 / (100 + attackSpeedBonus)",
      value: schedule.aspdFactor,
      inputs: {
        attackSpeedBonus: effects.attackSpeedBonus,
      },
    },
    {
      key: "attackInterval",
      label: "实际攻击间隔",
      expression: "attackInterval = max(0.1, baseAttackInterval * aspdFactor)",
      value: schedule.attackInterval,
      inputs: {
        baseAttackInterval: context.operator.baseAttackInterval,
        aspdFactor: schedule.aspdFactor,
      },
    },
    {
      key: "attackCount",
      label: "攻击次数",
      expression: sourceExpression,
      value: schedule.attackCount,
      inputs: {
        skillAttackCount: context.skill.attackCount ?? "none",
        duration: schedule.duration,
        attackInterval: schedule.attackInterval,
      },
    },
    {
      key: "duration",
      label: "技能持续时间",
      expression: "duration = max(0.1, skill.durationSeconds)",
      value: schedule.duration,
      inputs: {
        skillDuration: context.skill.durationSeconds,
      },
    },
  ];
}

function calculateOneHitMainDamage(
  context: CalculationContext,
  effects: NormalizedEffects,
): { hitDamage: number; formulaSteps: FormulaStep[] } {
  const formulaSteps: FormulaStep[] = [];
  const attack = context.operator.baseAttack * (1 + effects.atkBuffRatio);
  const scaledAttack = attack * effects.attackScale * effects.damageScale;
  formulaSteps.push(
    {
      key: "baseAttack",
      label: "基础攻击",
      expression: "baseAttack = operator.baseAttack",
      value: context.operator.baseAttack,
    },
    {
      key: "attack",
      label: "攻击力加成后数值",
      expression: "attack = baseAttack * (1 + atkBuffRatio)",
      value: attack,
      inputs: {
        baseAttack: context.operator.baseAttack,
        atkBuffRatio: effects.atkBuffRatio,
      },
    },
    {
      key: "scaledAttack",
      label: "倍率叠乘后攻击",
      expression: "scaledAttack = attack * attackScale * damageScale",
      value: scaledAttack,
      inputs: {
        attack,
        attackScale: effects.attackScale,
        damageScale: effects.damageScale,
      },
    },
  );

  if (effects.attackType === "physical") {
    const defenseAfterShred = Math.max(
      context.enemy.defense * (1 - effects.defShredRate) - effects.defShredFlat,
      0,
    );
    const raw = scaledAttack - defenseAfterShred;
    const minDamage = scaledAttack * context.battle.minPhysicalDamageRatio;
    const hitDamage = Math.max(raw, minDamage);
    formulaSteps.push(
      {
        key: "defenseAfterShred",
        label: "破甲后防御",
        expression: "defenseAfterShred = max(enemyDef * (1 - defShredRate) - defShredFlat, 0)",
        value: defenseAfterShred,
        inputs: {
          enemyDefense: context.enemy.defense,
          defShredRate: effects.defShredRate,
          defShredFlat: effects.defShredFlat,
        },
      },
      {
        key: "rawPhysicalDamage",
        label: "物理原始伤害",
        expression: "raw = scaledAttack - defenseAfterShred",
        value: raw,
        inputs: {
          scaledAttack,
          defenseAfterShred,
        },
      },
      {
        key: "minimumPhysicalDamage",
        label: "物理保底伤害",
        expression: "minimum = scaledAttack * minPhysicalDamageRatio",
        value: minDamage,
        inputs: {
          scaledAttack,
          minPhysicalDamageRatio: context.battle.minPhysicalDamageRatio,
        },
      },
      {
        key: "hitDamage",
        label: "单次伤害",
        expression: "hitDamage = max(raw, minimum)",
        value: hitDamage,
      },
    );
    return { hitDamage, formulaSteps };
  }

  if (effects.attackType === "magical") {
    const mr = clamp(context.enemy.magicResistance, 0, 95);
    const magicMultiplier = 1 - mr / 100;
    const hitDamage = scaledAttack * magicMultiplier;
    formulaSteps.push(
      {
        key: "clampedMagicResistance",
        label: "生效法抗",
        expression: "mr = clamp(enemyMagicResistance, 0, 95)",
        value: mr,
        inputs: {
          enemyMagicResistance: context.enemy.magicResistance,
        },
      },
      {
        key: "magicMultiplier",
        label: "法术减伤系数",
        expression: "magicMultiplier = 1 - mr / 100",
        value: magicMultiplier,
        inputs: { mr },
      },
      {
        key: "hitDamage",
        label: "单次伤害",
        expression: "hitDamage = scaledAttack * magicMultiplier",
        value: hitDamage,
      },
    );
    return { hitDamage, formulaSteps };
  }

  formulaSteps.push({
    key: "hitDamage",
    label: "单次伤害",
    expression: "hitDamage = scaledAttack",
    value: scaledAttack,
  });
  return { hitDamage: scaledAttack, formulaSteps };
}

function buildSummaryFormula(
  streams: DamageStreamResult[],
  totalDamage: number,
  duration: number,
  dps: number,
): FormulaStep[] {
  const streamSummary = streams
    .map((stream) => `${stream.id}:${stream.totalDamage.toFixed(2)}`)
    .join(" + ");
  return [
    {
      key: "streamTotal",
      label: "伤害流汇总",
      expression: "totalDamage = sum(stream.totalDamage)",
      value: totalDamage,
      inputs: {
        streams: streamSummary || "none",
      },
    },
    {
      key: "dps",
      label: "每秒伤害",
      expression: "dps = totalDamage / duration",
      value: dps,
      inputs: {
        totalDamage,
        duration,
      },
    },
  ];
}

export function calculateSkillDps(
  input: CalculationInput,
  index: OperatorIndex,
  rules: RuleDefinition[] = defaultSkillRules,
): CalculationResult {
  const context = buildCalculationContext(input, index);
  const { effects, trace } = applyRules(context, rules);
  const schedule = buildSchedule(context, effects);
  const mainHit = calculateOneHitMainDamage(context, effects);

  const streams: DamageStreamResult[] = [
    {
      id: "MAIN",
      attackType: effects.attackType,
      hitDamage: mainHit.hitDamage,
      attackCount: schedule.attackCount,
      totalDamage: mainHit.hitDamage * schedule.attackCount,
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
  const formula: CalculationFormula = {
    mainHit: mainHit.formulaSteps,
    schedule: buildScheduleFormula(context, effects, schedule),
    summary: buildSummaryFormula(streams, totalDamage, schedule.duration, dps),
  };

  const warnings: CalculationWarning[] = [];
  if ((context.skill.unmappedBlackboardKeys ?? []).length > 0) {
    warnings.push({
      ...warningCatalog.WARN_UNMAPPED_KEY,
      source: context.skill.unmappedBlackboardKeys?.join(", "),
    });
  }
  if (context.skill.hasAmbiguousSemantic) {
    warnings.push({
      ...warningCatalog.WARN_AMBIGUOUS_SEMANTIC,
      source: context.skill.id,
    });
  }
  if ((context.skill.customTags ?? []).includes("legacy_unmapped")) {
    warnings.push({
      ...warningCatalog.WARN_PARTIAL_RULE_COVERAGE,
      source: context.skill.id,
    });
  }
  if ((context.skill.customTags ?? []).includes("semantic_ambiguous")) {
    warnings.push({
      ...warningCatalog.WARN_MANUAL_REVIEW_REQUIRED,
      source: context.skill.id,
    });
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
      attackCountFromSkill: schedule.attackCountFromSkill,
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
    formula,
    ruleTrace: trace,
    warnings,
  };
}
