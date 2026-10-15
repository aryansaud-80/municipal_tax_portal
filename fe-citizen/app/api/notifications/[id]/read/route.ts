import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const upstreamResponse = await fetch(nestUrl(`/notifications/${id}/read`), {
    method: "PATCH",
    headers: authHeaders(request),
  });
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
