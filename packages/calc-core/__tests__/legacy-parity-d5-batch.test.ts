import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CalculationInput, RawGameData } from "../src";
import { buildOperatorIndexFromRaw, calculateSkillDps } from "../src";

type LegacySkillCalculator = {
  skillMemberReport: (
    type: string,
    skillRow: Record<string, unknown>,
    characterJsonData: Record<string, unknown>,
    enemyData: { enemyDef: number; enemyRes: number },
    subProfessionIdJsonData: Record<string, unknown>,
    uniequipJsonData: Record<string, unknown>,
    battleEquipJsonData: Record<string, unknown>,
    candidates_check?: boolean,
  ) => {
    member: {
      name: string;
      potentialItemId: string;
    };
    dps: number;
    total: number;
  };
};

type CharacterLike = {
  potentialItemId?: string;
};

type D5Case = {
  operator: string;
  operatorId: string;
  skillId: string;
};

const D5_CASES: D5Case[] = [
  { operator: "瑰盐", operatorId: "char_4163_rosesa", skillId: "skchr_rosesa_1" },
  { operator: "凛冬", operatorId: "char_115_headbr", skillId: "skcom_charge_cost[3]" },
  { operator: "德克萨斯", operatorId: "char_102_texas", skillId: "skcom_charge_cost[3]" },
  { operator: "贾维", operatorId: "char_349_chiave", skillId: "skcom_charge_cost[3]" },
  { operator: "青枳", operatorId: "char_488_buildr", skillId: "skcom_charge_cost[3]" },
  { operator: "郁金香", operatorId: "char_513_apionr", skillId: "skchr_apionr_1" },
  { operator: "红隼", operatorId: "char_4023_rfalcn", skillId: "skcom_charge_cost[3]" },
  { operator: "松桐", operatorId: "char_4199_makiri", skillId: "skchr_makiri_1" },
  { operator: "苇草", operatorId: "char_261_sddrag", skillId: "skcom_quickattack[3]" },
  { operator: "野鬃", operatorId: "char_496_wildmn", skillId: "skchr_wildmn_1" },
  { operator: "历阵锐枪芬", operatorId: "char_1036_fang2", skillId: "skchr_fang2_1" },
  { operator: "极境", operatorId: "char_401_elysm", skillId: "skcom_assist_cost[3]" },
  { operator: "万顷", operatorId: "char_4119_wanqin", skillId: "skcom_assist_cost[3]" },
  { operator: "夜半", operatorId: "char_476_blkngt", skillId: "skchr_blkngt_1" },
  { operator: "渡桥", operatorId: "char_4147_mitm", skillId: "skchr_mitm_1" },
  { operator: "晓歌", operatorId: "char_497_ctable", skillId: "skchr_ctable_1" },
  { operator: "谜图", operatorId: "char_4017_puzzle", skillId: "skchr_puzzle_1" },
  { operator: "齐尔查克", operatorId: "char_4144_chilc", skillId: "skchr_chilc_1" },
  { operator: "寻澜", operatorId: "char_4052_surfer", skillId: "skchr_surfer_1" },
  { operator: "诗怀雅", operatorId: "char_308_swire", skillId: "skchr_swire_1" },
];

const calcCoreRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const qmRoot = resolve(calcCoreRoot, "../..");
const oldRoot = resolve(qmRoot, "../ArknightCalculator");

