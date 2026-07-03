import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const steps = [
  ...(process.env.SKIP_QUALITY_SYNC === "true"
    ? []
    : [{ name: "SyncData", cmd: "npm", args: ["run", "sync:data"] }]),
  { name: "Typecheck", cmd: "npm", args: ["run", "typecheck"] },
  { name: "UnitAndRegression", cmd: "npm", args: ["run", "test"] },
  { name: "Build", cmd: "npm", args: ["run", "build"] },
  { name: "CustomAudit", cmd: "npm", args: ["run", "audit:custom"] },
  { name: "ReplaceGate", cmd: "npm", args: ["run", "replace:gate"] },
  ...(process.env.SKIP_RELEASE_VERIFY === "true"
    ? []
    : [{ name: "ReleaseSnapshotVerify", cmd: "npm", args: ["run", "release:verify"] }]),
];

function runStep(step) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(step.cmd, step.args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${step.name} failed with exit code ${code}`));
    });
  });
}

console.log("== QMcalculator Quality Gate v1 ==");
for (const step of steps) {
  console.log(`\n>> Running ${step.name} ...`);
  await runStep(step);
}
console.log("\nAll quality gates passed.");
