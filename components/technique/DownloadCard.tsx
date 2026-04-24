"use client";

import { useState, useCallback } from "react";
import type { TechniqueFrontmatter } from "@/lib/types";
import type { PoseData, JointSet, JointKey } from "@/lib/poses";

// ── Format definitions ────────────────────────────────────────────────────────

type Format = "portrait" | "story" | "square" | "landscape";
const FORMATS: Record<Format, { w: number; h: number; label: string }> = {
  portrait:  { w: 1080, h: 1350, label: "Portrait 4:5" },
  story:     { w: 1080, h: 1920, label: "Story 9:16" },
  square:    { w: 1080, h: 1080, label: "Square 1:1" },
  landscape: { w: 1350, h: 1080, label: "Landscape" },
};

// ── Animation math (mirrors usePoseAnimation) ────────────────────────────────

const LIMB_BONES: [JointKey, JointKey][] = [
  ["shoulderL", "elbowL"], ["elbowL", "handL"],
  ["shoulderR", "elbowR"], ["elbowR", "handR"],
  ["hipL", "kneeL"],       ["kneeL", "footL"],
  ["hipR", "kneeR"],       ["kneeR", "footR"],
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpPt(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  if (d > Math.PI)  d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
function applyEase(t: number, fn = "ease-in-out") {
  if (fn === "ease-in")  return t * t;
  if (fn === "ease-out") return 1 - (1 - t) ** 2;
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
function computeJoints(a: JointSet, b: JointSet, t: number, bl: Map<string, number>): JointSet {
  const r = Object.fromEntries(
    (Object.keys(a) as JointKey[]).map(k => [k, lerpPt(a[k], b[k], t)])
  ) as unknown as JointSet;
  for (const [p, c] of LIMB_BONES) {
    const aA = Math.atan2(a[c].y - a[p].y, a[c].x - a[p].x);
    const bA = Math.atan2(b[c].y - b[p].y, b[c].x - b[p].x);
    const len = bl.get(`${p}-${c}`) ?? 10;
    const par = r[p];
    r[c] = { x: par.x + Math.cos(lerpAngle(aA, bA, t)) * len, y: par.y + Math.sin(lerpAngle(aA, bA, t)) * len };
  }
  return r;
}
function avgBoneLengths(frames: PoseData["frames"]) {
  const m = new Map<string, number>();
  for (const [p, c] of LIMB_BONES) {
    let tot = 0;
    for (const f of frames) tot += Math.hypot(f.joints[c].x - f.joints[p].x, f.joints[c].y - f.joints[p].y);
    m.set(`${p}-${c}`, tot / frames.length);
  }
  return m;
}
function getFrameState(poses: PoseData, elapsed: number, bl: Map<string, number>) {
  const frames = poses.frames;
  let acc = 0;
  const starts = frames.map(f => { const s = acc; acc += f.duration; return s; });
  const total = acc;
  const t = poses.loop ? ((elapsed % total) + total) % total : Math.min(elapsed, total - 1);
  let fi = frames.length - 1;
  for (let i = 0; i < frames.length; i++) {
    if (t < starts[i] + frames[i].duration) { fi = i; break; }
  }
  const raw = Math.min((t - starts[fi]) / frames[fi].duration, 1);
  const eased = applyEase(raw, frames[fi].ease);
  const next = (poses.loop && fi === frames.length - 1) ? 0 : Math.min(fi + 1, frames.length - 1);
  return {
    joints: computeJoints(frames[fi].joints, frames[next].joints, eased, bl),
    label: frames[fi].label ?? `Frame ${fi + 1}`,
    totalDuration: total,
  };
}

// ── Canvas primitives ─────────────────────────────────────────────────────────

const NEAR_C = "#d4cfc8";
const FAR_C  = "#3c3c52";
const CTR_C  = "#888090";
const OL_C   = "rgba(10,10,20,0.72)";

function cLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, col: string, w: number) {
  ctx.beginPath(); ctx.lineCap = "round"; ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function cDot(ctx: Ctx, x: number, y: number, r: number, col: string) {
  ctx.beginPath(); ctx.fillStyle = col; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function cRect(ctx: Ctx, cx: number, cy: number, ang: number,
               x: number, y: number, w: number, h: number, r: number, col: string, alpha = 1) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.globalAlpha = alpha; ctx.fillStyle = col;
  ctx.beginPath(); (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(x, y, w, h, r);
  ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
}
function oLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, col: string, w: number, ol: number) {
  cLine(ctx, x1, y1, x2, y2, OL_C, w + ol * 2);
  cLine(ctx, x1, y1, x2, y2, col, w);
}
function oDot(ctx: Ctx, x: number, y: number, r: number, col: string, ol: number) {
  cDot(ctx, x, y, r + ol, OL_C); cDot(ctx, x, y, r, col);
}

type Ctx = CanvasRenderingContext2D;

// ── Stick figure canvas renderer ──────────────────────────────────────────────

function drawFigure(ctx: Ctx, joints: JointSet, s: number, ox: number, oy: number, nearSide: "L" | "R" = "L") {
  const fr = nearSide === "L";
  const ns = fr ? "L" : "R", fs = fr ? "R" : "L";
  // viewBox "0 -10 100 124": canvas_y = oy + (svg_y + 10) * s
  const J = (k: string) => { const j = joints[k as JointKey]; return { x: ox + j.x * s, y: oy + (j.y + 10) * s }; };
  const nP = { shoulder: J(`shoulder${ns}`), elbow: J(`elbow${ns}`), hand: J(`hand${ns}`), hip: J(`hip${ns}`), knee: J(`knee${ns}`), foot: J(`foot${ns}`) };
  const fP = { shoulder: J(`shoulder${fs}`), elbow: J(`elbow${fs}`), hand: J(`hand${fs}`), hip: J(`hip${fs}`), knee: J(`knee${fs}`), foot: J(`foot${fs}`) };
  const head = J("head"), neck = J("neck"), spine = J("spine");
  const sL = J("shoulderL"), sR = J("shoulderR"), hL = J("hipL"), hR = J("hipR");
  const ol = 0.6 * s;

  const nShinR = Math.atan2(nP.foot.y - nP.knee.y, nP.foot.x - nP.knee.x);
  const fShinR = Math.atan2(fP.foot.y - fP.knee.y, fP.foot.x - fP.knee.x);
  const facR = fr ? 0 : Math.PI;
  const nFootA = Math.abs(Math.sin(nShinR)) > 0.6 ? facR : nShinR;
  const fFootA = Math.abs(Math.sin(fShinR)) > 0.6 ? facR : fShinR;
  const nHandA = Math.atan2(nP.hand.y - nP.elbow.y, nP.hand.x - nP.elbow.x);
  const fHandA = Math.atan2(fP.hand.y - fP.elbow.y, fP.hand.x - fP.elbow.x);

  // Torso polygon
  ctx.beginPath(); ctx.globalAlpha = 0.22; ctx.fillStyle = CTR_C;
  ctx.moveTo(sL.x, sL.y); ctx.lineTo(sR.x, sR.y); ctx.lineTo(hR.x, hR.y); ctx.lineTo(hL.x, hL.y);
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;

  // Far legs
  cLine(ctx, fP.hip.x, fP.hip.y, fP.knee.x, fP.knee.y, FAR_C, 6.5*s);
  cLine(ctx, fP.knee.x, fP.knee.y, fP.foot.x, fP.foot.y, FAR_C, 5.5*s);
  cDot(ctx, fP.knee.x, fP.knee.y, 4*s, FAR_C);
  cRect(ctx, fP.foot.x, fP.foot.y, fFootA, -3*s, -2.5*s, 9*s, 5*s, 2*s, FAR_C, 0.85);
  // Far arms
  cLine(ctx, fP.shoulder.x, fP.shoulder.y, fP.elbow.x, fP.elbow.y, FAR_C, 5*s);
  cLine(ctx, fP.elbow.x, fP.elbow.y, fP.hand.x, fP.hand.y, FAR_C, 4*s);
  cDot(ctx, fP.elbow.x, fP.elbow.y, 3*s, FAR_C);
  cRect(ctx, fP.hand.x, fP.hand.y, fHandA, 1*s, -2*s, 5*s, 4*s, 1.8*s, FAR_C, 0.85);

  // Torso center + neck
  cLine(ctx, sL.x, sL.y, sR.x, sR.y, CTR_C, 5*s);
  cLine(ctx, neck.x, neck.y, spine.x, spine.y, CTR_C, 9*s);
  cLine(ctx, hL.x, hL.y, hR.x, hR.y, CTR_C, 5*s);
  cLine(ctx, neck.x, neck.y, head.x, head.y, CTR_C, 6*s);
  // Head
  cDot(ctx, head.x, head.y, 9*s, CTR_C);
  ctx.beginPath(); ctx.strokeStyle = CTR_C; ctx.lineWidth = 2.5*s;
  ctx.arc(head.x, head.y, 9*s, 0, Math.PI*2); ctx.stroke();

  // Near legs (outlined group)
  oDot(ctx, nP.hip.x, nP.hip.y, 4.5*s, NEAR_C, ol);
  oLine(ctx, nP.hip.x, nP.hip.y, nP.knee.x, nP.knee.y, NEAR_C, 8.5*s, ol);
  oLine(ctx, nP.knee.x, nP.knee.y, nP.foot.x, nP.foot.y, NEAR_C, 7*s, ol);
  oDot(ctx, nP.knee.x, nP.knee.y, 5*s, NEAR_C, ol);
  cRect(ctx, nP.foot.x, nP.foot.y, nFootA, (-3-0.6)*s, (-3-0.6)*s, (11+1.2)*s, (6+1.2)*s, 2.5*s, OL_C);
  cRect(ctx, nP.foot.x, nP.foot.y, nFootA, -3*s, -3*s, 11*s, 6*s, 2.5*s, NEAR_C);

  // Near arms (outlined group)
  oDot(ctx, nP.shoulder.x, nP.shoulder.y, 4.5*s, NEAR_C, ol);
  oLine(ctx, nP.shoulder.x, nP.shoulder.y, nP.elbow.x, nP.elbow.y, NEAR_C, 7*s, ol);
  oLine(ctx, nP.elbow.x, nP.elbow.y, nP.hand.x, nP.hand.y, NEAR_C, 6*s, ol);
  oDot(ctx, nP.elbow.x, nP.elbow.y, 4*s, NEAR_C, ol);
  cRect(ctx, nP.hand.x, nP.hand.y, nHandA, (1-0.6)*s, (-2.8-0.6)*s, (6+1.2)*s, (5.5+1.2)*s, 2.2*s, OL_C);
  cRect(ctx, nP.hand.x, nP.hand.y, nHandA, 1*s, -2.8*s, 6*s, 5.5*s, 2.2*s, NEAR_C);
}

// ── Text wrapping ─────────────────────────────────────────────────────────────

function wrapText(ctx: Ctx, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 3): number {
  const words = text.split(" ");
  let line = "";
  let drawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + drawn * lh);
      line = word; drawn++;
      if (drawn >= maxLines) break;
    } else { line = test; }
  }
  if (line && drawn < maxLines) { ctx.fillText(line, x, y + drawn * lh); drawn++; }
  return y + drawn * lh;
}

