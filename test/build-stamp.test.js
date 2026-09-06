'use strict';

/**
 * The deploy-verification stamp.
 *
 * Portainer polls and reports back to nobody, so "did my push land" could only
 * be inferred from whether a page looked different — which is exactly the thing
 * a cache can fake.
 *
 * The property worth defending is that the stamp MOVES when the code moves, and
 * — the part Next's own build id does not give you — that it does NOT move when
 * nothing changed. A random id per build answers "is this a different build";
 * a content hash answers "is this different code", which is the question.
 *
 * ── What this test can reach ─────────────────────────────────────────────────
 * next is not installable on this laptop while the @octopus-security packages
 * are private, so the app cannot be built or booted and the routes cannot be
 * called. lib/build-stamp.mjs is pure node and IS exercised for real: hashed,
 * moved, held still, and driven into its failure path. The route and config
 * assertions read the source and say so rather than being dressed up as
 * behaviour.
 *
 * THIS ONE IS NOT VERIFIED END-TO-END. Everything else in this sweep either ran
 * its own suite or, for octopus-tools, was built and curled in a container.
 * Here, `curl https://<mma host>/api/build` after the next deploy is the check
 * that has not happened yet.
 *
 * Run: node --test test/build-stamp.test.js
 */

const { test } = require('node:test');
const assert   = require('node:assert');
const fs       = require('node:fs');
const os       = require('node:os');
const path     = require('node:path');

const root = path.join(__dirname, '..');
const load = () => import('../lib/build-stamp.mjs');

test('the stamp is a real hash, not the failure value', async () => {
  const { buildStamp } = await load();
  assert.match(buildStamp(), /^[0-9a-f]{12}$/);
  assert.notStrictEqual(buildStamp(), 'unknown');
});

test('it is stable — an unchanged tree gives an unchanged stamp', async () => {
  const { buildStamp } = await load();
  assert.strictEqual(buildStamp(), buildStamp(),
    'the stamp is not reproducible, so it cannot answer "is this the same code"');
});

test('editing a component moves the stamp', async () => {
  const { buildStamp } = await load();
  const before = buildStamp();
  const target = path.join(root, 'app', 'layout.tsx');
  const original = fs.readFileSync(target);
  try {
    fs.writeFileSync(target, Buffer.concat([original, Buffer.from('\n// build-stamp probe\n')]));
    assert.notStrictEqual(buildStamp(), before, 'editing app/layout.tsx did not move the stamp');
  } finally {
    fs.writeFileSync(target, original);
  }
  assert.strictEqual(buildStamp(), before, 'the stamp did not come back after the probe was removed');
});

/**
 * The markdown is the product here. A corrected technique page is exactly the
 * change you want to confirm landed, and it would be invisible to a stamp that
 * only covered code.
 */
test('editing a technique page moves the stamp too', async () => {
  const { buildStamp, sourceFiles } = await load();
  const md = sourceFiles().find(f => f.startsWith('content/') && f.endsWith('.md'));
  assert.ok(md, 'no content markdown is covered by the stamp');

  const before = buildStamp();
  const target = path.join(root, md);
  const original = fs.readFileSync(target);
  try {
    fs.writeFileSync(target, Buffer.concat([original, Buffer.from('\n')]));
    assert.notStrictEqual(buildStamp(), before, `editing ${md} did not move the stamp`);
  } finally {
    fs.writeFileSync(target, original);
  }
});

test('the walk finds files by discovery and skips dependencies', async () => {
  const { sourceFiles } = await load();
  const files = sourceFiles();
  assert.ok(files.includes('app/layout.tsx'), 'app/ is not covered');
  assert.ok(files.some(f => f.startsWith('components/')), 'components/ is not covered');
  assert.ok(files.some(f => f.startsWith('content/')), 'content/ is not covered');
  assert.ok(files.includes('middleware.ts'), 'middleware.ts is not covered');
  assert.ok(files.includes('next.config.mjs'), 'the config is not covered — a config change is a deploy');
  assert.ok(!files.some(f => f.includes('node_modules')), 'node_modules must not be hashed');
  assert.ok(files.every((f, i) => i === 0 || files[i - 1] <= f), 'the list is not sorted');
});

/**
 * next.config.mjs is evaluated at RUNTIME as well as build time in a standalone
 * build, and app/ and content/ are not in the runner image. If buildStamp()
 * threw there, it would take the server down on boot — so the empty case has to
 * return the failure value instead.
 */
