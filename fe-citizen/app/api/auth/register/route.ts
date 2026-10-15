import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/env";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const upstreamResponse = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstreamResponse.json();

  if (!upstreamResponse.ok) {
    return NextResponse.json(data, { status: upstreamResponse.status });
  }

  const { accessToken, refreshToken, expiresIn, user, roles, permissions } =
    data.data ?? {};

  const response = NextResponse.json({ user, roles, permissions, expiresIn });

  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
