import { NextRequest, NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const baseUrl = host ? `${proto}://${host}` : undefined;

  return NextResponse.json(buildOpenApiSpec(baseUrl));
}

