import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

type D6Case = {
  operator: string;
  operatorId: string;
  skillId: string;
};

const D6_CASES: D6Case[] = [
  { operator: "鞭刃", operatorId: "char_265_sophia", skillId: "skchr_sophia_1" },
  { operator: "苍苔", operatorId: "char_4106_bryota", skillId: "skchr_bryota_1" },
  { operator: "医生", operatorId: "char_4125_rdoc", skillId: "skchr_rdoc_1" },
  { operator: "芙兰卡", operatorId: "char_106_franka", skillId: "skcom_quickattack[3]" },
  { operator: "炎客", operatorId: "char_131_flameb", skillId: "skchr_flameb_1" },
  { operator: "摩根", operatorId: "char_154_morgan", skillId: "skchr_morgan_1" },
  { operator: "Sharp", operatorId: "char_508_aguard", skillId: "skchr_aguard_1" },
  { operator: "莱欧斯", operatorId: "char_4142_laios", skillId: "skchr_laios_1" },
  { operator: "因陀罗", operatorId: "char_155_tiger", skillId: "skchr_tiger_1" },
  { operator: "燧石", operatorId: "char_415_flint", skillId: "skchr_flint_1" },
  { operator: "达格达", operatorId: "char_157_dagda", skillId: "skchr_dagda_1" },
  { operator: "拉普兰德", operatorId: "char_140_whitew", skillId: "skchr_whitew_1" },
  { operator: "断崖", operatorId: "char_294_ayer", skillId: "skchr_ayer_1" },
  { operator: "烈夏", operatorId: "char_194_leto", skillId: "skcom_quickattack[3]" },
  { operator: "铎铃", operatorId: "char_4083_chimes", skillId: "skcom_atk_up[3]" },
  { operator: "柏喙", operatorId: "char_252_bibeak", skillId: "skchr_bibeak_1" },
  { operator: "战车", operatorId: "char_459_tachak", skillId: "skchr_tachak_1" },
  { operator: "幽灵鲨", operatorId: "char_143_ghost", skillId: "skcom_atk_up[3]" },
  { operator: "布洛卡", operatorId: "char_356_broca", skillId: "skchr_broca_1" },
  { operator: "导火索", operatorId: "char_4126_fuze", skillId: "skchr_fuze_1" },
  { operator: "摆渡人", operatorId: "char_4166_varkis", skillId: "skchr_varkis_1" },
  { operator: "星极", operatorId: "char_274_astesi", skillId: "skchr_astesi_1" },
  { operator: "铸铁", operatorId: "char_333_sidero", skillId: "skcom_heal_self[3]" },
  { operator: "赤冬", operatorId: "char_475_akafyu", skillId: "skchr_akafyu_1" },
  { operator: "火龙S黑角", operatorId: "char_1030_noirc2", skillId: "skchr_noirc2_1" },
  { operator: "羽毛笔", operatorId: "char_421_crow", skillId: "skchr_crow_1" },
  { operator: "海沫", operatorId: "char_4066_highmo", skillId: "skchr_highmo_1" },
  { operator: "龙舌兰", operatorId: "char_486_takila", skillId: "skchr_takila_1" },
  { operator: "奥达", operatorId: "char_4131_odda", skillId: "skchr_odda_1" },
  { operator: "聆音", operatorId: "char_4187_graceb", skillId: "skchr_graceb_1" },
];

const calcCoreRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const qmRoot = resolve(calcCoreRoot, "../..");
const oldRoot = resolve(qmRoot, "../ArknightCalculator");
const legacySkillCalculatorPath = resolve(oldRoot, "src/model/SkillCalculator.js");
const legacyRequiredFiles = [
  legacySkillCalculatorPath,
  resolve(oldRoot, "public/json/character_table.json"),
  resolve(oldRoot, "public/json/skill_table.json"),
  resolve(oldRoot, "public/json/subProfessionId.json"),
  resolve(oldRoot, "public/json/uniequip_table.json"),
  resolve(oldRoot, "public/json/battle_equip_table.json"),
];

function hasLegacyProjectFiles(): boolean {
  return legacyRequiredFiles.every((filePath) => existsSync(filePath));
}

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

describe("legacy-parity-d6-batch", () => {
  it("输出 D6 批次的旧口径差异报告", async () => {
    if (!hasLegacyProjectFiles()) {
      // CI 环境通常不携带旧项目仓库；缺失时跳过外部对比，仅保留本地可执行性。
      expect(true).toBe(true);
      return;
    }

    const oldSkillCalculatorModule = (await import(legacySkillCalculatorPath)) as {
      default: LegacySkillCalculator;
    };
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

    const report = D6_CASES.map((item) => {
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
        resolve(outputDir, "legacy-parity-d6-batch-report.json"),
        JSON.stringify({ maxDiff, report }, null, 2),
      );
    }

    expect(report).toHaveLength(D6_CASES.length);
    expect(Number.isFinite(maxDiff.totalDamage)).toBe(true);
    expect(Number.isFinite(maxDiff.dps)).toBe(true);
  });
});
