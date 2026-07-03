import { applyRules, defaultSkillRules } from "./rules";
import { warningCatalog } from "./warningCatalog";
import type {
  AttackType,
  CalculationContext,
  CalculationFormula,
  CalculationInput,
  CalculationResult,
  CalculationWarning,
  DamageStreamResult,
  DevelopmentConfig,
  FormulaStep,
  NormalizedEffects,
  OperatorIndex,
  RuleDefinition,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const defaultDevelopment: DevelopmentConfig = {
  eliteStage: 2,
  skillLevel: 10,
  potentialRank: 6,
  trust: 100,
  moduleStage: 0,
  moduleId: undefined,
};

function resolveDevelopmentConfig(input: CalculationInput): DevelopmentConfig {
  const source = input.development ?? {};
  const eliteStage = clamp(Math.trunc(source.eliteStage ?? defaultDevelopment.eliteStage), 0, 2) as 0 | 1 | 2;
  const skillLevel = clamp(Math.trunc(source.skillLevel ?? defaultDevelopment.skillLevel), 7, 10) as 7 | 8 | 9 | 10;
  const potentialRank = clamp(
    Math.trunc(source.potentialRank ?? defaultDevelopment.potentialRank),
    0,
    6,
  ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const trust = clamp(Math.trunc(source.trust ?? defaultDevelopment.trust), 0, 100);
  const moduleStage = clamp(Math.trunc(source.moduleStage ?? defaultDevelopment.moduleStage), 0, 3) as
    | 0
    | 1
    | 2
    | 3;
  const moduleId = typeof source.moduleId === "string" && source.moduleId.length > 0
    ? source.moduleId
    : undefined;
  return { eliteStage, skillLevel, potentialRank, trust, moduleStage, moduleId };
}

function resolveSelectedModule(context: CalculationContext) {
  const modules = context.operator.modules ?? [];
  if (!modules.length) return undefined;
  return (
    modules.find((module) => module.id === context.development.moduleId) ??
    modules[0]
  );
}

function resolveDevelopmentFactors(context: CalculationContext) {
  const selectedModule = context.selectedModule;
  const selectedStageBonus = selectedModule?.stageBonuses[context.development.moduleStage] ?? {
    atk: 0,
    attackSpeed: 0,
    atkScale: 1,
    damageScale: 1,
    defPenetrateFixed: 0,
    magicResistanceReduction: 0,
  };
  const eliteAttackFactor = [0.78, 0.9, 1][context.development.eliteStage];
  const eliteAttackIntervalFactor = [1.1, 1.04, 1][context.development.eliteStage];
  const potentialFactor = 1 - (6 - context.development.potentialRank) * 0.01;
  const trustFactor = 0.9 + context.development.trust * 0.001;
  const skillLevelFactor = 1 - (10 - context.development.skillLevel) * 0.04;
  return {
    selectedModule,
    selectedStageBonus,
    eliteAttackFactor,
    eliteAttackIntervalFactor,
    potentialFactor,
    trustFactor,
    skillLevelFactor,
  };
}

function normalizeDuration(duration: number): number {
  return duration < 1 ? 1 : duration;
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
    selectedModule: undefined,
    enemy: input.enemy,
    battle: input.battle,
    development: resolveDevelopmentConfig(input),
  };
}

function buildSchedule(context: CalculationContext, effects: NormalizedEffects) {
  const rawDuration = effects.durationOverride ?? context.skill.durationSeconds;
  const duration = normalizeDuration(rawDuration + effects.durationAdjustment);
  const { eliteAttackIntervalFactor, selectedStageBonus } = resolveDevelopmentFactors(context);
  const totalAttackSpeedBonus = (context.operator.baseAttackSpeed ?? 0) + effects.attackSpeedBonus;
  const aspdFactor = 100 / Math.max(1, 100 + totalAttackSpeedBonus);
  const revisedBaseAttackInterval = Math.max(
    0.1,
    context.operator.baseAttackInterval * eliteAttackIntervalFactor + effects.attackIntervalAdjustment,
  );
  const attackInterval = Math.max(
    0.1,
    revisedBaseAttackInterval * aspdFactor,
  );
  const attackCountFromSkill = effects.attackCountOverride !== undefined;
  const attackCount = Math.max(
    1,
    effects.attackCountOverride ?? duration / attackInterval,
  );
  const attackTimes = Math.max(0, effects.attackTimes);
  const mainAttackTimes = Math.max(1, effects.mainAttackTimes);
  const ammoCount = Math.max(0, effects.ammoCount);
  const isPermanent = context.skill.durationSeconds < 0 || rawDuration < 0;
  return {
    duration,
    aspdFactor,
    attackInterval,
    attackCount,
    attackCountFromSkill,
    attackTimes,
    mainAttackTimes,
    ammoCount,
    isPermanent,
    revisedBaseAttackInterval,
    totalAttackSpeedBonus,
  };
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
        operatorAttackSpeedBonus: context.operator.baseAttackSpeed,
        skillAttackSpeedBonus: effects.attackSpeedBonus,
        attackSpeedBonus: schedule.totalAttackSpeedBonus,
      },
    },
    {
      key: "revisedBaseAttackInterval",
      label: "修正后基础攻间",
      expression: "revisedBaseAttackInterval = baseAttackInterval + attackIntervalAdjustment",
      value: schedule.revisedBaseAttackInterval,
      inputs: {
        baseAttackInterval: context.operator.baseAttackInterval,
        attackIntervalAdjustment: effects.attackIntervalAdjustment,
      },
    },
    {
      key: "attackInterval",
      label: "实际攻击间隔",
      expression: "attackInterval = max(0.1, revisedBaseAttackInterval * aspdFactor)",
      value: schedule.attackInterval,
      inputs: {
        revisedBaseAttackInterval: schedule.revisedBaseAttackInterval,
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
      expression: "duration = max(1, (durationOverride || skill.durationSeconds) + durationAdjustment)",
      value: schedule.duration,
      inputs: {
        skillDuration: context.skill.durationSeconds,
        durationOverride: effects.durationOverride ?? "none",
        durationAdjustment: effects.durationAdjustment,
      },
    },
    {
      key: "streamTiming",
      label: "流式结算参数",
      expression: "attackTimes/mainAttackTimes/ammoCount 驱动多流总伤",
      value: `${schedule.attackTimes}/${schedule.mainAttackTimes}/${schedule.ammoCount}`,
      inputs: {
        attackTimes: schedule.attackTimes,
        mainAttackTimes: schedule.mainAttackTimes,
        ammoCount: schedule.ammoCount,
      },
    },
  ];
}

