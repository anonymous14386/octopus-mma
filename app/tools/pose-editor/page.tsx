"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import StickFigure from "@/components/technique/StickFigure";
import { usePoseAnimation } from "@/components/technique/usePoseAnimation";
import {
  type JointKey,
  type PoseData,
  type PoseFrame,
  type EaseFn,
  NEUTRAL_STANCE,
} from "@/lib/poses";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_JOINTS: JointKey[] = [
  "head", "neck", "spine",
  "shoulderL", "shoulderR",
  "elbowL", "elbowR",
  "handL", "handR",
  "hipL", "hipR",
  "kneeL", "kneeR",
  "footL", "footR",
];

const EASE_OPTIONS: EaseFn[] = ["linear", "ease-in", "ease-out", "ease-in-out"];

const SPEEDS = [0.25, 0.5, 1, 2] as const;

const DEFAULT_DATA: PoseData = {
  title: "Untitled Pose",
  loop: true,
  frames: [
    {
      duration: 1000,
      ease: "ease-in-out",
      label: "Frame 1",
      joints: JSON.parse(JSON.stringify(NEUTRAL_STANCE)),
    },
  ],
};

function cloneData<T>(d: T): T {
  return JSON.parse(JSON.stringify(d));
}

// ─── Preview canvas (isolated so usePoseAnimation hook is always called) ─────

