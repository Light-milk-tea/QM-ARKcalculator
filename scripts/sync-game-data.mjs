import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "../ArknightCalculator/public/json");
const targetDir = resolve(root, "apps/web/public/json");

const requiredFiles = [
  "character_table.json",
  "skill_table.json",
  "uniequip_table.json",
  "battle_equip_table.json",
  "profession.json",
  "subProfessionId.json",
];

await mkdir(targetDir, { recursive: true });

for (const file of requiredFiles) {
  await cp(resolve(sourceDir, file), resolve(targetDir, file));
}

console.log(`Synced ${requiredFiles.length} game-data files to ${targetDir}`);
