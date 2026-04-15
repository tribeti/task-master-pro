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
      version: process.env.npm_package_version ?? "unknown",
      environment: process.env.NODE_ENV,
    },
    { status: 200 }
  );
}
