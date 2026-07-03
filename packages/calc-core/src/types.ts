import type { WarningCode, WarningLevel } from "./warningCatalog";

export type AttackType = "physical" | "magical" | "true";

export interface SkillData {
  id: string;
  name: string;
  durationSeconds: number;
  attackScale: number;
  damageScale?: number;
  atkBuffRatio?: number;
  attackSpeedBonus?: number;
  attackCount?: number;
  customTags?: string[];
  unmappedBlackboardKeys?: string[];
  hasAmbiguousSemantic?: boolean;
}

export interface ModuleStageBonus {
  atk: number;
  attackSpeed: number;
}

export interface ModuleData {
  id: string;
  name: string;
  stageBonuses: [ModuleStageBonus, ModuleStageBonus, ModuleStageBonus, ModuleStageBonus];
}

export interface OperatorData {
  id: string;
  name: string;
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  baseMagicResistance: number;
  baseAttackInterval: number;
  baseAttackSpeed: number;
  modules?: ModuleData[];
  defaultAttackType: AttackType;
  skills: SkillData[];
}

export interface EnemyConfig {
  defense: number;
  magicResistance: number;
}

export interface BattleConfig {
  conditionEnabled: boolean;
  minPhysicalDamageRatio: number;
}

export interface DevelopmentConfig {
  eliteStage: 0 | 1 | 2;
  skillLevel: 7 | 8 | 9 | 10;
  potentialRank: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  trust: number;
  moduleStage: 0 | 1 | 2 | 3;
  moduleId?: string;
}

export interface OperatorSelection {
  operatorId: string;
  skillId: string;
}

export interface CalculationInput {
  selection: OperatorSelection;
  enemy: EnemyConfig;
  battle: BattleConfig;
  development?: Partial<DevelopmentConfig>;
}

export interface CalculationContext {
  operator: OperatorData;
  skill: SkillData;
  selectedModule?: ModuleData;
  enemy: EnemyConfig;
  battle: BattleConfig;
  development: DevelopmentConfig;
}

export interface NormalizedEffects {
  attackType: AttackType;
  atkBuffRatio: number;
  attackScale: number;
  damageScale: number;
  attackSpeedBonus: number;
  defShredFlat: number;
  defShredRate: number;
  extraTrueDamageScale: number;
}

export interface DamageStreamResult {
  id: "MAIN" | "OTHER_TRUE";
  attackType: AttackType;
  hitDamage: number;
  attackCount: number;
  totalDamage: number;
}

export interface BreakdownItem {
  key: string;
  value: number | string;
  description: string;
}

export interface RuleTrace {
  ruleId: string;
  applied: boolean;
  note: string;
}

export interface FormulaStep {
  key: string;
  label: string;
  expression: string;
  value: number | string;
  inputs?: Record<string, number | string>;
}

export interface CalculationFormula {
  mainHit: FormulaStep[];
  schedule: FormulaStep[];
  summary: FormulaStep[];
}

export interface CalculationResult {
  summary: {
    hitDamage: number;
    totalDamage: number;
    dps: number;
  };
  schedule: {
    attackInterval: number;
    attackCount: number;
    attackCountFromSkill: boolean;
    duration: number;
  };
  streams: DamageStreamResult[];
  breakdown: BreakdownItem[];
  formula: CalculationFormula;
  ruleTrace: RuleTrace[];
  warnings: CalculationWarning[];
}

export interface CalculationWarning {
  code: WarningCode;
  level: WarningLevel;
  message: string;
  source?: string;
}

export interface RuleDefinition {
  id: string;
  scope: "skill";
  match: (context: CalculationContext) => boolean;
  transform: (effects: NormalizedEffects, context: CalculationContext) => NormalizedEffects;
  note: string;
}

export interface OperatorIndex {
  operators: Record<string, OperatorData>;
}

export interface RawGameData {
  character_table: Record<string, unknown>;
  skill_table: Record<string, unknown>;
  uniequip_table: Record<string, unknown>;
  battle_equip_table: Record<string, unknown>;
  profession: Record<string, unknown>;
  subProfessionId: Record<string, unknown>;
}
