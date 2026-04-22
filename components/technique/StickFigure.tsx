"use client";

import type { JointSet, JointKey } from "@/lib/poses";

interface Props {
  joints:          JointSet;
  nearSide?:       "L" | "R"; // L = near/bright (figure faces right); R = near/bright (figure faces left)
  highlightJoints?: JointKey[];
  className?:      string;
}

// ── Palette ──────────────────────────────────────────────────────────────────
// Near (front) limbs: bright warm white — reads as "in front"
// Far  (back)  limbs: dark cool indigo  — reads as "behind" without disappearing
// Center mass:        neutral mid-gray
// Highlight:          brand red — striking limb / contact point
const C_NEAR  = "#d4cfc8";
const C_FAR   = "#3c3c52";
const C_CTR   = "#888090";
const C_HL    = "#e74c3c";

export default function StickFigure({
  joints: j,
  nearSide = "L",
  highlightJoints = [],
  className,
}: Props) {
  const hl         = new Set<JointKey>(highlightJoints);
  const faceRight  = nearSide === "L"; // convention: L-near → facing right

  function nc(keys: JointKey[]) { return keys.some(k => hl.has(k)) ? C_HL : C_NEAR; }
  function fc(keys: JointKey[]) { return keys.some(k => hl.has(k)) ? C_HL : C_FAR; }

  // Foot tick direction (small horizontal cap showing where foot points)
  const fxL = faceRight ? 4 : -4;
  const fxR = faceRight ? -4 : 4;

  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">

      {/* ── Subtle torso volume (drawn before everything) ── */}
      <polygon
        points={`${j.shoulderL.x},${j.shoulderL.y} ${j.shoulderR.x},${j.shoulderR.y} ${j.hipR.x},${j.hipR.y} ${j.hipL.x},${j.hipL.y}`}
        fill="white" fillOpacity={0.05} stroke="none"
      />

      {/* ── Far-side limbs (behind — drawn first) ── */}
      {/* Upper arm */}
      <line x1={j.shoulderR.x} y1={j.shoulderR.y} x2={j.elbowR.x} y2={j.elbowR.y}
        stroke={fc(["shoulderR","elbowR","handR"])} strokeWidth={3} strokeLinecap="round" />
      {/* Forearm */}
      <line x1={j.elbowR.x} y1={j.elbowR.y} x2={j.handR.x} y2={j.handR.y}
        stroke={fc(["elbowR","handR"])} strokeWidth={2.5} strokeLinecap="round" />
      {/* Thigh */}
      <line x1={j.hipR.x} y1={j.hipR.y} x2={j.kneeR.x} y2={j.kneeR.y}
        stroke={fc(["hipR","kneeR","footR"])} strokeWidth={3.5} strokeLinecap="round" />
      {/* Shin */}
      <line x1={j.kneeR.x} y1={j.kneeR.y} x2={j.footR.x} y2={j.footR.y}
        stroke={fc(["kneeR","footR"])} strokeWidth={3} strokeLinecap="round" />
      {/* Far joint dots */}
      <circle cx={j.elbowR.x} cy={j.elbowR.y} r={2}   fill={fc(["elbowR"])} />
      <circle cx={j.kneeR.x}  cy={j.kneeR.y}  r={2.5} fill={fc(["kneeR"])} />
      {/* Far hand */}
      <circle cx={j.handR.x} cy={j.handR.y} r={2} fill={fc(["handR"])} />
      {/* Far foot tick */}
      <line x1={j.footR.x + fxR} y1={j.footR.y} x2={j.footR.x - fxR / 2} y2={j.footR.y}
        stroke={fc(["footR"])} strokeWidth={2.5} strokeLinecap="round" />

      {/* ── Torso / center mass ── */}
      <line x1={j.shoulderL.x} y1={j.shoulderL.y} x2={j.shoulderR.x} y2={j.shoulderR.y}
        stroke={C_CTR} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      <line x1={j.neck.x} y1={j.neck.y} x2={j.spine.x} y2={j.spine.y}
        stroke={C_CTR} strokeWidth={5} strokeLinecap="round" />
      <line x1={j.hipL.x} y1={j.hipL.y} x2={j.hipR.x} y2={j.hipR.y}
        stroke={C_CTR} strokeWidth={3} strokeLinecap="round" opacity={0.75} />

      {/* ── Near-side limbs (front — drawn on top) ── */}
      {/* Upper arm */}
      <line x1={j.shoulderL.x} y1={j.shoulderL.y} x2={j.elbowL.x} y2={j.elbowL.y}
        stroke={nc(["shoulderL","elbowL","handL"])} strokeWidth={4} strokeLinecap="round" />
      {/* Forearm */}
      <line x1={j.elbowL.x} y1={j.elbowL.y} x2={j.handL.x} y2={j.handL.y}
        stroke={nc(["elbowL","handL"])} strokeWidth={3.5} strokeLinecap="round" />
      {/* Thigh */}
      <line x1={j.hipL.x} y1={j.hipL.y} x2={j.kneeL.x} y2={j.kneeL.y}
        stroke={nc(["hipL","kneeL","footL"])} strokeWidth={4.5} strokeLinecap="round" />
      {/* Shin */}
      <line x1={j.kneeL.x} y1={j.kneeL.y} x2={j.footL.x} y2={j.footL.y}
        stroke={nc(["kneeL","footL"])} strokeWidth={4} strokeLinecap="round" />
      {/* Near joint dots */}
      <circle cx={j.elbowL.x} cy={j.elbowL.y} r={2.5} fill={nc(["elbowL"])} />
      <circle cx={j.kneeL.x}  cy={j.kneeL.y}  r={3}   fill={nc(["kneeL"])} />
      {/* Near hand */}
      <circle cx={j.handL.x} cy={j.handL.y} r={2.5} fill={nc(["handL"])} />
      {/* Near foot tick */}
      <line x1={j.footL.x - fxL / 2} y1={j.footL.y} x2={j.footL.x + fxL} y2={j.footL.y}
        stroke={nc(["footL"])} strokeWidth={3} strokeLinecap="round" />

      {/* ── Head (drawn last) ── */}
      <line x1={j.neck.x} y1={j.neck.y} x2={j.head.x} y2={j.head.y}
        stroke={C_CTR} strokeWidth={3.5} strokeLinecap="round" />
      {/* Head circle */}
      <circle cx={j.head.x} cy={j.head.y} r={7}
        fill={C_CTR} fillOpacity={0.12} stroke={C_CTR} strokeWidth={2.2} />
      {/* Eye — positioned on the near side of the face */}
      <circle
        cx={j.head.x + (faceRight ? 2.8 : -2.8)}
        cy={j.head.y - 1.5}
        r={1.1}
        fill={C_CTR}
      />
      {/* Nose dot — on the near / forward edge of the head */}
      <circle
        cx={j.head.x + (faceRight ? 6.0 : -6.0)}
        cy={j.head.y + 1.5}
        r={1.4}
        fill={C_CTR}
        opacity={0.85}
      />
    </svg>
  );
}