function PreviewCanvas({
  data,
  nearSide,
}: {
  data: PoseData;
  nearSide: "L" | "R";
}) {
  const anim = usePoseAnimation(data);
  const hasOpp = data.frames.some(f => f.opponentJoints != null);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div
          className="relative mx-auto select-none"
          style={{ width: "100%", maxWidth: 380, aspectRatio: "100 / 110" }}
        >
          <StickFigure
            joints={anim.joints}
            nearSide={nearSide}
            highlightJoints={anim.highlightJoints as JointKey[]}
            opponentJoints={hasOpp ? anim.opponentJoints : undefined}
            opponentNearSide="R"
            opponentHighlight={anim.opponentHighlight as JointKey[]}
            opponentOnTop={data.opponentOnTop}
            className="w-full h-full"
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-[#1e1e1e]">
          <button
            onClick={anim.isPlaying ? anim.pause : anim.play}
            className="w-8 h-8 rounded-full bg-[#e74c3c] hover:bg-[#c0392b] text-white flex items-center justify-center transition-colors text-sm"
          >
            {anim.isPlaying ? "⏸" : "▶"}
          </button>

          {/* Frame dots */}
          <div className="flex items-center gap-1">
            {data.frames.map((_, i) => (
              <button
                key={i}
                onClick={() => { anim.goToFrame(i); if (!anim.isPlaying) anim.pause(); }}
                className={`rounded-full transition-all ${
                  i === anim.frameIndex
                    ? "w-2.5 h-2.5 bg-[#e74c3c]"
                    : "w-1.5 h-1.5 bg-[#444] hover:bg-[#888]"
                }`}
              />
            ))}
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => anim.setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  anim.speed === s
                    ? "bg-[#333] text-white"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-center">
        <p className="text-[11px] text-[#666]">
          Frame {anim.frameIndex + 1}/{data.frames.length}
          {anim.frameLabel ? ` — ${anim.frameLabel}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export default function PoseEditorPage() {
  const [data,           setData]           = useState<PoseData>(cloneData(DEFAULT_DATA));
  const [fi,             setFi]             = useState(0);
  const [dragging,       setDragging]       = useState<JointKey | null>(null);
  const [nearSide,       setNearSide]       = useState<"L" | "R">("L");
  const [editingFigure,  setEditingFigure]  = useState<"self" | "opponent">("self");
  const [mode,           setMode]           = useState<"edit" | "preview">("edit");
  const [jsonLoad,       setJsonLoad]       = useState("");
  const [loadErr,        setLoadErr]        = useState("");
  const [copied,         setCopied]         = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const frame      = data.frames[fi] ?? data.frames[0];
  const hasOpp     = frame?.opponentJoints != null;

  const selfHL = (frame?.highlight         ?? []) as JointKey[];
  const oppHL  = (frame?.opponentHighlight ?? []) as JointKey[];
  const highlights = editingFigure === "self" ? selfHL : oppHL;

  const currentJoints = editingFigure === "self"
    ? frame?.joints
    : (frame?.opponentJoints ?? frame?.joints);

  // ── Coordinate conversion ────────────────────────────────────────────────

  function toSVGCoords(clientX: number, clientY: number) {
    const el = svgRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / rect.width)  * 1000) / 10;
    const y = Math.round(((clientY - rect.top)  / rect.height) * 1100) / 10;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(110, y)) };
  }

  // ── Pointer drag (works for mouse + touch/stylus) ────────────────────────

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging) return;
    const pos = toSVGCoords(e.clientX, e.clientY);
    setData(prev => {
      const d = cloneData(prev);
      const f = d.frames[fi];
      if (!f) return d;
      if (editingFigure === "self") {
        f.joints[dragging] = pos;
      } else if (f.opponentJoints) {
        f.opponentJoints[dragging] = pos;
      }
      return d;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, fi, editingFigure]);

  const onPointerUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup",   onPointerUp);
    };
  }, [dragging, onPointerMove, onPointerUp]);

  // ── Frame operations ─────────────────────────────────────────────────────

  function duplicateFrame() {
    setData(prev => {
      const d = cloneData(prev);
      const copy: PoseFrame = cloneData(d.frames[fi]);
      copy.label = `Frame ${d.frames.length + 1}`;
      d.frames.splice(fi + 1, 0, copy);
      return d;
    });
    setFi(fi + 1);
  }

  function deleteFrame() {
    if (data.frames.length <= 1) return;
    setData(prev => {
      const d = cloneData(prev);
      d.frames.splice(fi, 1);
      return d;
    });
    setFi(Math.max(0, fi - 1));
  }

  function updateFrame<K extends keyof PoseFrame>(key: K, value: PoseFrame[K]) {
    setData(prev => {
      const d = cloneData(prev);
      (d.frames[fi] as PoseFrame)[key] = value;
      return d;
    });
  }

  function resetFrameToNeutral() {
    setData(prev => {
      const d = cloneData(prev);
      if (editingFigure === "self") {
        d.frames[fi].joints = cloneData(NEUTRAL_STANCE);
      } else if (d.frames[fi].opponentJoints) {
        d.frames[fi].opponentJoints = cloneData(NEUTRAL_STANCE);
      }
      return d;
    });
  }

  // ── Opponent management ──────────────────────────────────────────────────

  function addOpponent() {
    setData(prev => {
      const d = cloneData(prev);
      for (const f of d.frames) {
        f.opponentJoints = cloneData(NEUTRAL_STANCE);
      }
      return d;
    });
    setEditingFigure("opponent");
  }

  function removeOpponent() {
    setData(prev => {
      const d = cloneData(prev);
      for (const f of d.frames) {
        delete f.opponentJoints;
        delete f.opponentHighlight;
      }
      return d;
    });
    setEditingFigure("self");
  }

  // ── Highlight toggle ─────────────────────────────────────────────────────

  function toggleHighlight(joint: JointKey) {
    if (editingFigure === "self") {
      const cur = [...selfHL];
      const idx = cur.indexOf(joint);
      if (idx >= 0) cur.splice(idx, 1); else cur.push(joint);
      updateFrame("highlight", cur as JointKey[]);
    } else {
      const cur = [...oppHL];
      const idx = cur.indexOf(joint);
      if (idx >= 0) cur.splice(idx, 1); else cur.push(joint);
      updateFrame("opponentHighlight", cur as JointKey[]);
    }
  }

  // ── JSON I/O ─────────────────────────────────────────────────────────────

  async function copyJSON() {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadJSON() {
    setLoadErr("");
    try {
      const parsed = JSON.parse(jsonLoad) as PoseData;
      if (!Array.isArray(parsed.frames) || parsed.frames.length === 0)
        throw new Error("frames array is empty or missing");
      setData(parsed);
      setFi(0);
      setEditingFigure("self");
      setMode("edit");
      setJsonLoad("");
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const jsonOutput = JSON.stringify(data, null, 2);

  return (
    <main className="min-h-screen bg-[#111] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">Pose Editor</h1>

          <input
            value={data.title}
            onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Pose title"
            className="flex-1 min-w-[200px] bg-[#1e1e1e] border border-[#333] rounded px-3 py-1.5 text-sm placeholder:text-[#555]"
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.loop ?? true}
              onChange={e => setData(prev => ({ ...prev, loop: e.target.checked }))}
            />
            Loop
          </label>

          {hasOpp && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.opponentOnTop ?? false}
                onChange={e => setData(prev => ({ ...prev, opponentOnTop: e.target.checked }))}
              />
              Opponent on top
            </label>
          )}

          <label className="flex items-center gap-2 text-sm">
            <span className="text-[#888]">Facing:</span>
            <select
              value={nearSide}
              onChange={e => setNearSide(e.target.value as "L" | "R")}
              className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-sm"
            >
              <option value="L">Right (L near)</option>
              <option value="R">Left (R near)</option>
            </select>
          </label>

          {/* Edit / Preview toggle */}
          <div className="flex rounded overflow-hidden border border-[#333] ml-auto">
            <button
              onClick={() => setMode("edit")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "edit"
                  ? "bg-[#e74c3c] text-white font-medium"
                  : "bg-[#1e1e1e] text-[#888] hover:text-white"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "preview"
                  ? "bg-[#e74c3c] text-white font-medium"
                  : "bg-[#1e1e1e] text-[#888] hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* ── Figure toggle (edit mode only) ── */}
        {mode === "edit" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingFigure("self")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                editingFigure === "self"
                  ? "bg-[#e74c3c] text-white font-medium"
                  : "bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white"
              }`}
            >
              Self (white)
            </button>

            {hasOpp ? (
              <>
                <button
                  onClick={() => setEditingFigure("opponent")}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    editingFigure === "opponent"
                      ? "bg-[#2c6098] text-white font-medium"
                      : "bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white"
                  }`}
                >
                  Opponent (blue)
                </button>
                <button
                  onClick={removeOpponent}
                  className="px-3 py-1 rounded text-sm bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-red-400 transition-colors"
                >
                  Remove opponent
                </button>
              </>
            ) : (
              <button
                onClick={addOpponent}
                className="px-3 py-1 rounded text-sm bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-[#5090c8] transition-colors"
              >
                + Add opponent
              </button>
            )}
          </div>
        )}

        {/* ── Frame tabs ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {data.frames.map((f, i) => (
            <button
              key={i}
              onClick={() => { setFi(i); setMode("edit"); }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                i === fi
                  ? "bg-[#e74c3c] text-white font-medium"
                  : "bg-[#1e1e1e] text-[#888] hover:text-white border border-[#333]"
              }`}
            >
              {f.label || `F${i + 1}`}
            </button>
          ))}

          <button
            onClick={duplicateFrame}
            className="px-3 py-1 rounded text-sm bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-white transition-colors"
          >
            + Dup
          </button>

          {data.frames.length > 1 && (
            <button
              onClick={deleteFrame}
              className="px-3 py-1 rounded text-sm bg-[#1e1e1e] border border-[#333] text-[#888] hover:text-red-400 transition-colors"
            >
              Del
            </button>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_290px] gap-4">

          {/* ── Left: Joint list (edit mode only) ── */}
          {mode === "edit" ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex flex-col gap-1">
              <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1">
                {editingFigure === "self" ? "Self joints" : "Opponent joints"} — click to highlight
              </p>
              {ALL_JOINTS.map(joint => {
                const pos  = currentJoints?.[joint];
                const isHL = highlights.includes(joint);
                return (
                  <button
                    key={joint}
                    onClick={() => toggleHighlight(joint)}
                    className={`flex items-center justify-between px-2 py-0.5 rounded text-left text-[11px] font-mono transition-colors ${
                      isHL
                        ? editingFigure === "self"
                          ? "bg-red-950/50 text-red-400"
                          : "bg-blue-950/50 text-blue-400"
                        : "text-[#999] hover:bg-[#222] hover:text-white"
                    }`}
                  >
                    <span>{joint}</span>
                    <span className="text-[#555] text-[10px]">
                      {pos ? `${pos.x.toFixed(1)},${pos.y.toFixed(1)}` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex flex-col gap-2">
              <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Frames</p>
              {data.frames.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-[#666]">
                  <span className="text-[#444]">{i + 1}</span>
                  <span className="flex-1 truncate">{f.label || `Frame ${i + 1}`}</span>
                  <span className="text-[#555]">{f.duration}ms</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Center: Canvas ── */}
          <div className="flex flex-col gap-3">
            {mode === "preview" ? (
              <PreviewCanvas data={data} nearSide={nearSide} />
            ) : (
              <>
                {/* Drag canvas */}
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden">
                  <div
                    className="relative mx-auto select-none"
                    style={{ width: "100%", maxWidth: 380, aspectRatio: "100 / 110" }}
                  >
                    <StickFigure
                      joints={frame?.joints ?? NEUTRAL_STANCE}
                      nearSide={nearSide}
                      highlightJoints={selfHL}
                      opponentJoints={frame?.opponentJoints}
                      opponentNearSide="R"
                      opponentHighlight={oppHL}
                      opponentOnTop={data.opponentOnTop}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />

                    {/* Drag-handle overlay */}
                    <svg
                      ref={svgRef}
                      viewBox="0 0 100 110"
                      className="absolute inset-0 w-full h-full"
                      style={{ cursor: dragging ? "grabbing" : "default" }}
                    >
                      {ALL_JOINTS.map(joint => {
                        const pos  = currentJoints?.[joint];
                        if (!pos) return null;
                        const isHL = highlights.includes(joint);
                        const color = editingFigure === "self"
                          ? (isHL ? "rgba(231,76,60,0.6)" : "rgba(255,255,255,0.2)")
                          : (isHL ? "rgba(231,76,60,0.6)" : "rgba(80,144,200,0.3)");
                        const strokeColor = editingFigure === "self"
                          ? (isHL ? "#e74c3c" : "rgba(255,255,255,0.55)")
                          : (isHL ? "#e74c3c" : "rgba(80,144,200,0.8)");
                        return (
                          <g key={joint}>
                            <circle
                              cx={pos.x} cy={pos.y} r={6}
                              fill="transparent"
                              style={{ cursor: "grab" }}
                              onPointerDown={e => { e.preventDefault(); setDragging(joint); }}
                            />
                            <circle
                              cx={pos.x} cy={pos.y} r={2.8}
                              fill={color}
                              stroke={strokeColor}
                              strokeWidth={0.7}
                              style={{ pointerEvents: "none" }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <p className="text-center text-[10px] text-[#444] py-2">
                    Drag dots to move joints · Click joint name to toggle highlight
                  </p>
                </div>

                {/* Frame metadata */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#555] uppercase tracking-wider">Label</span>
                    <input
                      value={frame?.label ?? ""}
                      onChange={e => updateFrame("label", e.target.value)}
                      className="bg-[#111] border border-[#333] rounded px-2 py-1 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#555] uppercase tracking-wider">Duration (ms)</span>
                    <input
                      type="number" min={50} step={50}
                      value={frame?.duration ?? 1000}
                      onChange={e => updateFrame("duration", Number(e.target.value))}
                      className="bg-[#111] border border-[#333] rounded px-2 py-1 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#555] uppercase tracking-wider">Ease</span>
                    <select
                      value={frame?.ease ?? "ease-in-out"}
                      onChange={e => updateFrame("ease", e.target.value as EaseFn)}
                      className="bg-[#111] border border-[#333] rounded px-2 py-1 text-sm"
                    >
                      {EASE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </label>

                  <div className="flex flex-col justify-end">
                    <button
                      onClick={resetFrameToNeutral}
                      className="px-3 py-1.5 rounded text-xs bg-[#282828] hover:bg-[#333] text-[#888] hover:text-white transition-colors"
                    >
                      Reset {editingFigure} to neutral
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Right: JSON output + load ── */}
          <div className="flex flex-col gap-3">

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#555] uppercase tracking-wider">JSON Output</span>
                <button
                  onClick={copyJSON}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    copied
                      ? "bg-green-800 text-green-200"
                      : "bg-[#2a2a2a] hover:bg-[#333] text-[#888] hover:text-white"
                  }`}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <pre className="text-[10px] text-[#888] font-mono bg-[#0d0d0d] rounded p-2 overflow-auto max-h-[480px] whitespace-pre leading-relaxed">
                {jsonOutput}
              </pre>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex flex-col gap-2">
              <span className="text-[10px] text-[#555] uppercase tracking-wider">Load JSON</span>
              <textarea
                value={jsonLoad}
                onChange={e => { setJsonLoad(e.target.value); setLoadErr(""); }}
                placeholder="Paste .poses.json content here…"
                className="bg-[#0d0d0d] border border-[#333] rounded px-2 py-2 text-[10px] font-mono text-[#888] h-28 resize-none placeholder:text-[#444]"
              />
              {loadErr && <p className="text-[10px] text-red-400 font-mono">{loadErr}</p>}
              <button
                onClick={loadJSON}
                disabled={!jsonLoad.trim()}
                className="px-3 py-1.5 rounded text-xs bg-[#2a2a2a] hover:bg-[#333] text-[#888] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
