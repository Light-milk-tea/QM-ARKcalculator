import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsPath = resolve(root, "apps/web/public/json/skill_table.json");

const raw = await readFile(skillsPath, "utf8");
const skillTable = JSON.parse(raw);

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

console.log(
  JSON.stringify(
    {
      totalSkills: total,
      skillsWithBlackboard: withBlackboard,
      likelyNeedCustomRules: withLikelyCustom,
    },
    null,
    2,
  ),
);
