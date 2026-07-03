import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const releasesDir = resolve(root, "versions/releases");
const dataSnapshotsDir = resolve(root, "versions/data-snapshots");
const dataVersionPath = resolve(root, "versions/data-version.json");
const ruleVersionPath = resolve(root, "versions/rule-version.json");
const dataJsonDir = resolve(root, "apps/web/public/json");

const targetReleaseArg = process.argv[2];

async function resolveTargetReleasePath() {
  if (targetReleaseArg) {
    if (targetReleaseArg.endsWith(".json")) {
      return resolve(releasesDir, targetReleaseArg);
    }
    return resolve(releasesDir, `${targetReleaseArg}.json`);
  }
  const releaseFiles = (await readdir(releasesDir))
    .filter((name) => name.startsWith("release-") && name.endsWith(".json"))
    .sort();
  if (!releaseFiles.length) {
    throw new Error("No release snapshot found to rollback.");
  }
  return resolve(releasesDir, releaseFiles[releaseFiles.length - 1]);
}

const targetReleasePath = await resolveTargetReleasePath();
const snapshot = JSON.parse(await readFile(targetReleasePath, "utf8"));
const releaseId = snapshot.releaseId;

if (!releaseId) {
  throw new Error(`Invalid release snapshot: ${targetReleasePath}`);
}

await writeFile(dataVersionPath, JSON.stringify(snapshot.dataVersion, null, 2) + "\n", "utf8");
await writeFile(ruleVersionPath, JSON.stringify(snapshot.ruleVersion, null, 2) + "\n", "utf8");

const dataSnapshotPath = resolve(dataSnapshotsDir, releaseId);
if (snapshot.dataSnapshotCaptured) {
  await cp(dataSnapshotPath, dataJsonDir, { recursive: true, force: true });
  console.log(`Data restored from: ${dataSnapshotPath}`);
} else {
  console.log("Data snapshot was not captured in this release; skipped json restore.");
}

console.log(`Rollback complete from snapshot: ${targetReleasePath}`);
