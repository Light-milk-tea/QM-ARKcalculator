import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsPath = resolve(root, "apps/web/public/json/skill_table.json");
const top20CasesPath = resolve(root, "packages/calc-core/__tests__/fixtures/top20-priority-cases.json");

const MIN_BLACKBOARD_COVERAGE = 0.75;
const MAX_LIKELY_CUSTOM_RATIO = 0.25;
const MIN_READY_TOP20 = 3;

const raw = await readFile(skillsPath, "utf8");
const skillTable = JSON.parse(raw);
const top20CasesRaw = await readFile(top20CasesPath, "utf8");
const top20Cases = JSON.parse(top20CasesRaw);

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
