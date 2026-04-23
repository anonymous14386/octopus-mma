"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { type JointSet, type JointKey, type PoseData, type EaseFn, NEUTRAL_STANCE } from "@/lib/poses";

// ─── Math helpers ────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function lerpJoints(a: JointSet, b: JointSet, t: number): JointSet {
  return Object.fromEntries(
    (Object.keys(a) as (keyof JointSet)[]).map((k) => [k, lerpPoint(a[k], b[k], t)])
  ) as unknown as JointSet;
}

function applyEase(t: number, fn: EaseFn = "ease-in-out"): number {
  switch (fn) {
    case "ease-in":     return t * t;
    case "ease-out":    return 1 - (1 - t) * (1 - t);
    case "ease-in-out": return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:            return t;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PoseAnimState {
  joints:            JointSet;
  opponentJoints?:   JointSet;
  highlightJoints:   JointKey[];
  opponentHighlight: JointKey[];
  frameIndex:        number;
  frameLabel:        string;
  isPlaying:         boolean;
  play:              () => void;
  pause:             () => void;
  goToFrame:         (i: number) => void;
  speed:             number;
  setSpeed:          (s: number) => void;
  totalFrames:       number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePoseAnimation(data: PoseData): PoseAnimState {
  const frames = data.frames;
  const hasOpponent = useMemo(() => frames.some(f => f.opponentJoints != null), [frames]);

  const [joints,         setJoints]         = useState<JointSet>(frames[0]?.joints ?? NEUTRAL_STANCE);
  const [opponentJoints, setOpponentJoints] = useState<JointSet | undefined>(frames[0]?.opponentJoints);
  const [frameIndex,     setFrameIndex]     = useState(0);
  const [isPlaying,      setIsPlaying]      = useState(true);
  const [speed,          setSpeed]          = useState(1);

  const rafRef      = useRef<number | null>(null);
  const elapsedRef  = useRef(0);
  const lastTsRef   = useRef<number | null>(null);
  const playingRef  = useRef(true);
  const speedRef    = useRef(1);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  const { frameStarts, totalDuration } = useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const f of frames) { starts.push(acc); acc += f.duration; }
    return { frameStarts: starts, totalDuration: acc };
  }, [frames]);

  const getStateAt = useCallback((elapsed: number) => {
    const total = totalDuration;
    const t = total > 0
      ? (data.loop ? ((elapsed % total) + total) % total : Math.min(elapsed, total - 1))
      : 0;

    let fi = frames.length - 1;
    for (let i = 0; i < frames.length; i++) {
      if (t < frameStarts[i] + frames[i].duration) { fi = i; break; }
    }

    const frameT = t - frameStarts[fi];
    const dur    = frames[fi].duration;
    const rawP   = dur > 0 ? Math.min(frameT / dur, 1) : 1;
    const easedP = applyEase(rawP, frames[fi].ease);
    const nextFi = (data.loop && fi === frames.length - 1) ? 0 : Math.min(fi + 1, frames.length - 1);

    const oppA = frames[fi].opponentJoints    ?? frames[fi].joints;
    const oppB = frames[nextFi].opponentJoints ?? frames[nextFi].joints;

    return {
      joints:         lerpJoints(frames[fi].joints, frames[nextFi].joints, easedP),
      opponentJoints: hasOpponent ? lerpJoints(oppA, oppB, easedP) : undefined,
      frameIndex:     fi,
    };
  }, [data.loop, frames, frameStarts, totalDuration, hasOpponent]);

  useEffect(() => {
    function tick(ts: number) {
      if (!playingRef.current) return;
      if (lastTsRef.current !== null) {
        elapsedRef.current += (ts - lastTsRef.current) * speedRef.current;
      }
      lastTsRef.current = ts;

      if (!data.loop && elapsedRef.current >= totalDuration) {
        const s = getStateAt(totalDuration - 1);
        setJoints(s.joints);
        setOpponentJoints(s.opponentJoints);
        setFrameIndex(s.frameIndex);
        playingRef.current = false;
        setIsPlaying(false);
        return;
      }

      const s = getStateAt(elapsedRef.current);
      setJoints(s.joints);
      setOpponentJoints(s.opponentJoints);
      setFrameIndex(s.frameIndex);
      rafRef.current = requestAnimationFrame(tick);
    }

    if (isPlaying) {
      playingRef.current = true;
      lastTsRef.current  = null;
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, data.loop, getStateAt, totalDuration]);

  const play = useCallback(() => {
    lastTsRef.current = null;
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    lastTsRef.current  = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
  }, []);

  const goToFrame = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, frames.length - 1));
    elapsedRef.current = frameStarts[clamped] ?? 0;
    const s = getStateAt(elapsedRef.current);
    setJoints(s.joints);
    setOpponentJoints(s.opponentJoints);
    setFrameIndex(s.frameIndex);
    lastTsRef.current = null;
  }, [frames.length, frameStarts, getStateAt]);

  return {
    joints,
    opponentJoints,
    highlightJoints:   frames[frameIndex]?.highlight         ?? [],
    opponentHighlight: frames[frameIndex]?.opponentHighlight ?? [],
    frameIndex,
    frameLabel:  frames[frameIndex]?.label ?? `Frame ${frameIndex + 1}`,
    isPlaying,
    play,
    pause,
    goToFrame,
    speed,
    setSpeed,
    totalFrames: frames.length,
  };
}
