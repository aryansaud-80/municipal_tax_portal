import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function POST(request: NextRequest) {
  const headers = authHeaders(request);
  const upstreamResponse = await fetch(nestUrl("/bills/mark-overdue"), {
    method: "POST",
    headers,
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
