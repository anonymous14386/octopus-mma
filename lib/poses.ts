export interface Point {
  x: number;
  y: number;
}

// All joints in a 100×110 coordinate space (viewBox "0 0 100 110")
// Near side (L) = the side facing the viewer — full opacity
// Far side (R)  = the side away from viewer  — dim opacity
export interface JointSet {
  head:      Point;
  neck:      Point;
  spine:     Point; // bottom of spine / hip centre
  shoulderL: Point;
  shoulderR: Point;
  elbowL:    Point;
  elbowR:    Point;
  handL:     Point;
  handR:     Point;
  hipL:      Point;
  hipR:      Point;
  kneeL:     Point;
  kneeR:     Point;
  footL:     Point;
  footR:     Point;
}

export type JointKey = keyof JointSet;

export type EaseFn    = "linear" | "ease-in" | "ease-out" | "ease-in-out";
export type HandShape = "fist" | "open";

// Which segments of the opponent figure render in FRONT of the self figure.
// When present, the renderer does 3 passes: opponent-back → self → opponent-front.
// "armNear" / "legNear" = the side facing the viewer; "armFar" / "legFar" = the side away.
export type OpponentSegment = "head" | "torso" | "armNear" | "armFar" | "legNear" | "legFar";
export const ALL_OPPONENT_SEGMENTS: OpponentSegment[] = ["head", "torso", "armNear", "armFar", "legNear", "legFar"];

export interface PoseFrame {
  duration:           number;    // ms for this frame
  ease?:              EaseFn;
  label?:             string;    // shown in viewer controls
  joints:             JointSet;
  highlight?:         JointKey[];
  handShape?:         Partial<Record<"handL" | "handR", HandShape>>;
  opponentJoints?:    JointSet;  // second figure (grappling / partner techniques)
  opponentHighlight?: JointKey[];
  opponentHandShape?: Partial<Record<"handL" | "handR", HandShape>>;
}

export interface PoseData {
  title:          string;
  loop?:          boolean;
  frames:         PoseFrame[];
  opponentOnTop?: boolean; // render opponent in front of self (guard / bottom techniques)
}

// ─── Reference poses ────────────────────────────────────────────────────────

export const NEUTRAL_STANCE: JointSet = {
  head:      { x: 50, y: 8  },
  neck:      { x: 50, y: 16 },
  spine:     { x: 50, y: 50 },
  shoulderL: { x: 40, y: 22 },
  shoulderR: { x: 60, y: 22 },
  elbowL:    { x: 34, y: 36 },
  elbowR:    { x: 66, y: 36 },
  handL:     { x: 30, y: 50 },
  handR:     { x: 70, y: 50 },
  hipL:      { x: 44, y: 52 },
  hipR:      { x: 56, y: 52 },
  kneeL:     { x: 44, y: 72 },
  kneeR:     { x: 56, y: 72 },
  footL:     { x: 42, y: 94 },
  footR:     { x: 58, y: 94 },
};

// Flat-on-back pose used as a starting point for grappling opponents
export const FLAT_ON_BACK: JointSet = {
  head:      { x: 18, y: 70 },
  neck:      { x: 26, y: 70 },
  spine:     { x: 60, y: 73 },
  shoulderL: { x: 26, y: 66 },
  shoulderR: { x: 28, y: 76 },
  elbowL:    { x: 14, y: 62 },
  elbowR:    { x: 16, y: 82 },
  handL:     { x:  8, y: 58 },
  handR:     { x: 10, y: 86 },
  hipL:      { x: 72, y: 68 },
  hipR:      { x: 74, y: 76 },
  kneeL:     { x: 83, y: 65 },
  kneeR:     { x: 85, y: 79 },
  footL:     { x: 92, y: 63 },
  footR:     { x: 93, y: 81 },
};
