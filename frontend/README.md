# Switchpath demo

The laptop demo can use Groq for the generated two-turn journey. Copy `.env.example` to `.env` and set `GROQ_API_KEY` to a key with access to the configured model. Without a key, the prefilled property journey falls back to the curated example.

Run the single-laptop demo from this directory:

```sh
npm run dev
```

The Astro site is static and the API is optional for the fallback journey. This is a pitch demo, not production hosting.
