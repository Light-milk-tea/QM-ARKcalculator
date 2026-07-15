import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsPath = resolve(root, "apps/web/public/json/skill_table.json");
const charactersPath = resolve(root, "apps/web/public/json/character_table.json");
const top20CasesPath = resolve(root, "packages/calc-core/__tests__/fixtures/top20-priority-cases.json");

// E4：以可选干员技能为审计口径（排除 TOKEN/TRAP 与无归属技能稀释）。
const MIN_BLACKBOARD_COVERAGE = 0.95;
const MAX_LIKELY_CUSTOM_RATIO = 0.22;
const MIN_KNOWN_KEY_COVERAGE = 0.7;
const MIN_READY_TOP20 = Number.parseInt(process.env.MIN_READY_TOP20 ?? "12", 10);

const raw = await readFile(skillsPath, "utf8");
const skillTable = JSON.parse(raw);
const characterTable = JSON.parse(await readFile(charactersPath, "utf8"));
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
  // E4：高频非主链/效用键显式入库，降低误报与 keyCoverage 压力。
  "cost",
  "hp_ratio",
  "max_hp",
  "value",
  "score",
  "next_score",
  "enemy_key",
  "force",
  "block_cnt",
  "talent_scale",
  "branch_id",
  "sluggish",
  "ct",
  "move_speed",
  "sp",
  "prob",
  "default_recipe_idx",
  "ability_range_forward_extend",
  "projectile_range",
  "projectile_delay_time",
  "projectile_life_time",
  "attack@projectile_life_time",
  "taunt_level",
  "max_cnt",
  "range_id",
  "max_summon_cnt",
  "skill_max_trigger_time",
  "dialogue_config_signal_key",
  "max_stack_cnt",
  "cold",
  "attack@hp_ratio",
  "hp_recovery_per_sec",
  "attack@atk_to_hp_recovery_ratio",
  "hp_recovery_per_sec_by_max_hp_ratio",
  "damage",
  "range_num",
  "can_select_num",
  "respawn_time",
  "atk_scale_2",
  "live_duration",
  "damage_resistance",
  "mode",
  "ammo",
  "attack@ammo",
  "fake_interval",
  "unmovable",
  "attack@unmovable",
]);

const knownBlackboardPrefixes = ["talent@", "recipe.", "sandbox_res_collector."];
const ignoredUnmappedBlackboardKeysBySkillId = {
  skchr_amgoat_2: new Set(["atk_scale_2", "fk", "ct"]),
  skchr_chen2_3: new Set(["attack@projectile_life_time"]),
  skchr_mlynar_3: new Set(["trait_up", "per_kill_reduce"]),
  skchr_mizuki_2: new Set(["attack@unmovable"]),
  skchr_surtr_3: new Set(["ability_range_forward_extend", "max_hp", "hp_ratio"]),
  skchr_ifrit_2: new Set(["burn.atk_scale", "ct"]),
  skchr_ghost2_3: new Set(["max_hp", "attack@atk_scale_ex", "attack@hp_ratio"]),
  skchr_ironmn_2: new Set(["fake_interval"]),
  skchr_qiubai_3: new Set(["max_stack_cnt", "talent_scale"]),
  skchr_logos_3: new Set(["projectile_move_scale"]),
  skchr_reed2_3: new Set(["reed2_skil_3[switch_mode].atk"]),
  skchr_amiya_3: new Set(["max_hp"]),
};

function isKnownBlackboardKey(key) {
  if (knownBlackboardKeys.has(key)) return true;
  return knownBlackboardPrefixes.some((prefix) => key.startsWith(prefix));
}

function isIgnoredUnmappedBlackboardKey(skillId, key) {
  return ignoredUnmappedBlackboardKeysBySkillId[skillId]?.has(key) ?? false;
}

function collectOperatorSkillIds(characters) {
  const skillIds = new Set();
  for (const [charId, character] of Object.entries(characters)) {
    if (!charId.startsWith("char_")) continue;
    if (character?.profession === "TOKEN" || character?.profession === "TRAP") continue;
    for (const entry of character?.skills ?? []) {
      if (typeof entry?.skillId === "string" && entry.skillId) {
        skillIds.add(entry.skillId);
      }
    }
  }
  return skillIds;
}

const operatorSkillIds = collectOperatorSkillIds(characterTable);

let total = 0;
let withBlackboard = 0;
let withLikelyCustom = 0;
let keyOccurrences = 0;
let knownKeyOccurrences = 0;
let allSkillsWithLevels = 0;
let allSkillsWithBlackboard = 0;

for (const skill of Object.values(skillTable)) {
  const levels = skill?.levels;
  if (!Array.isArray(levels) || levels.length === 0) continue;
  allSkillsWithLevels += 1;
  const bb = levels[levels.length - 1]?.blackboard ?? [];
  if (bb.length > 0) allSkillsWithBlackboard += 1;
}

for (const skillId of operatorSkillIds) {
  const skill = skillTable[skillId];
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
  for (const entry of bb) {
    const key = String(entry?.key ?? "");
    if (!key) continue;
    keyOccurrences += 1;
    if (isKnownBlackboardKey(key) || isIgnoredUnmappedBlackboardKey(skillId, key)) {
      knownKeyOccurrences += 1;
    }
  }
}

const blackboardCoverage = total > 0 ? withBlackboard / total : 0;
const likelyCustomRatio = withBlackboard > 0 ? withLikelyCustom / withBlackboard : 0;
const knownKeyCoverage = keyOccurrences > 0 ? knownKeyOccurrences / keyOccurrences : 0;
const allSkillsBlackboardCoverage =
  allSkillsWithLevels > 0 ? allSkillsWithBlackboard / allSkillsWithLevels : 0;
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
      scope: "playable-operators",
      totalSkills: total,
      skillsWithBlackboard: withBlackboard,
      likelyNeedCustomRules: withLikelyCustom,
      blackboardCoverage,
      likelyCustomRatio,
      knownKeyCoverage,
      allSkillsBlackboardCoverage,
      readyTop20,
      pendingTop20,
      warningCountByCode: warningStats.warningCountByCode,
      migrationTodo: warningStats.migrationTodo,
      warningStatsBySkill: warningStats.warningStatsBySkill,
      thresholds: {
        minBlackboardCoverage: MIN_BLACKBOARD_COVERAGE,
        maxLikelyCustomRatio: MAX_LIKELY_CUSTOM_RATIO,
        minKnownKeyCoverage: MIN_KNOWN_KEY_COVERAGE,
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
if (knownKeyCoverage < MIN_KNOWN_KEY_COVERAGE) {
  violations.push(
    `knownKeyCoverage=${knownKeyCoverage.toFixed(4)} < ${MIN_KNOWN_KEY_COVERAGE.toFixed(2)}`,
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
