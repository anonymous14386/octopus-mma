/**
 * Build-time GIF generator.
 * Walks content/ for .poses.json files, renders each animation to a GIF,
 * and writes them to public/gifs/<discipline>/<belt>/<slug>.gif
 *
 * Uses @resvg/resvg-js (WASM, no native deps) + gifencoder (pure JS).
 * Runs as `node scripts/generate-gifs.mjs` before `next build`.
 */

import fs   from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import GIFEncoder from "gifencoder";

const ROOT        = path.resolve(".");
const CONTENT_DIR = path.join(ROOT, "content");
const OUTPUT_DIR  = path.join(ROOT, "public", "gifs");

const CARD_W = 1080;
const CARD_H = 1350;
const FPS_MS = 60;

// ── Palette ───────────────────────────────────────────────────────────────────
const NEAR = "#d4cfc8";
const FAR  = "#3c3c52";
const CTR  = "#888090";

// ── Animation math ────────────────────────────────────────────────────────────

const LIMB_BONES = [
  ["shoulderL","elbowL"],["elbowL","handL"],
  ["shoulderR","elbowR"],["elbowR","handR"],
  ["hipL","kneeL"],["kneeL","footL"],
  ["hipR","kneeR"],["kneeR","footR"],
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPt(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }
function lerpAngle(a, b, t) {
  let d = b - a;
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
function applyEase(t, fn = "ease-in-out") {
  if (fn === "ease-in")  return t * t;
  if (fn === "ease-out") return 1 - (1 - t) ** 2;
  return t < 0.5 ? 2*t*t : 1 - (-2*t+2)**2/2;
}

function avgBoneLengths(frames) {
  const m = new Map();
  for (const [p, c] of LIMB_BONES) {
    let tot = 0;
    for (const f of frames)
      tot += Math.hypot(f.joints[c].x - f.joints[p].x, f.joints[c].y - f.joints[p].y);
    m.set(`${p}-${c}`, tot / frames.length);
  }
  return m;
}

function computeJoints(a, b, t, bl) {
  const r = {};
  for (const k of Object.keys(a)) r[k] = lerpPt(a[k], b[k], t);
  for (const [p, c] of LIMB_BONES) {
    const aA = Math.atan2(a[c].y - a[p].y, a[c].x - a[p].x);
    const bA = Math.atan2(b[c].y - b[p].y, b[c].x - b[p].x);
    const ang = lerpAngle(aA, bA, t);
    const len = bl.get(`${p}-${c}`) ?? 10;
    r[c] = { x: r[p].x + Math.cos(ang)*len, y: r[p].y + Math.sin(ang)*len };
  }
  return r;
}

function getFrameState(poses, elapsed, bl) {
  const frames = poses.frames;
  let acc = 0;
  const starts = frames.map(f => { const s = acc; acc += f.duration; return s; });
  const total = acc;
  const t = poses.loop ? ((elapsed % total) + total) % total : Math.min(elapsed, total - 1);
  let fi = frames.length - 1;
  for (let i = 0; i < frames.length; i++) {
    if (t < starts[i] + frames[i].duration) { fi = i; break; }
  }
  const raw   = Math.min((t - starts[fi]) / frames[fi].duration, 1);
  const eased = applyEase(raw, frames[fi].ease);
  const next  = (poses.loop && fi === frames.length-1) ? 0 : Math.min(fi+1, frames.length-1);
  return {
    joints: computeJoints(frames[fi].joints, frames[next].joints, eased, bl),
    label:  frames[fi].label ?? `Frame ${fi+1}`,
    total,
  };
}

// ── SVG figure string generator ───────────────────────────────────────────────

function r2(n) { return Math.round(n * 100) / 100; }
function rad2deg(r) { return r * 180 / Math.PI; }

function svgLine(x1, y1, x2, y2, stroke, sw, extra = "") {
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${stroke}" stroke-width="${r2(sw)}" stroke-linecap="round" ${extra}/>`;
}
function svgCircle(cx, cy, r, fill, extra = "") {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" ${extra}/>`;
}
function svgRect(cx, cy, angle, x, y, w, h, rx, fill, extra = "") {
  return `<g transform="translate(${r2(cx)},${r2(cy)}) rotate(${r2(rad2deg(angle))})"><rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rx)}" fill="${fill}" ${extra}/></g>`;
}
function svgOLine(x1, y1, x2, y2, stroke, sw) {
  return svgLine(x1,y1,x2,y2,"rgba(10,10,20,0.72)",sw+1.2) + svgLine(x1,y1,x2,y2,stroke,sw);
}
function svgOCircle(cx, cy, r, fill) {
  return svgCircle(cx,cy,r+0.6,"rgba(10,10,20,0.72)") + svgCircle(cx,cy,r,fill);
}

function figureSVG(joints, nearSide = "L") {
  const faceRight = nearSide === "L";
  const ns = faceRight ? "L" : "R";
  const fs = faceRight ? "R" : "L";
  const J = k => joints[k];

  const nP = {
    shoulder: J(`shoulder${ns}`), elbow: J(`elbow${ns}`), hand: J(`hand${ns}`),
    hip: J(`hip${ns}`),           knee: J(`knee${ns}`),   foot: J(`foot${ns}`),
  };
  const fP = {
    shoulder: J(`shoulder${fs}`), elbow: J(`elbow${fs}`), hand: J(`hand${fs}`),
    hip: J(`hip${fs}`),           knee: J(`knee${fs}`),   foot: J(`foot${fs}`),
  };
  const head = J("head"), neck = J("neck"), spine = J("spine");
  const sL = J("shoulderL"), sR = J("shoulderR"), hL = J("hipL"), hR = J("hipR");

  const nShinR = Math.atan2(nP.foot.y - nP.knee.y, nP.foot.x - nP.knee.x);
  const fShinR = Math.atan2(fP.foot.y - fP.knee.y, fP.foot.x - fP.knee.x);
  const facR   = faceRight ? 0 : Math.PI;
  const nFootA = Math.abs(Math.sin(nShinR)) > 0.6 ? facR : nShinR;
  const fFootA = Math.abs(Math.sin(fShinR)) > 0.6 ? facR : fShinR;
  const nHandA = Math.atan2(nP.hand.y - nP.elbow.y, nP.hand.x - nP.elbow.x);
  const fHandA = Math.atan2(fP.hand.y - fP.elbow.y, fP.hand.x - fP.elbow.x);

  const parts = [];

  // Torso polygon
  parts.push(`<polygon points="${r2(sL.x)},${r2(sL.y)} ${r2(sR.x)},${r2(sR.y)} ${r2(hR.x)},${r2(hR.y)} ${r2(hL.x)},${r2(hL.y)}" fill="${CTR}" fill-opacity="0.22" stroke="none"/>`);

  // Far legs
  parts.push(svgLine(fP.hip.x,fP.hip.y,fP.knee.x,fP.knee.y,FAR,6.5));
  parts.push(svgLine(fP.knee.x,fP.knee.y,fP.foot.x,fP.foot.y,FAR,5.5));
  parts.push(svgCircle(fP.knee.x,fP.knee.y,4,FAR));
  parts.push(svgRect(fP.foot.x,fP.foot.y,fFootA,-3,-2.5,9,5,2,FAR,'opacity="0.85"'));

  // Far arms
  parts.push(svgLine(fP.shoulder.x,fP.shoulder.y,fP.elbow.x,fP.elbow.y,FAR,5));
  parts.push(svgLine(fP.elbow.x,fP.elbow.y,fP.hand.x,fP.hand.y,FAR,4));
  parts.push(svgCircle(fP.elbow.x,fP.elbow.y,3,FAR));
  parts.push(svgRect(fP.hand.x,fP.hand.y,fHandA,1,-2,5,4,1.8,FAR,'opacity="0.85"'));

  // Torso center + neck
  parts.push(svgLine(sL.x,sL.y,sR.x,sR.y,CTR,5,'opacity="0.85"'));
  parts.push(svgLine(neck.x,neck.y,spine.x,spine.y,CTR,9));
  parts.push(svgLine(hL.x,hL.y,hR.x,hR.y,CTR,5,'opacity="0.85"'));
  parts.push(svgLine(neck.x,neck.y,head.x,head.y,CTR,6));

  // Head
  parts.push(`<circle cx="${r2(head.x)}" cy="${r2(head.y)}" r="9" fill="${CTR}" stroke="${CTR}" stroke-width="2.5"/>`);

  // Near legs (outlined)
  parts.push(svgOCircle(nP.hip.x,nP.hip.y,4.5,NEAR));
  parts.push(svgOLine(nP.hip.x,nP.hip.y,nP.knee.x,nP.knee.y,NEAR,8.5));
  parts.push(svgOLine(nP.knee.x,nP.knee.y,nP.foot.x,nP.foot.y,NEAR,7));
  parts.push(svgOCircle(nP.knee.x,nP.knee.y,5,NEAR));
  parts.push(svgRect(nP.foot.x,nP.foot.y,nFootA,-3.6,-3.6,12.2,7.2,2.5,"rgba(10,10,20,0.72)"));
  parts.push(svgRect(nP.foot.x,nP.foot.y,nFootA,-3,-3,11,6,2.5,NEAR));

  // Near arms (outlined)
  parts.push(svgOCircle(nP.shoulder.x,nP.shoulder.y,4.5,NEAR));
  parts.push(svgOLine(nP.shoulder.x,nP.shoulder.y,nP.elbow.x,nP.elbow.y,NEAR,7));
  parts.push(svgOLine(nP.elbow.x,nP.elbow.y,nP.hand.x,nP.hand.y,NEAR,6));
  parts.push(svgOCircle(nP.elbow.x,nP.elbow.y,4,NEAR));
  parts.push(svgRect(nP.hand.x,nP.hand.y,nHandA,0.4,-3.4,7.2,6.7,2.2,"rgba(10,10,20,0.72)"));
  parts.push(svgRect(nP.hand.x,nP.hand.y,nHandA,1,-2.8,6,5.5,2.2,NEAR));

  return parts.join("\n");
}

// ── Card SVG generator ────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function cardSVG(frontmatter, joints, frameLabel) {
  const pad  = 60;
  const disc = frontmatter.discipline.charAt(0).toUpperCase() +
               frontmatter.discipline.slice(1).replace(/-/g," ");
  const belt = (frontmatter.beltLevel ?? "").replace(/-/g," ")
               .replace(/\b\w/g, c => c.toUpperCase());
  const badge = `${disc.toUpperCase()} · ${belt.toUpperCase()}`;

  const native = [frontmatter.nativeScript, frontmatter.nativeName, frontmatter.pronunciation]
    .filter(Boolean).join(" · ");

  // Layout
  let y = pad + 24;
  const badgeY  = y; y += 54;
  const titleY  = y; y += 72;
  const nativeY = native ? y : 0; if (native) y += 46;
  const sepY    = y; y += 30;
  const figTop  = y;
  const figBot  = CARD_H - 140;
  const figAreaH = figBot - figTop;

  // Figure scale (viewBox "0 -10 100 124" = 100×134 units)
  const figScale = Math.min(figAreaH / 134, (CARD_W - pad*2) / 100);
  const figW     = 100 * figScale;
  const figH     = 134 * figScale;
  const tx       = (CARD_W - figW) / 2;
  const ty       = figTop + (figAreaH - figH) / 2 + 10 * figScale;

  const labelY  = figBot + 42;
  const footerY = CARD_H - 22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#0a0e16"/>
    </linearGradient>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${CARD_W}" height="${CARD_H * 0.35}" fill="rgba(30,30,60,0.2)"/>

  <text x="${pad}" y="${badgeY}" font-family="DejaVu Sans,sans-serif" font-size="22" fill="#6b7280" font-weight="600" letter-spacing="1">${esc(badge)}</text>
  <text x="${pad}" y="${titleY}" font-family="DejaVu Sans,sans-serif" font-size="62" fill="#ffffff" font-weight="bold">${esc(frontmatter.title)}</text>
  ${native ? `<text x="${pad}" y="${nativeY}" font-family="DejaVu Sans,sans-serif" font-size="28" fill="#6b7280">${esc(native)}</text>` : ""}

  <line x1="${pad}" y1="${sepY}" x2="${CARD_W - pad}" y2="${sepY}" stroke="#1f2937" stroke-width="1"/>

  <g transform="translate(${r2(tx)},${r2(ty)}) scale(${r2(figScale)})">
    ${figureSVG(joints)}
  </g>

  <text x="${CARD_W/2}" y="${labelY}" font-family="DejaVu Sans,sans-serif" font-size="34" fill="#d1d5db" font-weight="600" text-anchor="middle" letter-spacing="2">${esc(frameLabel.toUpperCase())}</text>

  <text x="${CARD_W/2}" y="${footerY}" font-family="DejaVu Sans,sans-serif" font-size="18" fill="#374151" text-anchor="middle">MMA REFERENCE · mma.octopustechnology.net</text>
</svg>`;
}

// ── GIF generation ────────────────────────────────────────────────────────────

async function generateGif(poses, frontmatter, outputPath) {
  const bl            = avgBoneLengths(poses.frames);
  const totalDuration = poses.frames.reduce((s, f) => s + f.duration, 0);
  const frameCount    = Math.ceil(totalDuration / FPS_MS);

  const encoder = new GIFEncoder(CARD_W, CARD_H);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(FPS_MS);
  encoder.setQuality(10);

  for (let i = 0; i < frameCount; i++) {
    const { joints, label } = getFrameState(poses, i * FPS_MS, bl);
    const svg    = cardSVG(frontmatter, joints, label);
    const resvg  = new Resvg(svg, { fitTo: { mode: "width", value: CARD_W } });
    const { pixels } = resvg.render();
    encoder.addFrame(pixels);
  }

  encoder.finish();

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputPath);
    encoder.createReadStream().pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

// ── Main: walk content/, generate all GIFs ────────────────────────────────────

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("No content/ directory found, skipping GIF generation.");
    return;
  }

  let generated = 0, skipped = 0;

  for (const discipline of fs.readdirSync(CONTENT_DIR)) {
    const discDir = path.join(CONTENT_DIR, discipline);
    if (!fs.statSync(discDir).isDirectory()) continue;

    for (const belt of fs.readdirSync(discDir)) {
      const beltDir = path.join(discDir, belt);
      if (!fs.statSync(beltDir).isDirectory()) continue;

      for (const file of fs.readdirSync(beltDir)) {
        if (!file.endsWith(".poses.json")) continue;

        const slug     = file.replace(".poses.json", "");
        const posesPath = path.join(beltDir, file);
        const mdPath    = path.join(beltDir, `${slug}.md`);
        const outDir    = path.join(OUTPUT_DIR, discipline, belt);
        const outPath   = path.join(outDir, `${slug}.gif`);

        // Read poses
        let poses;
        try { poses = JSON.parse(fs.readFileSync(posesPath, "utf-8")); }
        catch { console.warn(`  ⚠ Bad JSON: ${posesPath}`); continue; }

        // Read frontmatter (minimal gray-matter-like parse)
        let frontmatter = { title: slug, discipline, beltLevel: belt, slug };
        if (fs.existsSync(mdPath)) {
          const raw = fs.readFileSync(mdPath, "utf-8");
          const match = raw.match(/^---\n([\s\S]*?)\n---/);
          if (match) {
            for (const line of match[1].split("\n")) {
              const [k, ...vs] = line.split(":");
              if (k && vs.length) {
                const v = vs.join(":").trim().replace(/^["']|["']$/g, "");
                frontmatter[k.trim()] = v;
              }
            }
          }
          frontmatter.discipline = discipline;
          frontmatter.beltLevel  = belt;
        }

        fs.mkdirSync(outDir, { recursive: true });

        process.stdout.write(`  → ${discipline}/${belt}/${slug}.gif … `);
        try {
          await generateGif(poses, frontmatter, outPath);
          console.log("done");
          generated++;
        } catch (err) {
          console.log(`FAILED: ${err.message}`);
          skipped++;
        }
      }
    }
  }

  console.log(`\nGIF generation complete: ${generated} generated, ${skipped} failed.`);
}

main().catch(err => { console.error(err); process.exit(1); });
