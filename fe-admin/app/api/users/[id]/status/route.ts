import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const upstreamResponse = await fetch(nestUrl(`/users/${id}/status`), {
    method: "PATCH",
    headers: authHeaders(request),
    body: JSON.stringify(body),
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
