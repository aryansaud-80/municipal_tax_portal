import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/env";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function clearCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  // Revoke the server-side refresh token first so a stolen copy cannot be
  // reused after logout. Cookies are cleared regardless of the outcome.
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* still log out locally even if the backend is unreachable */
    }
  }

  const response = NextResponse.json({ success: true });
  clearCookies(response);
  return response;
}
