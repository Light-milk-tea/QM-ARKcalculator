import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const releasesDir = resolve(root, "versions/releases");
const dataVersionPath = resolve(root, "versions/data-version.json");
const ruleVersionPath = resolve(root, "versions/rule-version.json");
const dataJsonDir = resolve(root, "apps/web/public/json");

async function sha256File(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

const releaseFiles = (await readdir(releasesDir))
  .filter((name) => name.startsWith("release-") && name.endsWith(".json"))
  .sort();
if (!releaseFiles.length) {
  throw new Error("No release snapshot found under versions/releases");
}

const latestRelease = releaseFiles[releaseFiles.length - 1];
const latestReleasePath = resolve(releasesDir, latestRelease);
const snapshot = JSON.parse(await readFile(latestReleasePath, "utf8"));
const currentDataVersion = JSON.parse(await readFile(dataVersionPath, "utf8"));
const currentRuleVersion = JSON.parse(await readFile(ruleVersionPath, "utf8"));

if (snapshot.dataVersion?.dataVersionId !== currentDataVersion.dataVersionId) {
  throw new Error(
    `Data version mismatch: snapshot=${snapshot.dataVersion?.dataVersionId} current=${currentDataVersion.dataVersionId}`,
  );
}
if (snapshot.ruleVersion?.ruleVersionId !== currentRuleVersion.ruleVersionId) {
  throw new Error(
    `Rule version mismatch: snapshot=${snapshot.ruleVersion?.ruleVersionId} current=${currentRuleVersion.ruleVersionId}`,
  );
}

for (const entry of snapshot.dataHashes ?? []) {
  const filePath = resolve(dataJsonDir, entry.file);
  const hash = await sha256File(filePath);
  if (hash !== entry.sha256) {
    throw new Error(`Data hash mismatch for ${entry.file}`);
  }
}

console.log(`Release snapshot verified: ${latestReleasePath}`);
