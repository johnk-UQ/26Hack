import { validateClarifyRequest, validateGenerateRequest, normalizeGeneratedJourney } from "../src/lib/ai-contract.mjs";
import { createGroqClient, GroqError } from "./groq-client.mjs";
import { allowedOriginHeader, isAllowedOrigin } from "./origin.mjs";
const LIMIT = 32 * 1024;
const publicError = (error) => { const code = new Set(["INVALID_REQUEST", "AI_UNAVAILABLE", "AI_TIMEOUT", "AI_INVALID_RESPONSE"]).has(error?.code) ? error.code : "AI_UNAVAILABLE"; return { code, message: code === "INVALID_REQUEST" ? "Please check your details and try again." : code === "AI_TIMEOUT" ? "The AI service took too long. Please try again." : "The AI service is temporarily unavailable. Please try again." }; };
export async function handleVercelRequest(request, route, { client = createGroqClient() } = {}) {
  const origin = request.headers.get("origin"); const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" }); const allowedOrigin = allowedOriginHeader(origin, request.url); if (allowedOrigin) headers.set("Access-Control-Allow-Origin", allowedOrigin);
  const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });
  if (!isAllowedOrigin(origin, request.url)) return respond(403, { code: "INVALID_REQUEST", message: "This origin is not allowed." });
  if (request.method !== "POST") return respond(405, { code: "INVALID_REQUEST", message: "POST is required." });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return respond(415, { code: "INVALID_REQUEST", message: "JSON is required." });
  try {
    const raw = await request.arrayBuffer(); if (raw.byteLength > LIMIT) throw new GroqError("INVALID_REQUEST", "Request too large.");
    let body; try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { throw new GroqError("INVALID_REQUEST", "Invalid JSON."); }
    const checked = route === "clarify" ? validateClarifyRequest(body) : validateGenerateRequest(body); if (!checked.ok) throw new GroqError("INVALID_REQUEST", checked.error);
    const value = route === "clarify" ? await client.clarify(body.situation) : normalizeGeneratedJourney(await client.generate(body)); return respond(200, value);
  } catch (error) { return respond(error?.code === "INVALID_REQUEST" ? 400 : 502, publicError(error)); }
}
