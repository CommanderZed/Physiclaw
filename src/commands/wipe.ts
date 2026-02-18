/**
 * Red Alert: physiclaw wipe --all
 * Securely deletes L2 SQLite, L3 LanceDB, and agent memory directory.
 * Invokes the Python wipe module when available.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { theme } from "../terminal/theme.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolvePythonDir(): string | null {
  const envDir = process.env.PHYSICLAW_PYTHON_DIR?.trim();
  if (envDir) {
    return path.resolve(envDir);
  }
  // From dist/commands/wipe.js, repo root is ../../..; python is ../../../python
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const pythonDir = path.join(repoRoot, "python");
  return pythonDir;
}

export async function wipeCommand(opts: { all: boolean; yes?: boolean }): Promise<void> {
  if (!opts.all) {
    console.error(theme.error("physiclaw wipe requires --all. Usage: physiclaw wipe --all"));
    process.exitCode = 2;
    return;
  }

  const pythonDir = resolvePythonDir();
  if (!pythonDir) {
    console.error(theme.error("Could not resolve Python directory. Set PHYSICLAW_PYTHON_DIR."));
    process.exitCode = 1;
    return;
  }

  const result = spawnSync("python3", ["-m", "wipe", "--all"], {
    cwd: pythonDir,
    stdio: "inherit",
    shell: false,
  });

  if (result.signal) {
    console.error(theme.error(`wipe killed by signal: ${result.signal}`));
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0) {
    // Try "python" if python3 not found
    if (result.status === 127 || result.error?.message?.includes("ENOENT")) {
      const fallback = spawnSync("python", ["-m", "wipe", "--all"], {
        cwd: pythonDir,
        stdio: "inherit",
        shell: false,
      });
      if (fallback.status === 0) {
        return;
      }
    }
    process.exitCode = result.status ?? 1;
    return;
  }

  console.log(theme.event("Wipe complete. Agent memory (L2 SQLite, L3 LanceDB) has been removed."));
}
