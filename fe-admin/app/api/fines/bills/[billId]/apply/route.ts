import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> },
) {
  const { billId } = await params;
  const headers = authHeaders(request);
  const body = await request.json().catch(() => ({}));
  const upstreamResponse = await fetch(nestUrl(`/fines/bills/${billId}/apply`), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
