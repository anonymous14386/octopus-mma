import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Deploy verification.
 *
 * Portainer polls and reports back to nobody, so before this a deploy that
 * never landed and one that landed without helping looked identical from
 * outside. The value is a content hash of app/, components/, lib/, content/ and
 * middleware.ts, computed in next.config.mjs at build time — see
 * lib/build-stamp.mjs for why it is a hash rather than Next's random build id.
 *
 * TWO SOURCES, because they fail independently and this endpoint is worthless
 * if it is the thing that is broken:
 *
 *   process.env.MMA_BUILD  inlined into the bundle by the `env` config. No
 *                          filesystem access, so it survives a read-only or
 *                          differently-rooted container.
 *   .next/BUILD_ID         the same value, written by Next because
 *                          generateBuildId returns it. Covers the case where
 *                          the inlining does not happen as expected.
 *
 * The field is `via`, NOT `source`. octopus-science and octopus-ee report a
 * `source` on this same endpoint and it means something entirely different
 * there — a second, server-side content hash. Two unrelated meanings behind one
 * field name on one estate-wide endpoint is how someone later reads `"env"` as a
 * broken hash. `via` says what it is: which of the two paths supplied the value.
 *
 * 'unknown' is the deliberate failure value — not hash-shaped, so it cannot be
 * misread as one. `unknown` is never `current`.
 *
 * Never cached: a cached deploy-check answers for the deploy before the one you
 * are asking about, which is worse than no check at all.
 */
export const dynamic = "force-dynamic";

function build(): { build: string; via: string } {
  // "unknown" is truthy, and it is exactly what the config yields when it is
  // re-evaluated at runtime in an image with no sources. Accepting it here
  // would report a failure value as an answer and never try the fallback that
  // does have the real one.
  const inlined = process.env.MMA_BUILD;
  if (inlined && inlined !== "unknown") return { build: inlined, via: "env" };

  try {
    const id = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
    if (id) return { build: id, via: "build-id" };
  } catch {
    /* not readable — fall through to unknown rather than throwing */
  }
  return { build: "unknown", via: "none" };
}

export async function GET() {
  const { build: value, via } = build();
  return NextResponse.json(
    { ok: true, service: "octopus-mma", build: value, via },
    { headers: { "Cache-Control": "no-store" } },
  );
}
