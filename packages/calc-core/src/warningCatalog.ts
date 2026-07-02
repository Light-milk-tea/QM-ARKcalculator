export type WarningLevel = "P0" | "P1" | "P2";

export type WarningCode =
  | "WARN_UNMAPPED_KEY"
  | "WARN_AMBIGUOUS_SEMANTIC"
  | "WARN_PARTIAL_RULE_COVERAGE"
  | "WARN_ASSUMPTION_APPLIED"
  | "WARN_MANUAL_REVIEW_REQUIRED"
  | "WARN_INFO_LIMITATION";

export interface WarningDescriptor {
  code: WarningCode;
  level: WarningLevel;
  message: string;
}

export const warningCatalog: Record<WarningCode, WarningDescriptor> = {
  WARN_UNMAPPED_KEY: {
    code: "WARN_UNMAPPED_KEY",
    level: "P0",
    message: "检测到未映射 blackboard key，结果可能偏差较大。",
  },
  WARN_AMBIGUOUS_SEMANTIC: {
    code: "WARN_AMBIGUOUS_SEMANTIC",
    level: "P0",
    message: "检测到语义冲突或歧义，建议人工复核。",
  },
  WARN_PARTIAL_RULE_COVERAGE: {
    code: "WARN_PARTIAL_RULE_COVERAGE",
    level: "P1",
    message: "规则仅部分覆盖，结果为阶段性估算。",
  },
  WARN_ASSUMPTION_APPLIED: {
    code: "WARN_ASSUMPTION_APPLIED",
    level: "P1",
    message: "已应用默认假设，请结合说明解读。",
  },
  WARN_MANUAL_REVIEW_REQUIRED: {
    code: "WARN_MANUAL_REVIEW_REQUIRED",
    level: "P1",
    message: "该技能或规则需要人工复核。",
  },
  WARN_INFO_LIMITATION: {
    code: "WARN_INFO_LIMITATION",
    level: "P2",
    message: "当前版本功能边界限制，不影响主流程可用性。",
  },
};
