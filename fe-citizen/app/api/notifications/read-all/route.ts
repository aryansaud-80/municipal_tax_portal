import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function PATCH(request: NextRequest) {
  const upstreamResponse = await fetch(nestUrl("/notifications/read-all"), {
    method: "PATCH",
    headers: authHeaders(request),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
