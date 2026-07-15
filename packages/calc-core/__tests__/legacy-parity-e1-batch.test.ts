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

type E1Case = {
  id: string;
  operator: string;
  operatorId: string;
  skillId: string;
  skillLabel: string;
  source: "top20" | "common";
};

type Top20Case = {
  id: string;
  operatorId?: string;
  skillId?: string;
  enemy: { defense: number; magicResistance: number };
  conditionEnabled: boolean;
  expected: { hitDamage: number | null; totalDamage: number | null; dps: number | null; tolerance: number };
};

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

function loadJson<T>(relativeOrAbsolutePath: string): T {
  const absolutePath = relativeOrAbsolutePath.startsWith("/")
    ? relativeOrAbsolutePath
    : resolve(fileURLToPath(new URL(".", import.meta.url)), relativeOrAbsolutePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

function ratioDiff(actual: number, expected: number): number {
  const baseline = Math.max(Math.abs(expected), 1);
  return Math.abs(actual - expected) / baseline;
}

function buildInput(
  operatorId: string,
  skillId: string,
  enemy: { defense: number; magicResistance: number },
  conditionEnabled: boolean,
): CalculationInput {
  return {
    selection: { operatorId, skillId },
    enemy,
    battle: { conditionEnabled, minPhysicalDamageRatio: 0.05 },
    development: {
      eliteStage: 2,
      skillLevel: 10,
      potentialRank: 6,
      trust: 100,
      moduleStage: 0,
    },
  };
}

describe("legacy-parity-e1-batch", () => {
  const e1Cases = loadJson<E1Case[]>("fixtures/e1-secondary-skill-cases.json");
  const top20Cases = loadJson<Top20Case[]>("fixtures/top20-priority-cases.json");
  const top20BySkillId = new Map(
    top20Cases.filter((item) => item.skillId).map((item) => [item.skillId as string, item]),
  );

  it("覆盖 Top20 优先技能 + 一批常用干员非首技能", () => {
    expect(e1Cases.length).toBeGreaterThanOrEqual(30);
    expect(e1Cases.filter((item) => item.source === "top20")).toHaveLength(20);
    expect(e1Cases.filter((item) => item.source === "common").length).toBeGreaterThanOrEqual(10);
  });

  it("断言抽样技能均非 skills[0]；Top20 对齐 fixture，常用批次输出旧口径差异报告", async () => {
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

    for (const item of e1Cases) {
      const operator = index.operators[item.operatorId];
      expect(operator, `missing operator ${item.operatorId}`).toBeTruthy();
      const firstSkillId = operator.skills[0]?.id;
      expect(item.skillId, `${item.id} must not be first skill`).not.toBe(firstSkillId);
      expect(
        operator.skills.some((skill) => skill.id === item.skillId),
        `${item.id} skill missing on operator`,
      ).toBe(true);
    }

    const top20Rows = e1Cases.filter((item) => item.source === "top20");
    for (const item of top20Rows) {
      const fixture = top20BySkillId.get(item.skillId);
      expect(fixture, `${item.id} missing top20 fixture`).toBeTruthy();
      const result = calculateSkillDps(
        buildInput(item.operatorId, item.skillId, fixture!.enemy, fixture!.conditionEnabled),
        index,
      );
      const tolerance = fixture!.expected.tolerance;
      expect(
        ratioDiff(result.summary.totalDamage, fixture!.expected.totalDamage ?? 0),
        `${item.id} totalDamage`,
      ).toBeLessThanOrEqual(tolerance);
      if (!result.schedule.isPermanent) {
        expect(ratioDiff(result.summary.dps, fixture!.expected.dps ?? 0), `${item.id} dps`).toBeLessThanOrEqual(
          tolerance,
        );
      }
    }

    const commonRows = e1Cases.filter((item) => item.source === "common");
    if (!hasLegacyProjectFiles()) {
      expect(commonRows.length).toBeGreaterThanOrEqual(10);
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

    // 常用批次沿用首技能对照参数（敌防/抗 = 0），便于与结果对比.md 主表口径衔接。
    const enemy = { defense: 0, magicResistance: 0 };
    const report = commonRows.map((item) => {
      const newResult = calculateSkillDps(buildInput(item.operatorId, item.skillId, enemy, true), index);
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
        id: item.id,
        operator: item.operator,
        operatorId: item.operatorId,
        skillId: item.skillId,
        skillLabel: item.skillLabel,
        source: item.source,
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

    const mismatched = report
      .filter((item) => item.diff.totalDamage > 0.03 || item.diff.dps > 0.03)
      .sort((a, b) => b.diff.dps - a.diff.dps);

    if (process.env.LEGACY_PARITY_REPORT === "1") {
      const outputDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "../.tmp");
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(
        resolve(outputDir, "legacy-parity-e1-batch-report.json"),
        JSON.stringify(
          {
            top20Covered: top20Rows.length,
            commonCovered: commonRows.length,
            maxDiff,
            mismatchedCount: mismatched.length,
            mismatched,
            report,
          },
          null,
          2,
        ),
      );
    }

    expect(report).toHaveLength(commonRows.length);
    expect(Number.isFinite(maxDiff.totalDamage)).toBe(true);
    expect(Number.isFinite(maxDiff.dps)).toBe(true);
  });
});
