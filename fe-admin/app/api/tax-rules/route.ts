import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function GET(request: NextRequest) {
  const headers = authHeaders(request);
  const search = request.nextUrl.searchParams.toString();
  const upstreamResponse = await fetch(
    nestUrl(`/tax-rules${search ? `?${search}` : ""}`),
    { headers },
  );
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}

export async function POST(request: NextRequest) {
  const headers = authHeaders(request);
  const body = await request.json();
  const upstreamResponse = await fetch(nestUrl("/tax-rules"), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
