import { NextResponse } from "next/server";

/**
 * Liveness. There was no such route, so a monitor pointed at this service had
 * nothing to call and "up" and "misconfigured" looked the same from outside.
 *
 * Deliberately outside middleware's matcher, which only guards
 * /tools/pose-editor — but stated here because the whole point of this route is
 * to answer when authentication is what is broken.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "octopus-mma" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
