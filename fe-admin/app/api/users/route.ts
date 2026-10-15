import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

function toQueryString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const upstreamResponse = await fetch(
    nestUrl(`/users${toQueryString(search)}`),
    { method: "GET", headers: authHeaders(request), cache: "no-store" },
  );

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const upstreamResponse = await fetch(nestUrl("/users"), {
    method: "POST",
    headers: authHeaders(request),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
