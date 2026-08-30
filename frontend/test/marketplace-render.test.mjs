import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("the marketplace route renders the imported professional directory in the Switchpath matches stage", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const astro = resolve(root, "node_modules/astro/bin/astro.mjs");
  execFileSync(process.execPath, [astro, "build"], { cwd: root, stdio: "pipe" });

  const html = readFileSync(resolve(root, "dist/marketplace/index.html"), "utf8");
  assert.match(html, /aria-label="Your Switchpath journey"/);
  assert.match(html, /data-state="active" aria-current="step">\s*Your matches/);
  assert.match(html, /Olivia Bennett/);
  assert.match(html, /id="professional-results"/);
  assert.match(html, /id="profile-dialog"[^>]*aria-labelledby="dialog-title"/);
  assert.match(html, /aria-label="Close profile"/);
  assert.match(html, /id="matches-panel"/);
  assert.match(html, /id="match-results"/);
  assert.match(html, /id="matches-tab"[^>]*aria-pressed="true"/);
  assert.match(html, /Browse all professionals/);
  assert.match(html, /switchpath-lockup\.png/);
  assert.doesNotMatch(html, /Professional marketplace<\/p><p class="mt-1 text-xs text-white\/45">/);
  assert.doesNotMatch(html, /Equilisr/);
});
