import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

function toQueryString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const upstreamResponse = await fetch(
    nestUrl(`/properties${toQueryString(search)}`),
    { method: "GET", headers: authHeaders(request), cache: "no-store" },
  );

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
