import { NextRequest, NextResponse } from "next/server";
import { nestUrl } from "@/lib/bff";

const ACCESS_COOKIE = "access_token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const form = await request.formData();

  const upstreamResponse = await fetch(
    nestUrl(`/property-applications/${id}/documents`),
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );
  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}
