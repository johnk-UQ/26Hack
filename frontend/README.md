# Switchpath demo

The laptop demo can use Groq for the generated two-turn journey. Copy `.env.example` to `.env` and set `GROQ_API_KEY` to a key with access to the configured model. Without a key, the prefilled property journey falls back to the curated example.

Run the single-laptop demo from this directory:

```sh
npm run dev:ai
```

When no key is configured, use `npm run dev:web` for the static fallback. The Astro site is static and the API is optional for the fallback journey. This is a pitch demo, not production hosting.

## Vercel

Set the Vercel project Root Directory to `frontend`, keep the Astro framework preset, and add `GROQ_API_KEY` for Preview and Production. The included `vercel.json` builds with `npm run build` and publishes `dist/`; `/api/clarify` and `/api/generate` run server-side, so the key is never sent to the browser. Redeploy after changing the environment variable.
