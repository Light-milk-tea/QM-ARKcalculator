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

function assertWithinTolerance(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
): void {
  const diff = Math.abs(actual - expected);
  const baseline = Math.max(Math.abs(expected), 1);
  expect(diff / baseline, label).toBeLessThanOrEqual(tolerance);
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

      assertWithinTolerance(
        result.summary.hitDamage,
        item.expected.hitDamage ?? 0,
        tolerance,
        `${item.id}-hitDamage`,
      );
      assertWithinTolerance(
        result.summary.totalDamage,
        item.expected.totalDamage ?? 0,
        tolerance,
        `${item.id}-totalDamage`,
      );
      if (!result.schedule.isPermanent) {
        assertWithinTolerance(result.summary.dps, item.expected.dps ?? 0, tolerance, `${item.id}-dps`);
      }
      expect(result.formula.summary.length, `${item.id} missing formula.summary`).toBeGreaterThan(0);
      if (item.id === "top20-009") {
        expect(result.streams.some((stream) => stream.id === "OTHER_TRUE")).toBe(true);
      }
      if (item.id === "top20-010") {
        expect(result.warnings.some((warning) => warning.code === "WARN_ASSUMPTION_APPLIED")).toBe(
          true,
        );
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-011") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-005") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-002") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-003") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-015") {
        expect(result.streams.some((stream) => stream.id === "OTHER_TRUE")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
        expect(
          result.ruleTrace.some(
            (trace) => trace.ruleId === "phase1.mlynar3.verdict_true_stream" && trace.applied,
          ),
        ).toBe(true);
      }
      if (item.id === "top20-013" || item.id === "top20-016" || item.id === "top20-017") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-018") {
        expect(result.summary.hitDamage).toBeGreaterThan(0);
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
        expect(
          result.ruleTrace.some(
            (trace) => trace.ruleId === "phase1.qiubai3.switch_magical_burst" && trace.applied,
          ),
        ).toBe(true);
      }
      if (item.id === "top20-019") {
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
      }
      if (item.id === "top20-020") {
        expect(result.streams.some((stream) => stream.id === "OTHER_TRUE")).toBe(true);
        expect(result.warnings.some((warning) => warning.code === "WARN_UNMAPPED_KEY")).toBe(false);
        expect(result.warnings.some((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE")).toBe(false);
        expect(
          result.ruleTrace.some(
            (trace) => trace.ruleId === "phase1.reed23.burn_echo_proxy" && trace.applied,
          ),
        ).toBe(true);
      }
    }
  });

  it("Top20 warning 统计应可用于迁移待办", () => {
    const warningStats = readyCases
      .map((item) => {
        const result = calculateSkillDps(buildInput(item), index);
        return {
          id: item.id,
          partial: result.warnings.filter((warning) => warning.code === "WARN_PARTIAL_RULE_COVERAGE").length,
          unmapped: result.warnings.filter((warning) => warning.code === "WARN_UNMAPPED_KEY").length,
        };
      })
      .sort((a, b) => b.partial * 2 + b.unmapped - (a.partial * 2 + a.unmapped));

    expect(warningStats.length).toBeGreaterThan(0);
    expect(warningStats.every((item) => Number.isFinite(item.partial) && Number.isFinite(item.unmapped))).toBe(true);
  });

  it("条件开关样例：号角 S3 开启条件后 DPS 应提升", () => {
    const baseCase = top20Cases.find((item) => item.id === "top20-007");
    expect(baseCase).toBeTruthy();

    const offResult = calculateSkillDps(buildInput(baseCase!), index);
    const onResult = calculateSkillDps(
      buildInput({
        ...baseCase!,
        conditionEnabled: true,
      }),
      index,
    );

    expect(onResult.summary.dps).toBeGreaterThan(offResult.summary.dps);
    expect(
      onResult.ruleTrace.some(
        (trace) =>
          trace.ruleId === "phase1.horn3.conditional_overload" && trace.applied,
      ),
    ).toBe(true);
  });

  it("砾 S1 不应误触发 def 减防代理", () => {
    const result = calculateSkillDps(
      {
        selection: {
          operatorId: "char_237_gravel",
          skillId: "skchr_gravel_1",
        },
        enemy: {
          defense: 500,
          magicResistance: 0,
        },
        battle: {
          conditionEnabled: true,
          minPhysicalDamageRatio: 0.05,
        },
      },
      index,
    );

    expect(result.summary.hitDamage).toBeCloseTo(22.6, 4);
    expect(result.summary.totalDamage).toBeCloseTo(22.6, 4);
    expect(result.summary.dps).toBeCloseTo(22.6, 4);
    expect(
      result.ruleTrace.some(
        (trace) => trace.ruleId === "phase2.gravel1.no_def_shred_single_hit" && trace.applied,
      ),
    ).toBe(true);
  });

  it("第二批批量修复样例应对齐旧口径", () => {
    const cases = [
      {
        id: "strong-s1",
        operatorId: "char_272_strong",
        skillId: "skchr_strong_1",
        expected: { hitDamage: 1379.35, totalDamage: 2758.7, dps: 1379.35 },
        ruleId: "phase2.strong1.infected_expected_scale",
      },
      {
        id: "sunbr-s1",
        operatorId: "char_196_sunbr",
        skillId: "skchr_sunbr_1",
        expected: { hitDamage: 38.08, totalDamage: 38.08, dps: 38.08 },
        ruleId: "phase2.sunbr1.expected_talent_scale",
      },
      {
        id: "skgoat-s1",
        operatorId: "char_183_skgoat",
        skillId: "skcom_atk_up[2]",
        expected: { hitDamage: 694.26, totalDamage: 9135, dps: 365.4 },
        ruleId: "phase2.skgoat1.switch_magical",
      },
      {
        id: "pithst-s1",
        operatorId: "char_616_pithst",
        skillId: "skchr_pithst_1",
        expected: { hitDamage: 316.4, totalDamage: 11271.75, dps: 375.725 },
        ruleId: "phase2.pithst1.switch_magical",
      },
      {
        id: "ctrail-s1",
        operatorId: "char_4165_ctrail",
        skillId: "skchr_ctrail_1",
        expected: { hitDamage: 1016.032, totalDamage: 27094.18666666668, dps: 677.354666666667 },
        ruleId: "phase2.ctrail1.expected_talent_scale",
      },
      {
        id: "bubble-s1",
        operatorId: "char_381_bubble",
        skillId: "skcom_def_up[2]",
        expected: { hitDamage: 18.5, totalDamage: 539.5833333333334, dps: 15.416666666666668 },
        ruleId: "phase2.bubble1.no_def_shred_proxy",
      },
      {
        id: "deepcl-s1",
        operatorId: "char_110_deepcl",
        skillId: "skchr_deepcl_1",
        expected: { hitDamage: 282.1, totalDamage: 5712.525, dps: 190.4175 },
        ruleId: "phase2.deepcl1.legacy_timing_and_scale",
      },
      {
        id: "robrta-s1",
        operatorId: "char_484_robrta",
        skillId: "skchr_robrta_1",
        expected: { hitDamage: 355, totalDamage: 8283.333333333332, dps: 236.66666666666663 },
        ruleId: "phase2.robrta1.no_def_shred_proxy",
      },
      {
        id: "vrdant-s1",
        operatorId: "char_4107_vrdant",
        skillId: "skchr_vrdant_1",
        expected: { hitDamage: 232, totalDamage: 232, dps: 232 },
        ruleId: "phase2.vrdant1.no_def_shred_proxy",
      },
    ];

    for (const item of cases) {
      const result = calculateSkillDps(
        {
          selection: {
            operatorId: item.operatorId,
            skillId: item.skillId,
          },
          enemy: {
            defense: 500,
            magicResistance: 30,
          },
          battle: {
            conditionEnabled: true,
            minPhysicalDamageRatio: 0.05,
          },
        },
        index,
      );
      assertWithinTolerance(result.summary.hitDamage, item.expected.hitDamage, 0.0001, `${item.id}-hit`);
      assertWithinTolerance(result.summary.totalDamage, item.expected.totalDamage, 0.0001, `${item.id}-total`);
      assertWithinTolerance(result.summary.dps, item.expected.dps, 0.0001, `${item.id}-dps`);
      expect(
        result.ruleTrace.some((trace) => trace.ruleId === item.ruleId && trace.applied),
        `${item.id}-rule`,
      ).toBe(true);
    }
  });
});
