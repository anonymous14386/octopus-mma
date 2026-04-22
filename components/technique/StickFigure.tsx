"use client";

import type { JointSet, JointKey, Point } from "@/lib/poses";

interface Props {
  joints: JointSet;
  // Which side of the body is facing the viewer (near = bright, far = dim)
  nearSide?: "L" | "R";
  highlightJoints?: JointKey[];
  color?: string;
  highlightColor?: string;
  className?: string;
}

const FAR_OPACITY = 0.28;
const HEAD_RADIUS = 6.5;

function seg(
  a: Point, b: Point,
  stroke: string,
  opacity: number,
  key: string
) {
  return (
    <line
      key={key}
      x1={a.x} y1={a.y}
      x2={b.x} y2={b.y}
      stroke={stroke}
      strokeWidth={3}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

export default function StickFigure({
  joints: j,
  nearSide = "L",
  highlightJoints = [],
  color = "#e8e8e8",
  highlightColor = "#e74c3c",
  className,
}: Props) {
  const hl = new Set<JointKey>(highlightJoints);

  // Determine near/far opacities for each side
  const nearOp  = 1;
  const farOp   = FAR_OPACITY;
  const lOp     = nearSide === "L" ? nearOp : farOp;
  const rOp     = nearSide === "R" ? nearOp : farOp;

  function limbColor(joints: JointKey[]): string {
    return joints.some(k => hl.has(k)) ? highlightColor : color;
  }
  function limbOp(joints: JointKey[], side: "L" | "R"): number {
    if (joints.some(k => hl.has(k))) return 1;
    return side === "L" ? lOp : rOp;
  }

  return (
    <svg
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Far-side limbs (drawn first, underneath) ── */}
      {seg(j.shoulderR, j.elbowR, limbColor(["shoulderR","elbowR","handR"]), limbOp(["shoulderR","elbowR"], "R"), "su-er")}
      {seg(j.elbowR,    j.handR,  limbColor(["elbowR","handR"]),             limbOp(["elbowR","handR"],    "R"), "er-hr")}
      {seg(j.hipR,      j.kneeR,  limbColor(["hipR","kneeR","footR"]),       limbOp(["hipR","kneeR"],      "R"), "hr-kr")}
      {seg(j.kneeR,     j.footR,  limbColor(["kneeR","footR"]),              limbOp(["kneeR","footR"],     "R"), "kr-fr")}

      {/* ── Torso ── */}
      {seg(j.shoulderL, j.shoulderR, color, 0.55, "sh-line")}
      {seg(j.hipL,      j.hipR,      color, 0.55, "hip-line")}
      {seg(j.neck,      j.spine,     color, 1,    "spine")}

      {/* ── Near-side limbs (drawn on top) ── */}
      {seg(j.shoulderL, j.elbowL, limbColor(["shoulderL","elbowL","handL"]), limbOp(["shoulderL","elbowL"], "L"), "su-el")}
      {seg(j.elbowL,    j.handL,  limbColor(["elbowL","handL"]),             limbOp(["elbowL","handL"],    "L"), "el-hl")}
      {seg(j.hipL,      j.kneeL,  limbColor(["hipL","kneeL","footL"]),       limbOp(["hipL","kneeL"],      "L"), "hl-kl")}
      {seg(j.kneeL,     j.footL,  limbColor(["kneeL","footL"]),              limbOp(["kneeL","footL"],     "L"), "kl-fl")}

      {/* ── Head (drawn last, on top of neck line) ── */}
      {seg(j.neck, j.head, color, 1, "neck")}
      <circle
        cx={j.head.x}
        cy={j.head.y}
        r={HEAD_RADIUS}
        fill={color}
        fillOpacity={0.12}
        stroke={color}
        strokeWidth={2.5}
      />
    </svg>
  );
}
