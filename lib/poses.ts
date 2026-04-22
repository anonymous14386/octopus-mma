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
  spine:     Point; // bottom of spine / hip center
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

export type EaseFn = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface PoseFrame {
  duration:   number;    // ms for this frame
  ease?:      EaseFn;
  label?:     string;    // shown in viewer controls
  joints:     JointSet;
  highlight?: JointKey[]; // joints to colour red (striking limb, target area, etc.)
}

export interface PoseData {
  title:   string;
  loop?:   boolean;
  frames:  PoseFrame[];
  framesB?: PoseFrame[]; // optional second figure for partner techniques
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
