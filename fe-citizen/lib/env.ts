// Base URL of the NestJS backend WITHOUT a trailing `/api`.
// `NEXT_PUBLIC_API_URL` is embedded in the static bundle at build time
// (required for browser calls). `API_URL` is kept as a fallback so existing
// local `.env.local` files keep working.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8000";

// Backwards-compatible alias (server-era name). New code should use API_BASE_URL.
export const API_URL = API_BASE_URL;
