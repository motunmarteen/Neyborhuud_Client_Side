/**
 * Smoke-check that `curl` works and the API base responds (no auth required for reachability).
 */
import { spawnSync } from "node:child_process";

const devNull = process.platform === "win32" ? "NUL" : "/dev/null";
const url =
  process.env.CHECK_API_URL ||
  "https://neyborhuud-serverside.onrender.com/api/v1/marketplace?page=1&limit=1";

const ver = spawnSync("curl", ["--version"], { encoding: "utf8" });
if (ver.error || ver.status !== 0) {
  console.error("curl is required. Install curl and retry.");
  process.exit(1);
}
console.log(ver.stdout.split("\n")[0].trim());

const res = spawnSync(
  "curl",
  ["-sS", "-m", "30", "-o", devNull, "-w", "%{http_code}", url],
  { encoding: "utf8" },
);

if (res.error) {
  console.error(res.error.message);
  process.exit(1);
}

const code = (res.stdout || "").trim();
console.log(`GET ${url}`);
console.log(`HTTP ${code || "(no response)"}`);

if (!code || res.status !== 0) {
  process.exit(1);
}

const n = Number(code);
if (Number.isNaN(n)) {
  process.exit(1);
}

// Reachable server: not network failure / 5xx
if (n >= 500) {
  process.exit(1);
}

console.log("curl check OK");
process.exit(0);
