import { NextResponse } from "next/server";

/**
 * Liveness. There was no such route, so a monitor pointed at this service had
 * nothing to call and "up" and "misconfigured" looked the same from outside.
 *
 * IT IS /api/health, NOT /health, and that is not a slip. `app/[discipline]`
 * is a dynamic segment that owns every top-level path, so /health resolves to
 * "the discipline named health" and renders Next's 404 — verified against the
 * deployed site. A rewrite could force it, at the cost of making a real
 * discipline called "health" unreachable later. The estate's other services use
 * /health because nothing there competes for it; here the honest address is the
 * one under /api, alongside /api/build.
 *
 * Deliberately outside middleware's matcher, which only guards
 * /tools/pose-editor — stated because the whole point of this route is to
 * answer when authentication is what is broken.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "octopus-mma" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