function calculateOneHitMainDamage(
  context: CalculationContext,
  effects: NormalizedEffects,
): { hitDamage: number; formulaSteps: FormulaStep[]; scaledAttack: number; developmentBaseAttack: number } {
  const formulaSteps: FormulaStep[] = [];
  const factors = resolveDevelopmentFactors(context);
  const developmentBaseAttack =
    context.operator.baseAttack *
      factors.eliteAttackFactor *
      factors.potentialFactor *
      factors.trustFactor +
    factors.selectedStageBonus.atk;
  const attack = developmentBaseAttack * (1 + effects.atkBuffRatio) + effects.flatAttack;
  const scaledAttack = attack * effects.attackScale * effects.damageScale * factors.skillLevelFactor;
  formulaSteps.push(
    {
      key: "baseAttack",
      label: "基础攻击",
      expression: "baseAttack = operator.baseAttack",
      value: context.operator.baseAttack,
    },
    {
      key: "developmentBaseAttack",
      label: "养成修正后基础攻击",
      expression:
        "developmentBaseAttack = baseAttack * eliteAttackFactor * potentialFactor * trustFactor + moduleAtkBonus",
      value: developmentBaseAttack,
      inputs: {
        baseAttack: context.operator.baseAttack,
        eliteAttackFactor: factors.eliteAttackFactor,
        potentialFactor: factors.potentialFactor,
        trustFactor: factors.trustFactor,
        moduleAtkBonus: factors.selectedStageBonus.atk,
      },
    },
    {
      key: "attack",
      label: "攻击力加成后数值",
      expression: "attack = developmentBaseAttack * (1 + atkBuffRatio) + flatAttack",
      value: attack,
      inputs: {
        developmentBaseAttack,
        atkBuffRatio: effects.atkBuffRatio,
        flatAttack: effects.flatAttack,
      },
    },
    {
      key: "scaledAttack",
      label: "倍率叠乘后攻击",
      expression: "scaledAttack = attack * attackScale * damageScale * skillLevelFactor",
      value: scaledAttack,
      inputs: {
        attack,
        attackScale: effects.attackScale,
        damageScale: effects.damageScale,
        skillLevelFactor: factors.skillLevelFactor,
      },
    },
  );

  if (effects.attackType === "physical") {
    const defenseAfterShred = Math.max(
      context.enemy.defense * (1 - effects.defShredRate) - effects.defShredFlat - effects.defPenetrateFixed,
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
          defPenetrateFixed: effects.defPenetrateFixed,
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
    return { hitDamage, formulaSteps, scaledAttack, developmentBaseAttack };
  }

  if (effects.attackType === "magical") {
    const reducedMr = context.enemy.magicResistance * (1 - effects.magicResistanceReductionRatio) + effects.magicResistanceReductionFlat;
    const mr = clamp(reducedMr, 0, 95);
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
          magicResistanceReductionRatio: effects.magicResistanceReductionRatio,
          magicResistanceReductionFlat: effects.magicResistanceReductionFlat,
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
    return { hitDamage, formulaSteps, scaledAttack, developmentBaseAttack };
  }

  if (effects.attackType === "heal" || effects.attackType === "none") {
    formulaSteps.push({
      key: "hitDamage",
      label: "单次伤害",
      expression: "heal/none 不参与伤害结算",
      value: 0,
    });
    return { hitDamage: 0, formulaSteps, scaledAttack, developmentBaseAttack };
  }

  formulaSteps.push({
    key: "hitDamage",
    label: "单次伤害",
    expression: "hitDamage = scaledAttack",
    value: scaledAttack,
  });
  return { hitDamage: scaledAttack, formulaSteps, scaledAttack, developmentBaseAttack };
}

function resolveStreamTotal(params: {
  hitDamage: number;
  attackCount: number;
  hitMultiplier?: number;
  interval?: number;
  duration?: number;
  times?: number;
  schedule: ReturnType<typeof buildSchedule>;
}): number {
  const hitMultiplier = params.hitMultiplier ?? 1;
  const baseTotal = params.hitDamage * params.attackCount * hitMultiplier;
  const resolvedTimes = params.times ?? params.schedule.attackTimes;
  const resolvedDuration = params.duration ?? params.schedule.duration;
  const resolvedInterval = params.interval ?? params.schedule.attackInterval;
  if (resolvedTimes > 0) {
    return baseTotal * resolvedTimes;
  }
  if (params.schedule.ammoCount > 0) {
    return params.hitDamage * hitMultiplier * params.schedule.ammoCount;
  }
  if (
    params.interval !== undefined &&
    params.duration !== undefined &&
    (params.interval !== params.schedule.attackInterval || params.duration !== params.schedule.duration)
  ) {
    const streamCount = Math.max(1, resolvedDuration / Math.max(0.1, resolvedInterval));
    return params.hitDamage * streamCount * hitMultiplier;
  }
  return baseTotal;
}

function buildStreamDps(totalDamage: number, schedule: ReturnType<typeof buildSchedule>): number {
  if (schedule.attackTimes > 0) {
    return totalDamage;
  }
  if (schedule.ammoCount > 0) {
    const activeDuration = schedule.attackInterval * schedule.ammoCount;
    return activeDuration > 0 ? totalDamage / activeDuration : totalDamage;
  }
  return totalDamage / schedule.duration;
}

function calculateHitDamageByType(params: {
  attackType: AttackType;
  attackPower: number;
  enemyDefense: number;
  enemyMagicResistance: number;
  minPhysicalDamageRatio: number;
  effects: NormalizedEffects;
}): number {
  const { attackType, attackPower, enemyDefense, enemyMagicResistance, minPhysicalDamageRatio, effects } = params;
  if (attackType === "physical") {
    const defense = Math.max(
      enemyDefense * (1 - effects.defShredRate) - effects.defShredFlat - effects.defPenetrateFixed,
      0,
    );
    return Math.max(attackPower - defense, attackPower * minPhysicalDamageRatio);
  }
  if (attackType === "magical") {
    const reducedMr = enemyMagicResistance * (1 - effects.magicResistanceReductionRatio) + effects.magicResistanceReductionFlat;
    const mr = clamp(reducedMr, 0, 95);
    return attackPower * (1 - mr / 100);
  }
  if (attackType === "true") {
    return attackPower;
  }
  return 0;
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
  context.selectedModule = resolveSelectedModule(context);
  const { effects: ruleEffects, trace } = applyRules(context, rules);
  const moduleBonus = context.selectedModule?.stageBonuses[context.development.moduleStage];
  const effects: NormalizedEffects = moduleBonus
    ? {
        ...ruleEffects,
        attackSpeedBonus: ruleEffects.attackSpeedBonus + moduleBonus.attackSpeed,
      }
    : ruleEffects;
  const schedule = buildSchedule(context, effects);
  const mainHit = calculateOneHitMainDamage(context, effects);

  const streams: DamageStreamResult[] = [];
  const mainTotalDamage = resolveStreamTotal({
    hitDamage: mainHit.hitDamage,
    attackCount: schedule.attackCount,
    hitMultiplier: schedule.mainAttackTimes,
    interval: schedule.attackInterval,
    duration: schedule.duration,
    schedule,
  });
  streams.push({
    id: "MAIN",
    attackType: effects.attackType,
    hitDamage: mainHit.hitDamage,
    attackCount: schedule.attackCount,
    interval: schedule.attackInterval,
    duration: schedule.duration,
    times: schedule.mainAttackTimes,
    totalDamage: mainTotalDamage,
  });

  if (effects.extraTrueDamageScale > 0) {
    const extraBaseAttack = mainHit.developmentBaseAttack;
    const extraHitDamage = extraBaseAttack * effects.extraTrueDamageScale;
    const totalDamage = resolveStreamTotal({
      hitDamage: extraHitDamage,
      attackCount: schedule.attackCount,
      interval: effects.extraAttackInterval,
      duration: effects.extraDuration,
      times: effects.extraAttackTimes,
      schedule,
    });
    streams.push({
      id: "OTHER_TRUE",
      attackType: "true",
      hitDamage: extraHitDamage,
      attackCount: schedule.attackCount,
      interval: effects.extraAttackInterval ?? schedule.attackInterval,
      duration: effects.extraDuration ?? schedule.duration,
      times: effects.extraAttackTimes ?? schedule.attackTimes,
      totalDamage,
    });
  }

  if (effects.extraAttackScale > 0) {
    const extraAttackType = effects.extraAttackType ?? effects.attackType;
    const extraAttackPower = mainHit.scaledAttack * effects.extraAttackScale;
    const extraHitDamage = calculateHitDamageByType({
      attackType: extraAttackType,
      attackPower: extraAttackPower,
      enemyDefense: context.enemy.defense,
      enemyMagicResistance: context.enemy.magicResistance,
      minPhysicalDamageRatio: context.battle.minPhysicalDamageRatio,
      effects,
    });
    const totalDamage = resolveStreamTotal({
      hitDamage: extraHitDamage,
      attackCount: schedule.attackCount,
      interval: effects.extraAttackInterval,
      duration: effects.extraDuration,
      times: effects.extraAttackTimes,
      schedule,
    });
    streams.push({
      id: extraAttackType === "magical" ? "OTHER_MAGICAL" : "OTHER_PHYSICAL",
      attackType: extraAttackType,
      hitDamage: extraHitDamage,
      attackCount: schedule.attackCount,
      interval: effects.extraAttackInterval ?? schedule.attackInterval,
      duration: effects.extraDuration ?? schedule.duration,
      times: effects.extraAttackTimes ?? schedule.attackTimes,
      totalDamage,
    });
  }

  const totalDamage = streams.reduce((sum, item) => sum + item.totalDamage, 0);
  const dps = buildStreamDps(totalDamage, schedule);
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
  if ((context.skill.customTags ?? []).includes("assumption_applied")) {
    warnings.push({
      ...warningCatalog.WARN_ASSUMPTION_APPLIED,
      source: context.skill.id,
    });
  }
  if (effects.attackType === "heal" || effects.attackType === "none" || effects.disableTraitExtra) {
    warnings.push({
      ...warningCatalog.WARN_INFO_LIMITATION,
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
      attackTimes: schedule.attackTimes,
      mainAttackTimes: schedule.mainAttackTimes,
      ammoCount: schedule.ammoCount,
      isPermanent: schedule.isPermanent,
    },
    streams,
    breakdown: [
      { key: "baseAttack", value: context.operator.baseAttack, description: "基础攻击力" },
      {
        key: "development",
        value: `E${context.development.eliteStage}/SL${context.development.skillLevel}/P${context.development.potentialRank}/T${context.development.trust}/M${context.development.moduleStage}(${context.selectedModule?.name ?? "无"})`,
        description: "养成与模组参数",
      },
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
