import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders, resolveUserId } from "@/lib/bff";

export async function GET(request: NextRequest) {
  const headers = authHeaders(request);
  const userId = await resolveUserId(headers);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const upstreamResponse = await fetch(
    nestUrl(`/receipts?userId=${userId}&limit=50`),
    { headers },
  );
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
