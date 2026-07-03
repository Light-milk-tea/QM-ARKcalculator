import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

type ReplaceGateCase = {
  id: string;
  operatorId: string;
  skillId: string;
  enemy: { defense: number; magicResistance: number };
  conditionEnabled: boolean;
  requireStreamIds: string[];
  requireRuleIds: string[];
  maxWarnings: number;
};

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

function buildInput(item: ReplaceGateCase): CalculationInput {
  return {
    selection: { operatorId: item.operatorId, skillId: item.skillId },
    enemy: item.enemy,
    battle: { conditionEnabled: item.conditionEnabled, minPhysicalDamageRatio: 0.05 },
    development: {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
    },
  };
}

describe("non-frontend-replace-gate", () => {
  const rawData = {
    character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
    skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
    uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
    battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
    profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
    subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
  } satisfies RawGameData;
  const index = buildOperatorIndexFromRaw(rawData);
  const gateCases = loadJson<ReplaceGateCase[]>("fixtures/non-frontend-replace-gate.json");

  it("替换验收集通过：数值有限、规则命中、流结构完整", () => {
    for (const item of gateCases) {
      const result = calculateSkillDps(buildInput(item), index);
      expect(Number.isFinite(result.summary.hitDamage), `${item.id}-hit`).toBe(true);
      expect(Number.isFinite(result.summary.totalDamage), `${item.id}-total`).toBe(true);
      expect(Number.isFinite(result.summary.dps), `${item.id}-dps`).toBe(true);
      expect(result.schedule.duration, `${item.id}-duration`).toBeGreaterThanOrEqual(1);
      expect(result.warnings.length, `${item.id}-warnings`).toBeLessThanOrEqual(item.maxWarnings);

      for (const streamId of item.requireStreamIds) {
        expect(
          result.streams.some((stream) => stream.id === streamId),
          `${item.id}-stream-${streamId}`,
        ).toBe(true);
      }
      for (const ruleId of item.requireRuleIds) {
        expect(
          result.ruleTrace.some((rule) => rule.ruleId === ruleId && rule.applied),
          `${item.id}-rule-${ruleId}`,
        ).toBe(true);
      }
    }
  });
});
