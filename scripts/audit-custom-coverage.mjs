import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsPath = resolve(root, "apps/web/public/json/skill_table.json");
const top20CasesPath = resolve(root, "packages/calc-core/__tests__/fixtures/top20-priority-cases.json");

const MIN_BLACKBOARD_COVERAGE = 0.75;
const MAX_LIKELY_CUSTOM_RATIO = 0.25;
const MIN_READY_TOP20 = Number.parseInt(process.env.MIN_READY_TOP20 ?? "12", 10);

const raw = await readFile(skillsPath, "utf8");
const skillTable = JSON.parse(raw);
const top20CasesRaw = await readFile(top20CasesPath, "utf8");
const top20Cases = JSON.parse(top20CasesRaw);

const knownBlackboardKeys = new Set([
  "atk",
  "atk_scale",
  "damage_scale",
  "attack_speed",
  "base_attack_time",
  "cnt",
  "times",
  "interval",
  "duration",
  "def",
  "magic_resistance",
  "ep_damage_ratio",
  "attack@atk",
  "attack@atk_scale",
  "attack@cnt",
  "attack@times",
  "attack@duration",
  "attack@interval",
  "attack@def",
  "attack@stun",
  "attack@prob",
  "attack@move_speed",
  "attack@sluggish",
  "attack@force",
  "attack@heal_scale",
  "attack@ep_damage_ratio",
  "attack@max_target",
  "attack@trigger_time",
  "max_target",
  "stun",
  "appear.atk_scale",
  "appear.stun",
  "horn_s_3[overload_start].atk",
  "horn_s_3[overload_start].interval",
  "horn_s_3[overload_start].hp_ratio",
  "horn_s_3[overload_start].damage_duration",
  "texas2_s_3[sword].interval",
  "thorns_s_3[b].atk",
  "thorns_s_3[b].attack_speed",
  "thorns_s_3[b].duration",
  "heal_scale",
  "heal_hpratio",
  "heal_hp_ratio",
  "heal_ratio",
  "heal",
  "heal_by_atk",
  "attack@heal_ratio",
  "attack@heal_hpratio",
  "heal_interval",
  "heal_times",
  "heal_duration",
  "attack@heal_interval",
  "attack@heal_times",
  "attack@heal_duration",
]);

const knownBlackboardPrefixes = ["talent@", "recipe.", "sandbox_res_collector."];
const ignoredUnmappedBlackboardKeysBySkillId = {
  // 艾雅法拉 S2 的以下键在当前单目标 DPS 口径中不作为主结算输入：
  // - atk_scale_2: 与 atk_scale 重复倍率键
  // - fk/ct: 触发批次参数，暂不进入主链伤害模型
  skchr_amgoat_2: new Set(["atk_scale_2", "fk", "ct"]),
  // 假日威龙陈 S3 的 projectile_life_time 主要影响弹道生命周期，不进入当前 DPS 主结算。
  skchr_chen2_3: new Set(["attack@projectile_life_time"]),
  // 玛恩纳 S3 的以下键主要影响特性增益与击杀回转，不进入当前技能窗口 DPS 主结算。
  skchr_mlynar_3: new Set(["trait_up", "per_kill_reduce"]),
  // 水月 S2 的 unmovable 为控制语义，不影响当前单目标 DPS 主链。
  skchr_mizuki_2: new Set(["attack@unmovable"]),
  // 史尔特尔 S3 的以下键只影响攻击范围/生存，不参与当前 DPS 计算语义。
  skchr_surtr_3: new Set(["ability_range_forward_extend", "max_hp", "hp_ratio"]),
  // 伊芙利特 S2 的 burn.atk_scale / ct 主要用于灼烧分段与触发节奏，不直接作为当前单目标主链伤害输入。
  skchr_ifrit_2: new Set(["burn.atk_scale", "ct"]),
  // 归鲨 S3 的以下键为生存阈值/额外段语义，当前版本通过自定义规则近似，不直接进入主链面板计算。
  skchr_ghost2_3: new Set(["max_hp", "attack@atk_scale_ex", "attack@hp_ratio"]),
  // 白铁 S2 的 fake_interval 用于伪攻间节拍标注，不直接作为主链攻间输入。
  skchr_ironmn_2: new Set(["fake_interval"]),
  // 仇白 S3 的以下键用于层数与天赋耦合，不直接作为当前单目标主链 DPS 输入。
  skchr_qiubai_3: new Set(["max_stack_cnt", "talent_scale"]),
  // 逻各斯 S3 的 projectile_move_scale 影响弹道运动表现，不进入当前主链结算。
  skchr_logos_3: new Set(["projectile_move_scale"]),
  // 焰影苇草 S3 的切换态 atk 键暂由 custom 规则近似承接，不直接纳入主链面板。
  skchr_reed2_3: new Set(["reed2_skil_3[switch_mode].atk"]),
  // 阿米娅（术）S3 的 max_hp 为生存语义，不参与当前技能窗口 DPS 主链结算。
  skchr_amiya_3: new Set(["max_hp"]),
};

