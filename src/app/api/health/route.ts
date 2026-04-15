import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health-check endpoint dùng cho Docker healthcheck & monitoring
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
      environment: process.env.NODE_ENV,
    },
    { status: 200 }
  );
}
