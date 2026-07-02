import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dataVersionPath = resolve(root, "versions/data-version.json");
const ruleVersionPath = resolve(root, "versions/rule-version.json");
const releasesDir = resolve(root, "versions/releases");

const [dataVersionRaw, ruleVersionRaw] = await Promise.all([
  readFile(dataVersionPath, "utf8"),
  readFile(ruleVersionPath, "utf8"),
]);

const dataVersion = JSON.parse(dataVersionRaw);
const ruleVersion = JSON.parse(ruleVersionRaw);

const now = new Date();
const snapshot = {
  releaseId: `release-${now.toISOString()}`,
  createdAt: now.toISOString(),
  dataVersion,
  ruleVersion,
};

await mkdir(releasesDir, { recursive: true });
const fileName = `release-${now.toISOString().replaceAll(":", "-")}.json`;
const outPath = resolve(releasesDir, fileName);

await writeFile(outPath, JSON.stringify(snapshot, null, 2), "utf8");
console.log(`Release snapshot generated: ${outPath}`);
