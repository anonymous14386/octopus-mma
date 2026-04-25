"use client";

import { useState } from "react";
import StickFigure from "./StickFigure";
import { usePoseAnimation } from "./usePoseAnimation";
import { type PoseData, NEUTRAL_STANCE } from "@/lib/poses";

// ─── Constants ───────────────────────────────────────────────────────────────

const SPEEDS = [0.25, 0.5, 1, 2] as const;

const EMPTY: PoseData = {
  title: "",
  loop: true,
  frames: [{ duration: 1000, joints: NEUTRAL_STANCE }],
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconPrev() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
    </svg>
  );
}
function IconNext() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18 14.5 12 6 6v12zm10-12v12h2V6h-2z" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

function IconFlip() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}

export default function DiagramViewer({ poses }: { poses: PoseData }) {
  const anim = usePoseAnimation(poses ?? EMPTY);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden select-none">

      {/* ── Figure canvas ── */}
      <div
        className="flex items-center justify-center px-6 pt-8 pb-4 min-h-[260px]"
        style={{ background: "linear-gradient(180deg, #111 0%, #1e1e1e 100%)" }}
      >
        <StickFigure
          joints={anim.joints}
          nearSide={flipped ? "R" : "L"}
          highlightJoints={anim.highlightJoints}
          handShape={poses.frames[anim.frameIndex]?.handShape}
          opponentJoints={anim.opponentJoints}
          opponentNearSide={flipped ? "L" : "R"}
          opponentHighlight={anim.opponentHighlight}
          opponentHandShape={poses.frames[anim.frameIndex]?.opponentHandShape}
          opponentOnTop={poses.opponentOnTop}
          className="w-48 h-auto drop-shadow-lg"
        />
      </div>

      {/* ── Frame label ── */}
      <div className="px-4 py-2 text-center border-t border-brand-border/60">
        <span className="text-sm font-medium text-white">{anim.frameLabel}</span>
        {anim.opponentJoints && (
          <span className="ml-2 text-[10px] text-[#5090c8] opacity-70">· partner shown</span>
        )}
      </div>

      {/* ── Frame dots (click to jump) ── */}
      <div className="flex items-center justify-center gap-2 pb-2">
        {Array.from({ length: anim.totalFrames }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to frame ${i + 1}`}
            onClick={() => { anim.pause(); anim.goToFrame(i); }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === anim.frameIndex
                ? "bg-brand-red scale-125"
                : "bg-brand-border hover:bg-brand-muted"
            }`}
          />
        ))}
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-between px-4 pb-4 gap-3 border-t border-brand-border/40 pt-2">

        <div className="flex items-center gap-1">
          <button
            aria-label="Previous frame"
            onClick={() => { anim.pause(); anim.goToFrame(anim.frameIndex - 1); }}
            className="p-2 text-brand-muted hover:text-white transition-colors rounded"
          >
            <IconPrev />
          </button>

          <button
            aria-label={anim.isPlaying ? "Pause" : "Play"}
            onClick={anim.isPlaying ? anim.pause : anim.play}
            className="w-9 h-9 rounded-full bg-brand-red hover:bg-brand-red-dark flex items-center justify-center transition-colors"
          >
            {anim.isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          <button
            aria-label="Next frame"
            onClick={() => { anim.pause(); anim.goToFrame(anim.frameIndex + 1); }}
            className="p-2 text-brand-muted hover:text-white transition-colors rounded"
          >
            <IconNext />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="Flip view"
            onClick={() => setFlipped(f => !f)}
            title="Flip view"
            className={`p-2 rounded transition-colors ${flipped ? "text-brand-red" : "text-brand-muted hover:text-white"}`}
          >
            <IconFlip />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-brand-muted mr-1">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => anim.setSpeed(s)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                anim.speed === s
                  ? "bg-brand-red/20 text-brand-red font-semibold"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
