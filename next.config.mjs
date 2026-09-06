import { buildStamp } from "./lib/build-stamp.mjs";

/**
 * The stamp is computed once, here, at build time — where the sources exist.
 *
 * It is threaded through in two ways on purpose, because they fail
 * independently:
 *
 *   generateBuildId  makes Next's own build id BE the content hash, so
 *                    .next/BUILD_ID carries it into the standalone image.
 *   env.MMA_BUILD    inlines the same value into the server bundle, so the
 *                    route can answer without touching the filesystem.
 *
 * This file is ALSO evaluated at runtime by the standalone server, where app/
 * and content/ are not in the image. buildStamp() returns 'unknown' there
 * rather than throwing — see lib/build-stamp.mjs. That is why the route prefers
 * the inlined value and falls back to reading BUILD_ID, rather than calling
 * buildStamp() itself.
 */
const BUILD = buildStamp();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  generateBuildId: () => BUILD,
  env: { MMA_BUILD: BUILD },
};

export default nextConfig;
