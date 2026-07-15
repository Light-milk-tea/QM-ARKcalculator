import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

function loadJson<T>(relativePath: string): T {
  const absolutePath = resolve(fileURLToPath(new URL(".", import.meta.url)), relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

function buildInput(operatorId: string, skillId: string): CalculationInput {
  return {
    selection: { operatorId, skillId },
    enemy: { defense: 0, magicResistance: 0 },
    battle: { conditionEnabled: true, minPhysicalDamageRatio: 0.05 },
    development: {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
    },
  };
}

describe("heal-hps-e2", () => {
  const rawData = {
    character_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/character_table.json"),
    skill_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/skill_table.json"),
    uniequip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/uniequip_table.json"),
    battle_equip_table: loadJson<Record<string, unknown>>("../../../apps/web/public/json/battle_equip_table.json"),
    profession: loadJson<Record<string, unknown>>("../../../apps/web/public/json/profession.json"),
    subProfessionId: loadJson<Record<string, unknown>>("../../../apps/web/public/json/subProfessionId.json"),
  } satisfies RawGameData;
  const index = buildOperatorIndexFromRaw(rawData);

  const samples = [
    {
      name: "芙蓉",
      operatorId: "char_120_hibisc",
      skillId: "skcom_heal_up[1]",
      expectZeroDamage: true,
      expectStopAttack: false,
    },
    {
      name: "斑点",
      operatorId: "char_284_spot",
      skillId: "skchr_spot_1",
      expectZeroDamage: true,
      expectStopAttack: true,
    },
    {
      name: "嘉维尔",
      operatorId: "char_187_ccheal",
      skillId: "skchr_ccheal_1",
      expectZeroDamage: false,
      expectStopAttack: false,
    },
    {
      name: "波登可",
      operatorId: "char_258_podego",
      skillId: "skchr_podego_1",
      expectZeroDamage: true,
      expectStopAttack: true,
    },
    {
      name: "临光",
      operatorId: "char_148_nearl",
      skillId: "skchr_nearl_2",
      expectZeroDamage: true,
      expectStopAttack: true,
    },
    {
      name: "桃金娘",
      operatorId: "char_151_myrtle",
      skillId: "skchr_myrtle_2",
      expectZeroDamage: true,
      expectStopAttack: true,
    },
  ] as const;

  it("医疗与停攻纯治疗抽样应输出可解释 HPS", () => {
    for (const item of samples) {
      const result = calculateSkillDps(buildInput(item.operatorId, item.skillId), index);
      expect(result.healing.enabled, `${item.name} healing.enabled`).toBe(true);
      expect(result.healing.hps, `${item.name} hps`).toBeGreaterThan(0);
      expect(result.healing.totalHealing, `${item.name} totalHealing`).toBeGreaterThan(0);
      expect(result.formula.healing?.length ?? 0, `${item.name} formula.healing`).toBeGreaterThan(0);
      expect(
        result.healing.streams.some((stream) => stream.id === "HEAL_MAIN"),
        `${item.name} HEAL_MAIN`,
      ).toBe(true);

      if (item.expectZeroDamage) {
        expect(result.summary.totalDamage, `${item.name} totalDamage`).toBe(0);
        expect(result.summary.dps, `${item.name} dps`).toBe(0);
      }

      if (item.expectStopAttack) {
        expect(result.streams[0]?.attackType, `${item.name} attackType`).toBe("none");
      }
    }
  });
});
