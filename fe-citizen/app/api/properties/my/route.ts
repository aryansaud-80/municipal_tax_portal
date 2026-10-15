import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function GET(request: NextRequest) {
  const upstreamResponse = await fetch(nestUrl("/properties/my"), {
    headers: authHeaders(request),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const upstreamResponse = await fetch(nestUrl("/properties/my"), {
    method: "POST",
    headers: authHeaders(request),
    body: JSON.stringify(body),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
