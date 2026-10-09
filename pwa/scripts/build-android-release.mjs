/**
 * Automated Production Android Release Bundle Generator
 *
 * 1. Runs Next.js static asset export (cap-build.mjs)
 * 2. Syncs web runtime and Capacitor plugins (cap sync android)
 * 3. Compiles and signs production AAB bundle (gradlew bundleRelease)
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");

console.log("\n🚀 [1/3] Exporting web app assets via Next.js...");
execSync("node scripts/cap-build.mjs", { cwd: root, stdio: "inherit" });

console.log("\n📲 [2/3] Syncing Capacitor Android plugins & assets...");
execSync("node ./node_modules/@capacitor/cli/bin/capacitor sync android", { cwd: root, stdio: "inherit" });

console.log("\n📦 [3/3] Building signed Android Release Bundle (.aab)...");
const env = { ...process.env };
if (!env.JAVA_HOME) {
  const defaultJbr = "C:\\Program Files\\Android\\Android Studio\\jbr";
  if (existsSync(defaultJbr)) {
    env.JAVA_HOME = defaultJbr;
  }
}

const gradlewCmd = process.platform === "win32" ? ".\\gradlew.bat bundleRelease" : "./gradlew bundleRelease";
execSync(gradlewCmd, { cwd: androidDir, stdio: "inherit", env });

const aabPath = path.join(androidDir, "app", "build", "outputs", "bundle", "release", "app-release.aab");
if (existsSync(aabPath)) {
  console.log(`\n🎉 SUCCESS: Signed Android App Bundle ready at:\n${aabPath}\n`);
} else {
  console.log(`\n⚠ Build finished. Check output directory in android/app/build/outputs/bundle/release\n`);
}
