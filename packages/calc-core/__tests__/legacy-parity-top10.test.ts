import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

type TopCase = {
  id: string;
  operatorId: string;
  skillId: string;
  operator: string;
  skill: string;
  conditionEnabled: boolean;
  enemy: { defense: number; magicResistance: number };
};

type BaselineCase = {
  id: string;
  operatorId: string;
  skillId: string;
  expected: {
    hitDamage: number;
    totalDamage: number;
    dps: number;
  };
};

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

function buildInput(item: TopCase): CalculationInput {
  return {
    selection: {
      operatorId: item.operatorId,
      skillId: item.skillId,
    },
    enemy: item.enemy,
    battle: {
      conditionEnabled: item.conditionEnabled,
      minPhysicalDamageRatio: 0.05,
    },
  };
}

function ratioDiff(actual: number, expected: number): number {
  const baseline = Math.max(Math.abs(expected), 1);
  return Math.abs(actual - expected) / baseline;
}

describe("legacy-parity-top10", () => {
  it("输出前十样例与旧项目基线差异报告", () => {
    const rawData = {
      character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
      skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
      uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
      battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
      profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
      subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
    } satisfies RawGameData;
    const top10 = loadJson<TopCase[]>("fixtures/top20-priority-cases.json").slice(0, 10);
    const baseline = loadJson<BaselineCase[]>("fixtures/legacy-top10-baseline.json");
    const baselineById = new Map(baseline.map((item) => [item.id, item]));
    const index = buildOperatorIndexFromRaw(rawData);

    const report = top10.map((item) => {
      const base = baselineById.get(item.id);
      expect(base, `missing baseline for ${item.id}`).toBeTruthy();
      const result = calculateSkillDps(buildInput(item), index);
      const expected = base!.expected;
      const actual = result.summary;
      return {
        id: item.id,
        operator: item.operator,
        skill: item.skill,
        expected,
        actual,
        diff: {
          hitDamage: ratioDiff(actual.hitDamage, expected.hitDamage),
          totalDamage: ratioDiff(actual.totalDamage, expected.totalDamage),
          dps: ratioDiff(actual.dps, expected.dps),
        },
        warningCodes: result.warnings.map((warning) => warning.code),
      };
    });

    const maxDiff = report.reduce(
      (acc, item) => ({
        hitDamage: Math.max(acc.hitDamage, item.diff.hitDamage),
        totalDamage: Math.max(acc.totalDamage, item.diff.totalDamage),
        dps: Math.max(acc.dps, item.diff.dps),
      }),
      { hitDamage: 0, totalDamage: 0, dps: 0 },
    );

    if (process.env.LEGACY_PARITY_REPORT === "1") {
      const outputDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../.tmp");
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(
        resolve(outputDir, "legacy-parity-top10-report.json"),
        JSON.stringify({ maxDiff, report }, null, 2),
      );
    }

    // 默认软门禁：持续输出差异报告；开启严格模式后用于 CI 阻断。
    const strict = process.env.LEGACY_PARITY_STRICT === "1";
    if (strict) {
      expect(maxDiff.hitDamage).toBeLessThanOrEqual(0.03);
      expect(maxDiff.totalDamage).toBeLessThanOrEqual(0.03);
      expect(maxDiff.dps).toBeLessThanOrEqual(0.03);
    } else {
      expect(report).toHaveLength(10);
      expect(Number.isFinite(maxDiff.hitDamage)).toBe(true);
      expect(Number.isFinite(maxDiff.totalDamage)).toBe(true);
      expect(Number.isFinite(maxDiff.dps)).toBe(true);
    }
  });
});
