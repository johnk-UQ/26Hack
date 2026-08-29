const LOCAL_ORIGINS = new Set(["http://localhost:4321", "http://127.0.0.1:4321", "http://localhost:4322", "http://127.0.0.1:4322"]);
const envOrigin = (value) => value ? (value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`) : null;
export function isAllowedOrigin(origin, requestUrl) {
  if (!origin || LOCAL_ORIGINS.has(origin)) return true;
  try {
    if (origin === new URL(requestUrl).origin) return true;
    return [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].map(envOrigin).filter(Boolean).includes(origin);
  } catch { return false; }
}
export function allowedOriginHeader(origin, requestUrl) { return origin && isAllowedOrigin(origin, requestUrl) ? origin : undefined; }