function loadJson<T>(absolutePath: string): T {
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

function ratioDiff(actual: number, expected: number): number {
  const baseline = Math.max(Math.abs(expected), 1);
  return Math.abs(actual - expected) / baseline;
}

describe("legacy-parity-d5-batch", () => {
  it("输出 D5 批次的旧口径差异报告", async () => {
    const oldSkillCalculatorModule = (await import(
      "../../../../ArknightCalculator/src/model/SkillCalculator.js"
    )) as { default: LegacySkillCalculator };
    const legacySkillCalculator = oldSkillCalculatorModule.default;

    const oldCharacterJson = loadJson<Record<string, unknown>>(
      resolve(oldRoot, "public/json/character_table.json"),
    );
    const oldSkillJson = loadJson<Record<string, Record<string, unknown>>>(
      resolve(oldRoot, "public/json/skill_table.json"),
    );
    const oldSubProfessionJson = loadJson<Record<string, unknown>>(
      resolve(oldRoot, "public/json/subProfessionId.json"),
    );
    const oldUniequipJson = loadJson<Record<string, unknown>>(
      resolve(oldRoot, "public/json/uniequip_table.json"),
    );
    const oldBattleEquipJson = loadJson<Record<string, unknown>>(
      resolve(oldRoot, "public/json/battle_equip_table.json"),
    );

    const rawData = {
      character_table: loadJson<Record<string, unknown>>(
        resolve(qmRoot, "apps/web/public/json/character_table.json"),
      ),
      skill_table: loadJson<Record<string, unknown>>(resolve(qmRoot, "apps/web/public/json/skill_table.json")),
      uniequip_table: loadJson<Record<string, unknown>>(
        resolve(qmRoot, "apps/web/public/json/uniequip_table.json"),
      ),
      battle_equip_table: loadJson<Record<string, unknown>>(
        resolve(qmRoot, "apps/web/public/json/battle_equip_table.json"),
      ),
      profession: loadJson<Record<string, unknown>>(resolve(qmRoot, "apps/web/public/json/profession.json")),
      subProfessionId: loadJson<Record<string, unknown>>(
        resolve(qmRoot, "apps/web/public/json/subProfessionId.json"),
      ),
    } satisfies RawGameData;
    const qmCharacters = rawData.character_table as Record<string, CharacterLike>;
    const index = buildOperatorIndexFromRaw(rawData);

    const report = D5_CASES.map((item) => {
      const operator = index.operators[item.operatorId];
      expect(operator, `missing operator ${item.operatorId}`).toBeTruthy();
      const firstSkill = operator.skills[0];
      expect(firstSkill?.id, `${item.operator} missing first skill`).toBe(item.skillId);

      const newResult = calculateSkillDps(buildInput(item.operatorId, item.skillId), index);
      const qmCharacter = qmCharacters[item.operatorId];
      const memberId = typeof qmCharacter?.potentialItemId === "string" ? qmCharacter.potentialItemId : undefined;
      const legacySkillRow = {
        ...(oldSkillJson[item.skillId] ?? {}),
        skillId: item.skillId,
        memberId,
      };
      const legacyResult = legacySkillCalculator.skillMemberReport(
        "精二滿級",
        legacySkillRow,
        oldCharacterJson,
        { enemyDef: 0, enemyRes: 0 },
        oldSubProfessionJson,
        oldUniequipJson,
        oldBattleEquipJson,
        true,
      );

      return {
        operator: item.operator,
        operatorId: item.operatorId,
        skillId: item.skillId,
        legacy: {
          usedMemberId: memberId ?? null,
          memberName: legacyResult.member.name,
          memberId: legacyResult.member.potentialItemId,
          totalDamage: legacyResult.total,
          dps: legacyResult.dps,
        },
        current: {
          totalDamage: newResult.summary.totalDamage,
          dps: newResult.summary.dps,
        },
        diff: {
          totalDamage: ratioDiff(newResult.summary.totalDamage, legacyResult.total),
          dps: ratioDiff(newResult.summary.dps, legacyResult.dps),
        },
        warnings: newResult.warnings.map((warning) => warning.code),
      };
    });

    const maxDiff = report.reduce(
      (acc, item) => ({
        totalDamage: Math.max(acc.totalDamage, item.diff.totalDamage),
        dps: Math.max(acc.dps, item.diff.dps),
      }),
      { totalDamage: 0, dps: 0 },
    );

    if (process.env.LEGACY_PARITY_REPORT === "1") {
      const outputDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../.tmp");
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(
        resolve(outputDir, "legacy-parity-d5-batch-report.json"),
        JSON.stringify({ maxDiff, report }, null, 2),
      );
    }

    expect(report).toHaveLength(D5_CASES.length);
    expect(Number.isFinite(maxDiff.totalDamage)).toBe(true);
    expect(Number.isFinite(maxDiff.dps)).toBe(true);
  });
});
