import { validateClarifyResult, validateGenerateResult } from "../src/lib/ai-contract.mjs";
import { CLARIFY_SCHEMA, GENERATE_SCHEMA, buildClarifyPrompt, buildGeneratePrompt } from "./prompts.mjs";

export class GroqError extends Error { constructor(code, message, { retryable = false } = {}) { super(message); this.code = code; this.retryable = retryable; } }
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createGroqClient({ apiKey = process.env.GROQ_API_KEY, fetchImpl = fetch, timeoutMs = 12000, sleep = wait } = {}) {
  async function request(prompt, schema, maxTokens, validate) {
    if (!apiKey) throw new GroqError("AI_UNAVAILABLE", "AI service is not configured.");
    let last;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-oss-120b", reasoning_effort: "low", max_tokens: maxTokens, response_format: { type: "json_schema", json_schema: { name: schema === CLARIFY_SCHEMA ? "clarification" : "journey", strict: true, schema } }, messages: [{ role: "system", content: prompt }] }) });
        if (!response.ok) { const transient = response.status === 429 || response.status >= 500; throw new GroqError(transient ? "AI_UNAVAILABLE" : "AI_UNAVAILABLE", "AI request failed.", { retryable: transient }); }
        const payload = await response.json(); const content = payload?.choices?.[0]?.message?.content; const parsed = JSON.parse(content); const checked = validate(parsed);
        if (!checked.ok) throw new GroqError("AI_INVALID_RESPONSE", "AI returned an invalid response.", { retryable: true });
        return checked.value;
      } catch (error) {
        last = error instanceof GroqError ? error : new GroqError(error?.name === "AbortError" ? "AI_TIMEOUT" : "AI_UNAVAILABLE", "AI request failed.", { retryable: true });
        if (attempt === 0 && last.retryable) { await sleep(80); continue; }
        throw last;
      } finally { clearTimeout(timer); }
    }
    throw last;
  }
  return { clarify: (situation) => request(buildClarifyPrompt(situation), CLARIFY_SCHEMA, 200, validateClarifyResult), generate: (input) => request(buildGeneratePrompt(input), GENERATE_SCHEMA, 1500, validateGenerateResult) };
}
