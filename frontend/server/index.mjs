import http from "node:http";
import { validateClarifyRequest, validateGenerateRequest, normalizeGeneratedJourney } from "../src/lib/ai-contract.mjs";
import { createGroqClient, GroqError } from "./groq-client.mjs";

const LIMIT = 32 * 1024;
const allowedOrigins = new Set(["http://localhost:4321", "http://127.0.0.1:4321", "http://localhost:4322", "http://127.0.0.1:4322"]);
const send = (res, status, body, origin) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...(origin ? { "Access-Control-Allow-Origin": origin } : {}) }); res.end(JSON.stringify(body)); };
const publicError = (error) => { const allowed = new Set(["INVALID_REQUEST", "AI_UNAVAILABLE", "AI_TIMEOUT", "AI_INVALID_RESPONSE"]); const code = allowed.has(error?.code) ? error.code : "AI_UNAVAILABLE"; return { code, message: code === "INVALID_REQUEST" ? "Please check your details and try again." : code === "AI_TIMEOUT" ? "The AI service took too long. Please try again." : "The AI service is temporarily unavailable. Please try again." }; };
async function readBody(req) { let size = 0; const chunks = []; for await (const chunk of req) { size += chunk.length; if (size > LIMIT) throw new GroqError("INVALID_REQUEST", "Request too large."); chunks.push(chunk); } try { return JSON.parse(Buffer.concat(chunks)); } catch { throw new GroqError("INVALID_REQUEST", "Invalid JSON."); } }

export function createApiHandler({ client = createGroqClient() } = {}) { return async (req, res) => {
  const origin = req.headers.origin; if (origin && !allowedOrigins.has(origin)) return send(res, 403, { code: "INVALID_REQUEST", message: "This local origin is not allowed." });
  if (req.method !== "POST") return send(res, 405, { code: "INVALID_REQUEST", message: "POST is required." }, origin);
  if (!req.headers["content-type"]?.toLowerCase().startsWith("application/json")) return send(res, 415, { code: "INVALID_REQUEST", message: "JSON is required." }, origin);
  const route = new URL(req.url, "http://127.0.0.1").pathname; if (route !== "/api/clarify" && route !== "/api/generate") return send(res, 404, { code: "INVALID_REQUEST", message: "Not found." }, origin);
  try { const body = await readBody(req); const checked = route.endsWith("clarify") ? validateClarifyRequest(body) : validateGenerateRequest(body); if (!checked.ok) throw new GroqError("INVALID_REQUEST", checked.error); const value = route.endsWith("clarify") ? await client.clarify(body.situation) : normalizeGeneratedJourney(await client.generate(body)); return send(res, 200, value, origin); } catch (error) { return send(res, error?.code === "INVALID_REQUEST" ? 400 : 502, publicError(error), origin); }
}; }
export function startServer({ port = 8787, host = "127.0.0.1", client } = {}) { const server = http.createServer(createApiHandler({ client })); return new Promise((resolve) => server.listen(port, host, () => resolve(server))); }
if (process.argv[1] && process.argv[1].endsWith("server/index.mjs")) startServer().then(() => console.log("Switchpath AI API listening on http://127.0.0.1:8787"));
