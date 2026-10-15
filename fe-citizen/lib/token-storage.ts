// Browser token storage for the static-export frontend.
// The previous BFF kept JWTs in httpOnly cookies server-side; a static site
// has no Next.js server, so tokens live in Web Storage and are sent as
// `Authorization: Bearer` headers by the axios interceptor.

const ACCESS_KEY = "mtp.access_token";
const REFRESH_KEY = "mtp.refresh_token";

function storage(persistent: boolean): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return persistent ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

export function setTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  persistent?: boolean;
}): void {
  const store = storage(tokens.persistent ?? true);
  try {
    store?.setItem(ACCESS_KEY, tokens.accessToken);
    store?.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    /* storage unavailable (private mode) — requests will be unauthenticated */
  }
}

export function getAccessToken(): string | null {
  return readKey(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return readKey(REFRESH_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null || getRefreshToken() !== null;
}