function isKnownBlackboardKey(key) {
  if (knownBlackboardKeys.has(key)) return true;
  return knownBlackboardPrefixes.some((prefix) => key.startsWith(prefix));
}

function isIgnoredUnmappedBlackboardKey(skillId, key) {
  return ignoredUnmappedBlackboardKeysBySkillId[skillId]?.has(key) ?? false;
}

let total = 0;
let withBlackboard = 0;
let withLikelyCustom = 0;

for (const skill of Object.values(skillTable)) {
  const levels = skill?.levels;
  if (!Array.isArray(levels) || levels.length === 0) continue;
  total += 1;
  const bb = levels[levels.length - 1]?.blackboard ?? [];
  if (bb.length > 0) withBlackboard += 1;
  if (
    bb.some((item) =>
      ["cnt", "prob", "max_target", "interval"].includes(String(item?.key ?? "")),
    )
  ) {
    withLikelyCustom += 1;
  }
}

const blackboardCoverage = total > 0 ? withBlackboard / total : 0;
const likelyCustomRatio = withBlackboard > 0 ? withLikelyCustom / withBlackboard : 0;
const readyTop20 = top20Cases.filter((item) => item.status === "ready").length;
const pendingTop20 = top20Cases.filter((item) => item.status !== "ready").length;

function collectWarningStats(cases) {
  const warningStatsBySkill = {};
  const warningCountByCode = {
    WARN_PARTIAL_RULE_COVERAGE: 0,
    WARN_UNMAPPED_KEY: 0,
  };

  for (const item of cases) {
    if (item.status !== "ready" || !item.operatorId || !item.skillId) continue;
    const skill = skillTable[item.skillId];
    const levels = skill?.levels ?? [];
    const blackboard = levels[levels.length - 1]?.blackboard ?? [];
    const keys = blackboard
      .map((entry) => String(entry?.key ?? ""))
      .filter((key) => key.length > 0);
    const unmappedKeys = keys.filter(
      (key) => !isKnownBlackboardKey(key) && !isIgnoredUnmappedBlackboardKey(item.skillId, key),
    );
    const unmappedCount = unmappedKeys.length > 0 ? 1 : 0;
    const partialCount = unmappedCount;

    warningCountByCode.WARN_PARTIAL_RULE_COVERAGE += partialCount;
    warningCountByCode.WARN_UNMAPPED_KEY += unmappedCount;
    warningStatsBySkill[item.skillId] = {
      caseId: item.id,
      operator: item.operator,
      skill: item.skill,
      partialCoverage: partialCount,
      unmappedKey: unmappedCount,
      unmappedKeys,
    };
  }

  const migrationTodo = Object.entries(warningStatsBySkill)
    .filter(([, value]) => value.partialCoverage > 0 || value.unmappedKey > 0)
    .map(([skillId, value]) => ({
      skillId,
      caseId: value.caseId,
      operator: value.operator,
      skill: value.skill,
      score: value.partialCoverage * 2 + value.unmappedKey,
      partialCoverage: value.partialCoverage,
      unmappedKey: value.unmappedKey,
    }))
    .sort((a, b) => b.score - a.score);

  return { warningStatsBySkill, warningCountByCode, migrationTodo };
}

const warningStats = collectWarningStats(top20Cases);

console.log(
  JSON.stringify(
    {
      totalSkills: total,
      skillsWithBlackboard: withBlackboard,
      likelyNeedCustomRules: withLikelyCustom,
      blackboardCoverage,
      likelyCustomRatio,
      readyTop20,
      pendingTop20,
      warningCountByCode: warningStats.warningCountByCode,
      migrationTodo: warningStats.migrationTodo,
      warningStatsBySkill: warningStats.warningStatsBySkill,
      thresholds: {
        minBlackboardCoverage: MIN_BLACKBOARD_COVERAGE,
        maxLikelyCustomRatio: MAX_LIKELY_CUSTOM_RATIO,
        minReadyTop20: MIN_READY_TOP20,
      },
    },
    null,
    2,
  ),
);

const violations = [];
if (blackboardCoverage < MIN_BLACKBOARD_COVERAGE) {
  violations.push(
    `blackboardCoverage=${blackboardCoverage.toFixed(4)} < ${MIN_BLACKBOARD_COVERAGE.toFixed(2)}`,
  );
}
if (likelyCustomRatio > MAX_LIKELY_CUSTOM_RATIO) {
  violations.push(
    `likelyCustomRatio=${likelyCustomRatio.toFixed(4)} > ${MAX_LIKELY_CUSTOM_RATIO.toFixed(2)}`,
  );
}
if (readyTop20 < MIN_READY_TOP20) {
  violations.push(`readyTop20=${readyTop20} < ${MIN_READY_TOP20}`);
}

if (violations.length > 0) {
  console.error("\n[CustomAudit] quality threshold violations:");
  for (const issue of violations) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
}