// ── Card drawing ──────────────────────────────────────────────────────────────

function drawCard(
  ctx: Ctx, w: number, h: number, format: Format,
  fm: TechniqueFrontmatter, joints: JointSet, frameLabel: string,
) {
  const isLandscape = format === "landscape";
  const pad = Math.round(w * 0.056);

  // Background
  ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  grad.addColorStop(0, "rgba(30,30,60,0.25)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

  if (isLandscape) {
    // Two-column: text left, figure right
    const colW = Math.round(w * 0.42);
    const figColX = colW + pad;
    const figColW = w - figColX - pad;

    let y = pad * 1.2;
    const disc = fm.discipline.charAt(0).toUpperCase() + fm.discipline.slice(1).replace(/-/g, " ");
    const belt = fm.beltLevel.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    ctx.font = `600 ${Math.round(w * 0.018)}px system-ui,sans-serif`; ctx.fillStyle = "#6b7280"; ctx.textAlign = "left";
    ctx.fillText(`${disc.toUpperCase()} · ${belt.toUpperCase()}`, pad, y); y += Math.round(w * 0.055);

    ctx.font = `bold ${Math.round(w * 0.048)}px system-ui,sans-serif`; ctx.fillStyle = "#ffffff";
    ctx.fillText(fm.title, pad, y); y += Math.round(w * 0.06);

    if (fm.nativeScript || fm.nativeName || fm.pronunciation) {
      const parts = [fm.nativeScript, fm.nativeName, fm.pronunciation].filter(Boolean).join(" · ");
      ctx.font = `${Math.round(w * 0.022)}px system-ui,sans-serif`; ctx.fillStyle = "#6b7280";
      ctx.fillText(parts, pad, y); y += Math.round(w * 0.04);
    }
    y += Math.round(w * 0.02);
    ctx.font = `${Math.round(w * 0.020)}px system-ui,sans-serif`; ctx.fillStyle = "#9ca3af";
    y = wrapText(ctx, fm.summary, pad, y, colW - pad, Math.round(w * 0.028), 5);

    // Figure right column
    const figS = Math.min((h - pad * 2) / 134, figColW / 100);
    const figOX = figColX + (figColW - 100 * figS) / 2;
    const figOY = pad + (h - pad * 2 - 134 * figS) / 2 + 10 * figS;
    drawFigure(ctx, joints, figS, figOX, figOY);

    // Frame label below figure
    ctx.font = `600 ${Math.round(w * 0.022)}px system-ui,sans-serif`; ctx.fillStyle = "#d1d5db"; ctx.textAlign = "center";
    ctx.fillText(frameLabel.toUpperCase(), figColX + figColW / 2, figOY + 124 * figS + Math.round(w * 0.03));
  } else {
    // Single column: header → figure → label → footer
    let y = pad;
    const disc = fm.discipline.charAt(0).toUpperCase() + fm.discipline.slice(1).replace(/-/g, " ");
    const belt = fm.beltLevel.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    ctx.font = `600 ${Math.round(w * 0.020)}px system-ui,sans-serif`; ctx.fillStyle = "#6b7280"; ctx.textAlign = "left";
    ctx.fillText(`${disc.toUpperCase()} · ${belt.toUpperCase()}`, pad, y); y += Math.round(w * 0.048);

    ctx.font = `bold ${Math.round(w * 0.056)}px system-ui,sans-serif`; ctx.fillStyle = "#ffffff";
    ctx.fillText(fm.title, pad, y); y += Math.round(w * 0.07);

    if (fm.nativeScript || fm.nativeName || fm.pronunciation) {
      const parts = [fm.nativeScript, fm.nativeName, fm.pronunciation].filter(Boolean).join(" · ");
      ctx.font = `${Math.round(w * 0.026)}px system-ui,sans-serif`; ctx.fillStyle = "#6b7280";
      ctx.fillText(parts, pad, y); y += Math.round(w * 0.044);
    }

    ctx.font = `${Math.round(w * 0.022)}px system-ui,sans-serif`; ctx.fillStyle = "#9ca3af";
    y = wrapText(ctx, fm.summary, pad, y, w - pad * 2, Math.round(w * 0.031), 3) + Math.round(w * 0.018);

    // Subtle divider
    ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    y += Math.round(w * 0.025);

    // Figure
    const footerH = Math.round(h * 0.10);
    const figAreaH = h - y - footerH;
    const figS = Math.min(figAreaH / 134, (w - pad * 2) / 100);
    const figOX = (w - 100 * figS) / 2;
    const figOY = y + (figAreaH - 134 * figS) / 2 + 10 * figS;
    drawFigure(ctx, joints, figS, figOX, figOY);

    // Frame label
    const labelY = h - footerH + Math.round(h * 0.026);
    ctx.font = `600 ${Math.round(w * 0.030)}px system-ui,sans-serif`; ctx.fillStyle = "#d1d5db"; ctx.textAlign = "center";
    ctx.fillText(frameLabel.toUpperCase(), w / 2, labelY);
  }

  // Footer branding
  ctx.font = `${Math.round(w * 0.016)}px system-ui,sans-serif`; ctx.fillStyle = "#374151"; ctx.textAlign = "center";
  ctx.fillText("MMA REFERENCE · mma.octopustechnology.net", w / 2, h - Math.round(h * 0.022));
  ctx.textAlign = "left";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DownloadCard({
  frontmatter,
  poses,
}: {
  frontmatter: TechniqueFrontmatter;
  poses: PoseData | null;
}) {
  const [format, setFormat] = useState<Format>("portrait");
  const [state, setState] = useState<"idle" | "generating" | "encoding">("idle");
  const [progress, setProgress] = useState(0);

  const handleDownload = useCallback(async () => {
    if (!poses) return;
    setState("generating");
    setProgress(0);

    const GIF = (await import("gif.js")).default;
    const { w, h } = FORMATS[format];
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const bl = avgBoneLengths(poses.frames);
    const totalDuration = poses.frames.reduce((s, f) => s + f.duration, 0);
    const FPS_MS = 60;
    const totalFrames = Math.ceil(totalDuration / FPS_MS);

    const gif = new GIF({
      workers: 2, quality: 8,
      workerScript: "/gif.worker.js",
      width: w, height: h, repeat: 0,
    });

    gif.on("progress", (p: number) => setProgress(p));
    gif.on("finished", (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${frontmatter.slug}-${format}.gif`;
      a.click();
      URL.revokeObjectURL(url);
      setState("idle");
    });

    for (let i = 0; i < totalFrames; i++) {
      const elapsed = i * FPS_MS;
      const { joints, label } = getFrameState(poses, elapsed, bl);
      drawCard(ctx, w, h, format, frontmatter, joints, label);
      gif.addFrame(canvas, { delay: FPS_MS, copy: true });
      setProgress(i / totalFrames * 0.5);
      await new Promise(r => setTimeout(r, 0)); // yield to keep UI responsive
    }

    setState("encoding");
    gif.render();
  }, [format, poses, frontmatter]);

  if (!poses) return null;

  const busy = state !== "idle";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={format}
        onChange={e => setFormat(e.target.value as Format)}
        disabled={busy}
        className="px-3 py-1.5 bg-brand-card border border-brand-border text-brand-muted rounded text-sm"
      >
        {(Object.entries(FORMATS) as [Format, { label: string }][]).map(([key, { label }]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <button
        onClick={handleDownload}
        disabled={busy}
        className="px-4 py-1.5 bg-brand-card border border-brand-border text-brand-muted rounded text-sm hover:text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "generating" && `Rendering ${Math.round(progress * 100)}%…`}
        {state === "encoding"   && `Encoding ${Math.round(progress * 100)}%…`}
        {state === "idle"       && "Download Card"}
      </button>
    </div>
  );
}
