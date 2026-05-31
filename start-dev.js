#!/usr/bin/env node
/**
 * Start Next.js dev server on an available port with an isolated build directory.
 *
 * Why: On Windows it's easy to end up with multiple `next dev` processes fighting
 * over `.next/dev/lock` and causing port 3000/3001 confusion. Using a per-port
 * `NEXT_DIST_DIR` avoids shared locks entirely.
 *
 * Usage:
 *   node start-dev.js           (auto-picks a free port starting at 3000)
 *   node start-dev.js 3002      (requests a specific port)
 */

const net = require("node:net");
const { spawn } = require("node:child_process");

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        server.close(() => resolve(true));
      })
      .listen(port, "127.0.0.1");
  });
}

async function pickPort({ requestedPort, startPort = 3000, maxPort = 3010 }) {
  if (requestedPort != null) return requestedPort;

  for (let port = startPort; port <= maxPort; port++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) return port;
  }

  return startPort;
}

(async () => {
  const rawArg = process.argv[2];
  const requestedPort = rawArg ? Number(rawArg) : null;
  if (rawArg && (!Number.isFinite(requestedPort) || requestedPort <= 0)) {
    console.error(`❌ Invalid port: ${rawArg}`);
    process.exit(1);
  }

  const port = await pickPort({ requestedPort });
  const distDir = `.next-${port}`;

  console.log(`🚀 Starting Next.js dev server on port ${port}`);
  console.log(`📁 Using build directory: ${distDir}`);

  const env = {
    ...process.env,
    NEXT_DIST_DIR: distDir,
    PORT: String(port),
  };

  const child = spawn(
    "pnpm",
    ["exec", "next", "dev", "--turbopack", "--port", String(port)],
    {
      env,
      stdio: "inherit",
      shell: true,
    },
  );

  child.on("error", (error) => {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
})();
