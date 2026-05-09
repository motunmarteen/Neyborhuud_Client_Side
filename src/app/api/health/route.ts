/**
 * Frontend health probe for uptime monitors (Render, UptimeRobot, etc.)
 * Returns 200 as long as the Next.js process can respond.
 * Does NOT call the backend — use /api/v1/ready on the backend for that.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // always live, never cached

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}
