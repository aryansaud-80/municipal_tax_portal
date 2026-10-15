import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const headers = authHeaders(request);
  const body = await request.json();
  const upstreamResponse = await fetch(nestUrl(`/fines/${id}/waive`), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
