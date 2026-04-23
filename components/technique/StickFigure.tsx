"use client";

import type { JointSet, JointKey } from "@/lib/poses";

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
  joints:             JointSet;
  nearSide?:          "L" | "R";
  highlightJoints?:   JointKey[];
  opponentJoints?:    JointSet;
  opponentNearSide?:  "L" | "R";
  opponentHighlight?: JointKey[];
  opponentOnTop?:     boolean;  // render opponent in front of self
  className?:         string;
}

// ── Figure renderer ───────────────────────────────────────────────────────────

function Figure({
  jt,
  pal,
  hl,
  faceRight,
}: {
  jt: JointSet;
  pal: Palette;
  hl: Set<JointKey>;
  faceRight: boolean;
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

  const eyeX  = jt.head.x + (faceRight ?  3 : -3);
  const noseX = jt.head.x + (faceRight ?  7 : -7);

  return (
    <>
      {/* Torso volume fill */}
      <polygon
        points={`${jt.shoulderL.x},${jt.shoulderL.y} ${jt.shoulderR.x},${jt.shoulderR.y} ${jt.hipR.x},${jt.hipR.y} ${jt.hipL.x},${jt.hipL.y}`}
        fill={pal.ctr} fillOpacity={0.22} stroke="none"
      />

      {/* Far-side limbs (rendered behind) */}
      <line x1={fP.shoulder.x} y1={fP.shoulder.y} x2={fP.elbow.x} y2={fP.elbow.y}
        stroke={fc(["shoulder","elbow","hand"])} strokeWidth={5} strokeLinecap="round" />
      <line x1={fP.elbow.x} y1={fP.elbow.y} x2={fP.hand.x} y2={fP.hand.y}
        stroke={fc(["elbow","hand"])} strokeWidth={4} strokeLinecap="round" />
      <line x1={fP.hip.x} y1={fP.hip.y} x2={fP.knee.x} y2={fP.knee.y}
        stroke={fc(["hip","knee","foot"])} strokeWidth={6.5} strokeLinecap="round" />
      <line x1={fP.knee.x} y1={fP.knee.y} x2={fP.foot.x} y2={fP.foot.y}
        stroke={fc(["knee","foot"])} strokeWidth={5.5} strokeLinecap="round" />
      <circle cx={fP.elbow.x} cy={fP.elbow.y} r={3}   fill={fc(["elbow"])} />
      <circle cx={fP.knee.x}  cy={fP.knee.y}  r={4}   fill={fc(["knee"])} />
      <circle cx={fP.hand.x}  cy={fP.hand.y}  r={3}   fill={fc(["hand"])} />

      {/* Torso / centre mass */}
      <line x1={jt.shoulderL.x} y1={jt.shoulderL.y} x2={jt.shoulderR.x} y2={jt.shoulderR.y}
        stroke={pal.ctr} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <line x1={jt.neck.x} y1={jt.neck.y} x2={jt.spine.x} y2={jt.spine.y}
        stroke={pal.ctr} strokeWidth={9} strokeLinecap="round" />
      <line x1={jt.hipL.x} y1={jt.hipL.y} x2={jt.hipR.x} y2={jt.hipR.y}
        stroke={pal.ctr} strokeWidth={5} strokeLinecap="round" opacity={0.85} />

      {/* Near-side limbs (rendered in front) */}
      <line x1={nP.shoulder.x} y1={nP.shoulder.y} x2={nP.elbow.x} y2={nP.elbow.y}
        stroke={nc(["shoulder","elbow","hand"])} strokeWidth={7} strokeLinecap="round" />
      <line x1={nP.elbow.x} y1={nP.elbow.y} x2={nP.hand.x} y2={nP.hand.y}
        stroke={nc(["elbow","hand"])} strokeWidth={6} strokeLinecap="round" />
      <line x1={nP.hip.x} y1={nP.hip.y} x2={nP.knee.x} y2={nP.knee.y}
        stroke={nc(["hip","knee","foot"])} strokeWidth={8.5} strokeLinecap="round" />
      <line x1={nP.knee.x} y1={nP.knee.y} x2={nP.foot.x} y2={nP.foot.y}
        stroke={nc(["knee","foot"])} strokeWidth={7} strokeLinecap="round" />
      <circle cx={nP.elbow.x} cy={nP.elbow.y} r={4}   fill={nc(["elbow"])} />
      <circle cx={nP.knee.x}  cy={nP.knee.y}  r={5}   fill={nc(["knee"])} />
      <circle cx={nP.hand.x}  cy={nP.hand.y}  r={3.5} fill={nc(["hand"])} />

      {/* Neck */}
      <line x1={jt.neck.x} y1={jt.neck.y} x2={jt.head.x} y2={jt.head.y}
        stroke={pal.ctr} strokeWidth={6} strokeLinecap="round" />

      {/* Head */}
      <circle cx={jt.head.x} cy={jt.head.y} r={9}
        fill={pal.ctr} fillOpacity={0.2} stroke={pal.ctr} strokeWidth={2.5} />
      <circle cx={eyeX}  cy={jt.head.y - 1.5} r={1.4} fill={pal.ctr} />
      <circle cx={noseX} cy={jt.head.y + 1.5} r={1.6} fill={pal.ctr} opacity={0.85} />
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StickFigure({
  joints,
  nearSide = "L",
  highlightJoints = [],
  opponentJoints,
  opponentNearSide = "R",
  opponentHighlight = [],
  opponentOnTop = false,
  className,
}: Props) {
  const selfFig = (
    <Figure
      jt={joints}
      pal={SELF}
      hl={new Set<JointKey>(highlightJoints)}
      faceRight={nearSide === "L"}
    />
  );

  const oppFig = opponentJoints ? (
    <Figure
      jt={opponentJoints}
      pal={OPP}
      hl={new Set<JointKey>(opponentHighlight)}
      faceRight={opponentNearSide === "L"}
    />
  ) : null;

  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Render behind first, then in front on top */}
      {opponentOnTop ? <>{selfFig}{oppFig}</> : <>{oppFig}{selfFig}</>}
    </svg>
  );
}
