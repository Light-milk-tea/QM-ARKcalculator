import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dataVersionPath = resolve(root, "versions/data-version.json");
const ruleVersionPath = resolve(root, "versions/rule-version.json");
const releasesDir = resolve(root, "versions/releases");
const dataJsonDir = resolve(root, "apps/web/public/json");
const dataSnapshotsDir = resolve(root, "versions/data-snapshots");

async function sha256File(path) {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

async function collectDataHashes() {
  const files = (await readdir(dataJsonDir))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const entries = await Promise.all(
    files.map(async (file) => ({
      file,
      sha256: await sha256File(resolve(dataJsonDir, file)),
    })),
  );
  return entries;
}

const [dataVersionRaw, ruleVersionRaw] = await Promise.all([
  readFile(dataVersionPath, "utf8"),
  readFile(ruleVersionPath, "utf8"),
]);

const dataVersion = JSON.parse(dataVersionRaw);
const ruleVersion = JSON.parse(ruleVersionRaw);
const dataHashes = await collectDataHashes();

const now = new Date();
const releaseId = `release-${now.toISOString()}`;
const captureDataSnapshot = process.env.CAPTURE_DATA_SNAPSHOT === "true";
const snapshot = {
  releaseId,
  createdAt: now.toISOString(),
  dataVersion,
  ruleVersion,
  dataHashes,
  dataSnapshotCaptured: captureDataSnapshot,
};

await mkdir(releasesDir, { recursive: true });
await mkdir(dataSnapshotsDir, { recursive: true });
const fileName = `release-${now.toISOString().replaceAll(":", "-")}.json`;
const outPath = resolve(releasesDir, fileName);
const dataOutDir = resolve(dataSnapshotsDir, releaseId);

await writeFile(outPath, JSON.stringify(snapshot, null, 2), "utf8");
console.log(`Release snapshot generated: ${outPath}`);
if (captureDataSnapshot) {
  await cp(dataJsonDir, dataOutDir, { recursive: true });
  console.log(`Data snapshot copied: ${dataOutDir}`);
} else {
  console.log("Data snapshot copy skipped (set CAPTURE_DATA_SNAPSHOT=true to enable).");
}
