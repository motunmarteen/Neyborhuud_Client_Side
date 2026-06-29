/**
 * Cross-platform dev cleanup: free the NeyborHuud dev ports by killing whatever
 * is listening on them. Targets ports by PID (not "all node processes") so it
 * won't touch VS Code, Claude, or other unrelated Node tools.
 *
 * Ports cleaned:
 *   3000-3003  Next.js frontend (per-port dist dirs from start-dev.js)
 *   5000       Express backend
 *
 * Usage:
 *   npm run kill:all            (clean the default ports above)
 *   node scripts/kill-dev.cjs 3000 5000   (clean specific ports)
 */
const { execSync } = require("child_process");

const DEFAULT_PORTS = [3000, 3001, 3002, 3003, 5000];

function pidsOnPort(port) {
  try {
    if (process.platform === "win32") {
      const raw = execSync(
        `powershell -NoProfile -Command "netstat -ano | Where-Object { $_ -match ':${port}\\s' -and $_ -match 'LISTENING' } | ForEach-Object { ($_.Trim() -split '\\s+')[-1] } | Sort-Object -Unique"`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
      ).trim();
      return raw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s) && s !== "0");
    }
    // Linux / macOS
    const raw = execSync(`lsof -ti tcp:${port} -s tcp:LISTEN`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    return []; // nothing on the port
  }
}

function killPid(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false; // already exited
  }
}

const ports = process.argv.slice(2).length
  ? process.argv.slice(2).map(Number).filter(Number.isFinite)
  : DEFAULT_PORTS;

let killed = 0;
for (const port of ports) {
  for (const pid of pidsOnPort(port)) {
    if (killPid(pid)) {
      killed += 1;
      console.log(`[kill-dev] Killed PID ${pid} (was on port ${port})`);
    }
  }
}

console.log(
  killed === 0
    ? "[kill-dev] No dev servers were running — ports already free."
    : `[kill-dev] Done. Freed ${killed} process(es).`,
);
