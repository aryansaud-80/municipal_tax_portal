import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function GET(request: NextRequest) {
  const upstreamResponse = await fetch(nestUrl("/auth/profile"), {
    method: "POST",
    headers: authHeaders(request),
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
