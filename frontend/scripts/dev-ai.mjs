import { readFileSync } from "node:fs"; import { spawn } from "node:child_process"; import { fileURLToPath } from "node:url"; import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try { for (const line of readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); } } catch {}
if (!process.env.GROQ_API_KEY) console.error("GROQ_API_KEY is missing. The static site still works; AI calls will be unavailable.");
const astroBin = path.join(root, "node_modules", "astro", "bin", "astro.mjs"); const api = spawn(process.execPath, [path.join(root, "server/index.mjs")], { cwd: root, env: process.env, stdio: "inherit" }); const web = spawn(process.execPath, [astroBin, "dev"], { cwd: root, env: process.env, stdio: "inherit" });
const stop = () => { api.kill(); web.kill(); }; process.on("SIGINT", stop); process.on("SIGTERM", stop); api.on("exit", (code) => { if (code && !web.killed) web.kill(); });