test('a tree with none of the sources gives unknown rather than throwing', async () => {
  const { buildStamp } = await load();
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'mma-stamp-'));
  try {
    assert.strictEqual(buildStamp(empty), 'unknown');
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
  assert.strictEqual(buildStamp(path.join(root, 'no-such-directory')), 'unknown');
  assert.ok(!/^[0-9a-f]{12}$/.test('unknown'), 'the failure value must not be hash-shaped');
});

/**
 * The failure the first version of this actually had, kept as a test because it
 * is the one worth never repeating.
 *
 * In the standalone runner image, next.config.mjs is re-evaluated with none of
 * the sources present — but lib/build-stamp.mjs is sitting right next to it. The
 * walk found that one file, hashed it, and returned a perfectly hash-shaped
 * twelve characters that described nothing at all. A wrong answer in the right
 * format is worse than no answer: nothing about it looks like a failure, so it
 * would have been believed.
 */
test('the config beside its own module, with no sources, still says unknown', async () => {
  const { buildStamp } = await load();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mma-runtime-'));
  try {
    fs.mkdirSync(path.join(dir, 'lib'));
    fs.copyFileSync(path.join(root, 'next.config.mjs'), path.join(dir, 'next.config.mjs'));
    fs.copyFileSync(path.join(root, 'lib', 'build-stamp.mjs'), path.join(dir, 'lib', 'build-stamp.mjs'));

    const answer = buildStamp(dir);
    assert.strictEqual(answer, 'unknown',
      `a tree with no app/ or content/ produced ${answer} — that is a plausible-looking wrong answer`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * ...and the route must not accept that failure value as an answer. "unknown"
 * is truthy, so the obvious `if (inlined)` would return it and never reach the
 * fallback that does carry the real hash.
 */
test('the route treats an inlined "unknown" as absent, not as an answer', () => {
  const src = fs.readFileSync(path.join(root, 'app', 'api', 'build', 'route.ts'), 'utf8');
  assert.match(src, /inlined !== "unknown"/,
    'the route would report the failure value from env and never try BUILD_ID');
});

// ── Read from the source: next is not installable here ───────────────────────

test('the config threads the stamp through both paths', () => {
  const cfg = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
  assert.match(cfg, /generateBuildId: \(\) => BUILD/,
    "Next's build id is not the content hash, so .next/BUILD_ID cannot be the fallback");
  assert.match(cfg, /env: \{ MMA_BUILD: BUILD \}/,
    'the stamp is not inlined into the bundle, so the route must hit the filesystem');
  assert.match(cfg, /const BUILD = buildStamp\(\);/, 'the stamp is not computed once');
});

test('the route prefers the inlined value and falls back without throwing', () => {
  const src = fs.readFileSync(path.join(root, 'app', 'api', 'build', 'route.ts'), 'utf8');
  const env = src.indexOf('process.env.MMA_BUILD');
  const file = src.indexOf('BUILD_ID');
  assert.ok(env > 0 && file > 0, 'the route does not use both sources');
  assert.ok(env < file, 'the filesystem read comes first — it should be the fallback');
  assert.match(src, /catch \{/, 'the fallback read is not guarded');
  assert.match(src, /"unknown"/, 'there is no failure value');
  assert.match(src, /service: "octopus-mma"/, 'the route does not name this service');
});

/**
 * A cached deploy-check answers for the deploy before the one you are asking
 * about, which is worse than no check at all.
 */
test('neither route may be cached', () => {
  for (const name of ['build', 'health']) {
    const src = fs.readFileSync(path.join(root, 'app', 'api', name, 'route.ts'), 'utf8');
    assert.match(src, /export const dynamic = "force-dynamic";/, `/api/${name} may be statically rendered`);
    assert.match(src, /"Cache-Control": "no-store"/, `/api/${name} does not send no-store`);
  }
});

/**
 * middleware.ts redirects anything its matcher covers to an unlock page. If
 * /api/* were ever added to that matcher, both routes would start answering
 * with a redirect — and they exist precisely to answer when authentication is
 * what is broken.
 */
test('middleware does not gate the two routes', () => {
  const mw = fs.readFileSync(path.join(root, 'middleware.ts'), 'utf8');
  const matcher = mw.slice(mw.indexOf('matcher'), mw.indexOf(']', mw.indexOf('matcher')));
  assert.ok(!/\/api/.test(matcher) && !matcher.includes('"/:path*"'),
    `middleware now matches the API routes: ${matcher}`);
});
