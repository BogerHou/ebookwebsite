import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";

// Also works when Codex's bundled Node is invoked by an absolute path.
const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH || ""}`, NEXT_TELEMETRY_DISABLED: "1" },
});
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => { console.error(error.message); process.exit(1); });
child.on("exit", (code) => process.exit(code ?? 1));
