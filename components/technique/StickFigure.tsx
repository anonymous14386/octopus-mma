"use client";

import type { JointSet, JointKey, HandShape } from "@/lib/poses";

// ── Palette types ─────────────────────────────────────────────────────────────

interface Palette {
  near: string;
  far:  string;
  ctr:  string;
  hl:   string;
}

// Self figure: warm white (practitioner being taught)
const SELF: Palette = { near: "#d4cfc8", far: "#3c3c52", ctr: "#888090", hl: "#e74c3c" };
// Opponent figure: blue (training partner / attacker)
const OPP:  Palette = { near: "#5090c8", far: "#1a3d6a", ctr: "#2c6098", hl: "#e74c3c" };

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  joints:              JointSet;
  nearSide?:           "L" | "R";
  highlightJoints?:    JointKey[];
  handShape?:          Partial<Record<"handL" | "handR", HandShape>>;
  opponentJoints?:     JointSet;
  opponentNearSide?:   "L" | "R";
  opponentHighlight?:  JointKey[];
  opponentHandShape?:  Partial<Record<"handL" | "handR", HandShape>>;
  opponentOnTop?:      boolean;
  className?:          string;
}

// ── Figure renderer ───────────────────────────────────────────────────────────

function Figure({
  jt,
  pal,
  hl,
  faceRight,
  handShapes,
}: {
  jt: JointSet;
  pal: Palette;
  hl: Set<JointKey>;
  faceRight: boolean;
  handShapes?: Partial<Record<"handL" | "handR", HandShape>>;
}) {
  // When facing right, L side = near; when facing left, R side = near.
  const ns = faceRight ? "L" : "R"; // near-side suffix
  const fs = faceRight ? "R" : "L"; // far-side suffix

  const J = (k: string) => jt[k as JointKey] as { x: number; y: number };

  // Colour helpers: check highlight using near/far suffix
  const nc = (prefixes: string[]) =>
    prefixes.some(p => hl.has(`${p}${ns}` as JointKey)) ? pal.hl : pal.near;
  const fc = (prefixes: string[]) =>
    prefixes.some(p => hl.has(`${p}${fs}` as JointKey)) ? pal.hl : pal.far;

  const nP = { shoulder: J(`shoulder${ns}`), elbow: J(`elbow${ns}`), hand: J(`hand${ns}`),
               hip: J(`hip${ns}`), knee: J(`knee${ns}`), foot: J(`foot${ns}`) };
  const fP = { shoulder: J(`shoulder${fs}`), elbow: J(`elbow${fs}`), hand: J(`hand${fs}`),
               hip: J(`hip${fs}`), knee: J(`knee${fs}`), foot: J(`foot${fs}`) };

  // Oriented shape helpers
  const ang = (parent: {x:number;y:number}, child: {x:number;y:number}) =>
    Math.atan2(child.y - parent.y, child.x - parent.x) * 180 / Math.PI;
  const angRad = (parent: {x:number;y:number}, child: {x:number;y:number}) =>
    Math.atan2(child.y - parent.y, child.x - parent.x);

  const nHandAng = ang(nP.elbow, nP.hand);
  const fHandAng = ang(fP.elbow, fP.hand);

  // Foot: if shin is mostly vertical (standing), align foot with facing direction.
  // If shin is mostly horizontal (kicking/sweeping), keep inline with the shin.
  const nShinRad = angRad(nP.knee, nP.foot);
  const fShinRad = angRad(fP.knee, fP.foot);
  const facingAng = faceRight ? 0 : 180;
  const nFootAng = Math.abs(Math.sin(nShinRad)) > 0.6 ? facingAng : ang(nP.knee, nP.foot);
  const fFootAng = Math.abs(Math.sin(fShinRad)) > 0.6 ? facingAng : ang(fP.knee, fP.foot);

  // Hand shape per side
  const nsKey = `hand${ns}` as "handL" | "handR";
  const fsKey = `hand${fs}` as "handL" | "handR";
  const nHandOpen = handShapes?.[nsKey] === "open";
  const fHandOpen = handShapes?.[fsKey] === "open";

  return (
    <>
      {/* Torso volume fill */}
      <polygon
        points={`${jt.shoulderL.x},${jt.shoulderL.y} ${jt.shoulderR.x},${jt.shoulderR.y} ${jt.hipR.x},${jt.hipR.y} ${jt.hipL.x},${jt.hipL.y}`}
        fill={pal.ctr} fillOpacity={0.22} stroke="none"
      />

      {/* Far-side legs (behind far arms when crossing) */}
      <line x1={fP.hip.x} y1={fP.hip.y} x2={fP.knee.x} y2={fP.knee.y}
        stroke={fc(["hip","knee","foot"])} strokeWidth={6.5} strokeLinecap="round" />
      <line x1={fP.knee.x} y1={fP.knee.y} x2={fP.foot.x} y2={fP.foot.y}
        stroke={fc(["knee","foot"])} strokeWidth={5.5} strokeLinecap="round" />
      <circle cx={fP.knee.x} cy={fP.knee.y} r={4} fill={fc(["knee"])} />
      <g transform={`translate(${fP.foot.x},${fP.foot.y}) rotate(${fFootAng})`} opacity={0.85}>
        <rect x={-3} y={-2.5} width={9} height={5} rx={2} fill={fc(["foot","knee"])} />
      </g>
      {/* Far-side arms (on top of far legs when crossing) */}
      <line x1={fP.shoulder.x} y1={fP.shoulder.y} x2={fP.elbow.x} y2={fP.elbow.y}
        stroke={fc(["shoulder","elbow","hand"])} strokeWidth={5} strokeLinecap="round" />
      <line x1={fP.elbow.x} y1={fP.elbow.y} x2={fP.hand.x} y2={fP.hand.y}
        stroke={fc(["elbow","hand"])} strokeWidth={4} strokeLinecap="round" />
      <circle cx={fP.elbow.x} cy={fP.elbow.y} r={3} fill={fc(["elbow"])} />
      <g transform={`translate(${fP.hand.x},${fP.hand.y}) rotate(${fHandOpen ? fHandAng + 90 : fHandAng})`} opacity={0.85}>
        {fHandOpen
          ? <rect x={-6} y={-1}   width={12} height={2}   rx={0.8} fill={fc(["hand"])} />
          : <rect x={1}  y={-2}   width={5}  height={4}   rx={1.8} fill={fc(["hand"])} />}
      </g>

      {/* Torso / centre mass + neck (all medium, drawn before near limbs) */}
      <line x1={jt.shoulderL.x} y1={jt.shoulderL.y} x2={jt.shoulderR.x} y2={jt.shoulderR.y}
        stroke={pal.ctr} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <line x1={jt.neck.x} y1={jt.neck.y} x2={jt.spine.x} y2={jt.spine.y}
        stroke={pal.ctr} strokeWidth={9} strokeLinecap="round" />
      <line x1={jt.hipL.x} y1={jt.hipL.y} x2={jt.hipR.x} y2={jt.hipR.y}
        stroke={pal.ctr} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <line x1={jt.neck.x} y1={jt.neck.y} x2={jt.head.x} y2={jt.head.y}
        stroke={pal.ctr} strokeWidth={6} strokeLinecap="round" />

      {/* Head — drawn before near limbs so the near arm can pass in front of it */}
      <circle cx={jt.head.x} cy={jt.head.y} r={9}
        fill={pal.ctr} stroke={pal.ctr} strokeWidth={2.5} />

      {/* Near-side legs (behind near arms when crossing) */}
      <line x1={nP.hip.x} y1={nP.hip.y} x2={nP.knee.x} y2={nP.knee.y}
        stroke={nc(["hip","knee","foot"])} strokeWidth={8.5} strokeLinecap="round" />
      <line x1={nP.knee.x} y1={nP.knee.y} x2={nP.foot.x} y2={nP.foot.y}
        stroke={nc(["knee","foot"])} strokeWidth={7} strokeLinecap="round" />
      <circle cx={nP.knee.x} cy={nP.knee.y} r={5} fill={nc(["knee"])} />
      <g transform={`translate(${nP.foot.x},${nP.foot.y}) rotate(${nFootAng})`}>
        <rect x={-3} y={-3} width={11} height={6} rx={2.5} fill={nc(["foot","knee"])} />
      </g>
      {/* Near-side arms (on top of near legs when crossing) */}
      <line x1={nP.shoulder.x} y1={nP.shoulder.y} x2={nP.elbow.x} y2={nP.elbow.y}
        stroke={nc(["shoulder","elbow","hand"])} strokeWidth={7} strokeLinecap="round" />
      <line x1={nP.elbow.x} y1={nP.elbow.y} x2={nP.hand.x} y2={nP.hand.y}
        stroke={nc(["elbow","hand"])} strokeWidth={6} strokeLinecap="round" />
      <circle cx={nP.elbow.x} cy={nP.elbow.y} r={4} fill={nc(["elbow"])} />
      {/* Near hand — fist: compact square / open: thin blade perpendicular to forearm */}
      <g transform={`translate(${nP.hand.x},${nP.hand.y}) rotate(${nHandOpen ? nHandAng + 90 : nHandAng})`}>
        {nHandOpen
          ? <rect x={-7} y={-1.2} width={14} height={2.4} rx={1}   fill={nc(["hand"])} />
          : <rect x={1}  y={-2.8} width={6}  height={5.5} rx={2.2} fill={nc(["hand"])} />}
      </g>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StickFigure({
  joints,
  nearSide = "L",
  highlightJoints = [],
  handShape,
  opponentJoints,
  opponentNearSide = "R",
  opponentHighlight = [],
  opponentHandShape,
  opponentOnTop = false,
  className,
}: Props) {
  const selfFig = (
    <Figure
      jt={joints}
      pal={SELF}
      hl={new Set<JointKey>(highlightJoints)}
      faceRight={nearSide === "L"}
      handShapes={handShape}
    />
  );

  const oppFig = opponentJoints ? (
    <Figure
      jt={opponentJoints}
      pal={OPP}
      hl={new Set<JointKey>(opponentHighlight)}
      faceRight={opponentNearSide === "L"}
      handShapes={opponentHandShape}
    />
  ) : null;

  return (
    <svg viewBox="0 -10 100 124" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Render behind first, then in front on top */}
      {opponentOnTop ? <>{selfFig}{oppFig}</> : <>{oppFig}{selfFig}</>}
    </svg>
  );
}
