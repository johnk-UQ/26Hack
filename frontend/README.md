# Switchpath demo

The deployed site uses the Groq-backed two-turn journey. Copy `.env.example` to `.env` and set `GROQ_API_KEY` to a key with access to the configured model; the key is only read by the local API server.

For the deterministic visual demo, run:

```sh
npm run dev:demo
```

For local real AI (API + Astro), run `npm run dev:ai`. `PUBLIC_JOURNEY_MODE` defaults to `ai`; set it to `demo` only when you explicitly want the scripted flow.

## Vercel

Set the Vercel project Root Directory to `frontend`, keep the Astro framework preset, and add `GROQ_API_KEY` for Preview and Production. The included `vercel.json` builds with `npm run build` and publishes `dist/`; `/api/clarify` and `/api/generate` run server-side, so the key is never sent to the browser. Production defaults to the real AI flow (`PUBLIC_JOURNEY_MODE=ai`); use `npm run dev:demo` for the deterministic scripted visual demo or `npm run dev:ai` for local API + AI. Redeploy after changing the environment variable.
