import { NextRequest } from "next/server";

const NESTJS_API_URL = process.env.NESTJS_API_URL ?? "http://localhost:8000";
const ACCESS_COOKIE = "access_token";

export function nestUrl(path: string): string {
  return `${NESTJS_API_URL}/api${path}`;
}

export function authHeaders(request: NextRequest): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
