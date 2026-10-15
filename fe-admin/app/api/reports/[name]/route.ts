import { NextRequest, NextResponse } from "next/server";
import { nestUrl, authHeaders } from "@/lib/bff";

const endpoints: Record<string, string> = {
  "revenue-by-category": "/reports/revenue-by-category",
  "revenue-by-period": "/reports/revenue-by-period",
  outstanding: "/reports/outstanding",
  overdue: "/reports/overdue",
  collections: "/reports/collections",
  verification: "/reports/verification",
  "employee-actions": "/reports/employee-actions",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const upstream = endpoints[name];
  if (!upstream) {
    return NextResponse.json({ success: false, message: "Unknown report" }, { status: 404 });
  }
  const headers = authHeaders(request);
  const search = request.nextUrl.searchParams.toString();
  const upstreamResponse = await fetch(
    nestUrl(`${upstream}${search ? `?${search}` : ""}`),
    { headers },
  );
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
