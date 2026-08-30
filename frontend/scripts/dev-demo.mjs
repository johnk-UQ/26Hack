import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const astroBin = path.join(root, "node_modules", "astro", "bin", "astro.mjs");
const env = { ...process.env, PUBLIC_JOURNEY_MODE: "demo" };
const web = spawn(process.execPath, [astroBin, "dev"], { cwd: root, env, stdio: "inherit" });
const stop = () => web.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
