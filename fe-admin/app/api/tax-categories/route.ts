import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function GET(request: NextRequest) {
  const upstreamResponse = await fetch(nestUrl("/tax-categories"), {
    method: "GET",
    headers: authHeaders(request),
    cache: "no-store",
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
