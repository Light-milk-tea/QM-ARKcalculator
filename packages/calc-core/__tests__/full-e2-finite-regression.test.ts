import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

function makeInput(operatorId: string, skillId: string): CalculationInput {
  return {
    selection: { operatorId, skillId },
    enemy: { defense: 1000, magicResistance: 30 },
    battle: { conditionEnabled: false, minPhysicalDamageRatio: 0.05 },
    development: {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
    },
  };
}

describe("full-e2-finite-regression", () => {
  const rawData = {
    character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
    skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
    uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
    battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
    profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
    subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
  } satisfies RawGameData;

  const index = buildOperatorIndexFromRaw(rawData);

  it("全量干员技能在 E2 主档位下数值应有限", () => {
    let checked = 0;
    for (const operator of Object.values(index.operators)) {
      for (const skill of operator.skills) {
        const result = calculateSkillDps(makeInput(operator.id, skill.id), index);
        checked += 1;
        expect(Number.isFinite(result.summary.hitDamage), `${operator.id}/${skill.id} hit`).toBe(true);
        expect(Number.isFinite(result.summary.totalDamage), `${operator.id}/${skill.id} total`).toBe(true);
        expect(Number.isFinite(result.summary.dps), `${operator.id}/${skill.id} dps`).toBe(true);
        expect(result.schedule.duration, `${operator.id}/${skill.id} duration`).toBeGreaterThanOrEqual(1);
        expect(result.streams.length, `${operator.id}/${skill.id} streams`).toBeGreaterThan(0);
      }
    }
    expect(checked).toBeGreaterThan(500);
  });
});
