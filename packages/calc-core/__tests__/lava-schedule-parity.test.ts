import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

describe("lava-schedule-parity", () => {
  const rawData = {
    character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
    skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
    uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
    battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
    profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
    subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
  } satisfies RawGameData;
  const index = buildOperatorIndexFromRaw(rawData);

  it("炎熔S1攻击间隔与旧版口径对齐", () => {
    const result = calculateSkillDps(
      {
        selection: { operatorId: "char_121_lava", skillId: "skcom_magic_rage[1]" },
        enemy: { defense: 1000, magicResistance: 0 },
        battle: { conditionEnabled: false, minPhysicalDamageRatio: 0.05 },
      },
      index,
    );

    expect(result.schedule.attackInterval).toBeCloseTo(1.8354, 3);
    expect(result.summary.hitDamage).toBeCloseTo(642, 2);
    expect(result.summary.totalDamage).toBeCloseTo(6995.5862, 2);
    expect(result.summary.dps).toBeCloseTo(349.7793, 2);
    expect(
      result.ruleTrace.some(
        (trace) => trace.ruleId === "phase1.lava.s1.schedule_parity" && trace.applied,
      ),
    ).toBe(true);
  });
});
