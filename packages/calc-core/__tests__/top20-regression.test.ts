import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

type Top20Case = {
  id: string;
  operator: string;
  skill: string;
  operatorId?: string;
  skillId?: string;
  status: "pending" | "ready";
  enemy: { defense: number; magicResistance: number };
  conditionEnabled: boolean;
  expected: { hitDamage: number | null; totalDamage: number | null; dps: number | null; tolerance: number };
};

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

function buildInput(item: Top20Case): CalculationInput {
  return {
    selection: {
      operatorId: item.operatorId ?? "",
      skillId: item.skillId ?? "",
    },
    enemy: item.enemy,
    battle: {
      conditionEnabled: item.conditionEnabled,
      minPhysicalDamageRatio: 0.05,
    },
  };
}

function assertWithinTolerance(actual: number, expected: number, tolerance: number): void {
  const diff = Math.abs(actual - expected);
  const baseline = Math.max(Math.abs(expected), 1);
  expect(diff / baseline).toBeLessThanOrEqual(tolerance);
}

describe("top20-priority-regression", () => {
  const rawData = {
    character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
    skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
    uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
    battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
    profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
    subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
  } satisfies RawGameData;

  const index = buildOperatorIndexFromRaw(rawData);
  const top20Cases = loadJson<Top20Case[]>("fixtures/top20-priority-cases.json");
  const readyCases = top20Cases.filter((item) => item.status === "ready");

  it("首批 Top20 样例与回归基线一致", () => {
    expect(readyCases.length).toBeGreaterThanOrEqual(3);

    for (const item of readyCases) {
      expect(item.operatorId, `${item.id} missing operatorId`).toBeTruthy();
      expect(item.skillId, `${item.id} missing skillId`).toBeTruthy();
      expect(item.expected.hitDamage, `${item.id} missing hitDamage`).not.toBeNull();
      expect(item.expected.totalDamage, `${item.id} missing totalDamage`).not.toBeNull();
      expect(item.expected.dps, `${item.id} missing dps`).not.toBeNull();

      const result = calculateSkillDps(buildInput(item), index);
      const tolerance = item.expected.tolerance;

      assertWithinTolerance(result.summary.hitDamage, item.expected.hitDamage ?? 0, tolerance);
      assertWithinTolerance(result.summary.totalDamage, item.expected.totalDamage ?? 0, tolerance);
      assertWithinTolerance(result.summary.dps, item.expected.dps ?? 0, tolerance);
      expect(result.formula.summary.length, `${item.id} missing formula.summary`).toBeGreaterThan(0);
    }
  });
});
