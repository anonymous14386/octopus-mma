/**
 * build-stamp.mjs — one string identifying the code this container is running.
 *
 * Portainer polls and deploys on its own; nothing reports back. Without a value
 * that moves when the code moves, a deploy that never landed and one that
 * landed without helping look identical from outside — octopus-science lost
 * three rounds of bug reports to exactly that.
 *
 * ── Derived, not a pasted constant ───────────────────────────────────────────
 * A stamp you must remember to bump reports "nothing changed" for a deploy that
 * did, the first time anyone forgets. That is a check failing quietly toward
 * "everything is fine", so this one is computed from the files.
 *
 * ── Why a hash and not Next's own BUILD_ID ───────────────────────────────────
 * Next generates a random BUILD_ID per build. That does move on every deploy,
 * which is most of what is wanted, but it also moves when NOTHING changed —
 * so it cannot answer "is this the same code as the last image", only "is this
 * a different build". Hashing the sources makes an unchanged rebuild produce an
 * unchanged stamp, which is the stronger and more useful property. It is wired
 * in as `generateBuildId`, so Next's build id IS this hash.
 *
 * ── What it covers ───────────────────────────────────────────────────────────
 * app/, components/, lib/, content/, middleware.ts and next.config.mjs — the
 * sources that decide what the site renders, including the markdown, because a
 * corrected technique page is exactly the kind of change you want to confirm
 * landed. Found by WALKING the tree, not from a list: a written list stops
 * covering the file just added, and the failure is silent for the newest code.
 *
 * ── It must never break a build or a boot, or answer plausibly when it cannot
 *    answer ────────────────────────────────────────────────────────────────
 * Every step is guarded and the fallback is 'unknown' — deliberately not
 * hash-shaped, so it cannot be misread as a value. `unknown` is never
 * `current`.
 *
 * That matters more here than elsewhere, and the first version of this file got
 * it wrong. next.config.mjs is evaluated at RUNTIME as well as build time in a
 * standalone build, in an image that has none of the sources. The walk still
 * found ONE file there — this module, sitting next to the config — hashed it,
 * and returned a perfectly hash-shaped 12 characters that described nothing.
 * A wrong answer in the right format is worse than no answer: it is exactly the
 * "check fails toward everything is fine" shape the stamp exists to prevent.
 *
 * So the walk is not trusted on its own. REQUIRED below names the directories
 * that only a real checkout has; if any is missing the answer is 'unknown',
 * whatever else happens to be lying around.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DIRS = ['app', 'components', 'lib', 'content'];

/**
 * Present in a checkout, absent in the standalone runner image. If these are
 * not all there, this is not a source tree and there is no honest stamp to
 * give — see the note above about answering plausibly when you cannot answer.
 */
const REQUIRED = ['app', 'content'];
const FILES = ['middleware.ts', 'next.config.mjs'];
const KEEP = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.md', '.mdx', '.json']);

/** Every covered file, relative to the repo root and sorted. */
export function sourceFiles(root = ROOT) {
  const out = [];

  const walk = (rel) => {
    let entries;
    try { entries = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return; }
    // Sorted explicitly: readdir order is not promised, and a hash depending on
    // it would differ between this laptop and the image.
    for (const e of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const child = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(child);
      else if (KEEP.has(extname(e.name))) out.push(child);
    }
  };

  for (const dir of DIRS) walk(dir);
  for (const f of FILES) {
    try { readFileSync(join(root, f)); out.push(f); } catch { /* not present */ }
  }
  return out.sort();
}

export function buildStamp(root = ROOT) {
  try {
    for (const dir of REQUIRED) {
      try { readdirSync(join(root, dir)); } catch { return 'unknown'; }
    }
    const files = sourceFiles(root);
    if (!files.length) return 'unknown';
    const h = createHash('sha256');
    for (const f of files) {
      let src;
      try { src = readFileSync(join(root, f)); } catch { continue; }
      h.update(f);
      h.update(src);
    }
    return h.digest('hex').slice(0, 12);
  } catch {
    return 'unknown';
  }
}
