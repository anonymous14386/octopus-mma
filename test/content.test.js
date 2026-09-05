'use strict';

/**
 * Every content file matches the frontmatter contract the code claims it does.
 *
 * lib/content.ts parses each technique with gray-matter and then does:
 *
 *     function parseFrontmatter(raw) { return raw as unknown as TechniqueFrontmatter; }
 *
 * That is a type ASSERTION, not a check. TypeScript is told the fields exist and
 * nothing verifies it at runtime, so a file missing `title`, or with a
 * `difficulty` outside the union, compiles cleanly, builds cleanly, and renders
 * a page with `undefined` in it. There is no other point where that is caught.
 *
 * So the contract is enforced here instead, against the real files.
 *
 * Run: node --test test/content.test.js
 */

const { test } = require('node:test');
const assert   = require('node:assert');
const fs       = require('node:fs');
const path     = require('node:path');
const matter   = require('gray-matter');

const root       = path.join(__dirname, '..');
const contentDir = path.join(root, 'content');
const typesSrc   = fs.readFileSync(path.join(root, 'lib', 'types.ts'), 'utf8');

/**
 * The allowed values are READ FROM lib/types.ts rather than copied here. A
 * duplicated list is wrong the first time somebody adds a discipline, and then
 * this test rejects perfectly good content.
 */
function union(name) {
  const m = typesSrc.match(new RegExp(`export type ${name} =([\\s\\S]*?);`));
  assert.ok(m, `could not find "export type ${name}" in lib/types.ts`);
  const values = [...m[1].matchAll(/"([^"]+)"/g)].map(v => v[1]);
  assert.ok(values.length, `no values parsed for ${name}`);
  return values;
}

const DISCIPLINES = union('Discipline');
const TECHNIQUE_TYPES = union('TechniqueType');
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

/** Every technique markdown file, with the directory it came from. */
function techniques() {
  const out = [];
  for (const discipline of fs.readdirSync(contentDir)) {
    const dPath = path.join(contentDir, discipline);
    if (!fs.statSync(dPath).isDirectory()) continue;
    for (const belt of fs.readdirSync(dPath)) {
      const bPath = path.join(dPath, belt);
      if (!fs.statSync(bPath).isDirectory()) continue;
      for (const file of fs.readdirSync(bPath)) {
        if (!/\.mdx?$/.test(file)) continue;
        out.push({
          discipline, belt, file,
          rel: path.join('content', discipline, belt, file),
          slug: file.replace(/\.mdx?$/, ''),
          raw: fs.readFileSync(path.join(bPath, file), 'utf8'),
        });
      }
    }
  }
  return out;
}

test('there is content to check, and the walk still finds it', () => {
  assert.ok(techniques().length >= 10, 'found almost no technique files — the walk has probably broken');
});

test('every file parses, and has a non-empty body', () => {
  for (const t of techniques()) {
    let parsed;
    assert.doesNotThrow(() => { parsed = matter(t.raw); }, `${t.rel}: frontmatter does not parse`);
    assert.ok(parsed.content.trim().length > 0, `${t.rel}: no body text`);
  }
});

test('every required field is present and non-empty', () => {
  const required = ['title', 'slug', 'discipline', 'beltLevel', 'techniqueType', 'difficulty'];
  const problems = [];
  for (const t of techniques()) {
    const { data } = matter(t.raw);
    for (const key of required) {
      if (typeof data[key] !== 'string' || !data[key].trim()) {
        problems.push(`${t.rel}: ${key} is ${JSON.stringify(data[key])}`);
      }
    }
  }
  assert.deepStrictEqual(problems, [], `these would render as undefined:\n  ${problems.join('\n  ')}`);
});

test('enumerated fields stay inside the unions declared in lib/types.ts', () => {
  const problems = [];
  for (const t of techniques()) {
    const { data } = matter(t.raw);
    if (!DISCIPLINES.includes(data.discipline)) problems.push(`${t.rel}: discipline ${JSON.stringify(data.discipline)}`);
    if (!TECHNIQUE_TYPES.includes(data.techniqueType)) problems.push(`${t.rel}: techniqueType ${JSON.stringify(data.techniqueType)}`);
    if (!DIFFICULTIES.includes(data.difficulty)) problems.push(`${t.rel}: difficulty ${JSON.stringify(data.difficulty)}`);
  }
  assert.deepStrictEqual(problems, [], `outside the declared unions:\n  ${problems.join('\n  ')}`);
});

test('frontmatter agrees with where the file actually lives', () => {
  // The router builds URLs from the path, and the page reads its own identity
  // from the frontmatter. When those disagree the link works and the page
  // describes something else, which is worse than a 404.
  const problems = [];
  for (const t of techniques()) {
    const { data } = matter(t.raw);
    if (data.slug !== t.slug) problems.push(`${t.rel}: slug ${JSON.stringify(data.slug)} but filename says ${JSON.stringify(t.slug)}`);
    if (data.discipline !== t.discipline) problems.push(`${t.rel}: discipline ${JSON.stringify(data.discipline)} but sits under ${t.discipline}/`);
    if (data.beltLevel !== t.belt) problems.push(`${t.rel}: beltLevel ${JSON.stringify(data.beltLevel)} but sits under ${t.belt}/`);
  }
  assert.deepStrictEqual(problems, [], `frontmatter disagrees with the path:\n  ${problems.join('\n  ')}`);
});

test('optional list fields are lists when present', () => {
  const lists = ['targetArea', 'prerequisites', 'relatedTechniques'];
  const problems = [];
  for (const t of techniques()) {
    const { data } = matter(t.raw);
    for (const key of lists) {
      if (key in data && !Array.isArray(data[key])) {
        problems.push(`${t.rel}: ${key} is ${typeof data[key]}, not a list`);
      }
    }
  }
  assert.deepStrictEqual(problems, [], problems.join('\n  '));
});

test('prerequisites point at techniques that exist', () => {
  // A dangling prerequisite renders a link to nothing. Cheap to check here,
  // invisible until somebody clicks it.
  const all = new Set(techniques().map(t => t.slug));
  const problems = [];
  for (const t of techniques()) {
    const { data } = matter(t.raw);
    for (const p of (Array.isArray(data.prerequisites) ? data.prerequisites : [])) {
      if (!all.has(p)) problems.push(`${t.rel}: prerequisite "${p}" does not exist`);
    }
  }
  assert.deepStrictEqual(problems, [], `dangling prerequisites:\n  ${problems.join('\n  ')}`);
});
