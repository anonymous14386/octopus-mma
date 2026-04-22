"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TechniqueFrontmatter } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchEntry extends TechniqueFrontmatter {
  discipline: string;
  beltLevel:  string;
  slug:       string;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function score(entry: SearchEntry, q: string): number {
  if (!q) return 1; // show everything when no query
  const lq = q.toLowerCase();
  let s = 0;

  const title = entry.title.toLowerCase();
  if (title === lq)              s += 10;
  else if (title.startsWith(lq)) s += 7;
  else if (title.includes(lq))   s += 5;

  const native = (entry.nativeName ?? "").toLowerCase();
  if (native.includes(lq)) s += 4;

  const summary = (entry.summary ?? "").toLowerCase();
  if (summary.includes(lq)) s += 2;

  if (entry.techniqueType?.toLowerCase().includes(lq)) s += 3;
  if (entry.discipline.toLowerCase().includes(lq))     s += 3;
  if (entry.beltLevel.toLowerCase().replace(/-/g, " ").includes(lq)) s += 2;

  const prereqs = (entry.prerequisites ?? []).join(" ").toLowerCase();
  if (prereqs.includes(lq)) s += 1;

  return s;
}

// ─── Belt colour pill ─────────────────────────────────────────────────────────

const BELT_PILLS: Record<string, string> = {
  "white-belt":  "bg-white/10 text-white",
  "yellow-belt": "bg-yellow-800/40 text-yellow-300",
  "orange-belt": "bg-orange-800/40 text-orange-300",
  "green-belt":  "bg-green-800/40 text-green-300",
  "blue-belt":   "bg-blue-800/40 text-blue-300",
  "purple-belt": "bg-purple-800/40 text-purple-300",
  "brown-belt":  "bg-yellow-900/40 text-yellow-500",
  "red-belt":    "bg-red-900/40 text-red-300",
  "black-belt":  "bg-white/5 text-white border border-white/20",
  "beginner":    "bg-white/10 text-white",
  "intermediate":"bg-blue-800/40 text-blue-300",
  "advanced":    "bg-white/5 text-white border border-white/20",
  "fundamentals":"bg-white/10 text-white",
  "practitioner":"bg-white/10 text-white",
};

function beltPill(belt: string) {
  return BELT_PILLS[belt] ?? "bg-white/10 text-white/70";
}

// ─── Type colours ─────────────────────────────────────────────────────────────

const TYPE_COLOURS: Record<string, string> = {
  kick:       "text-orange-400",
  punch:      "text-red-400",
  strike:     "text-red-400",
  block:      "text-blue-400",
  stance:     "text-emerald-400",
  throw:      "text-purple-400",
  sweep:      "text-purple-400",
  submission: "text-yellow-400",
  escape:     "text-cyan-400",
  form:       "text-pink-400",
};

function typeColour(t: string) {
  return TYPE_COLOURS[t] ?? "text-brand-muted";
}

// ─── Component ────────────────────────────────────────────────────────────────

const DISCIPLINE_LABELS: Record<string, string> = {
  taekwondo:  "Taekwondo",
  bjj:        "BJJ",
  karate:     "Karate",
  "tai-chi":  "Tai Chi",
  "muay-thai":"Muay Thai",
  boxing:     "Boxing",
  wrestling:  "Wrestling",
  judo:       "Judo",
  "kung-fu":  "Kung Fu",
  "krav-maga":"Krav Maga",
};

export default function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query,      setQuery]      = useState("");
  const [discipline, setDiscipline] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const disciplines  = useMemo(() => [...new Set(entries.map(e => e.discipline))].sort(), [entries]);
  const techniqueTypes = useMemo(() => [...new Set(entries.map(e => e.techniqueType))].sort(), [entries]);

  const results = useMemo(() => {
    const q = query.trim();

    return entries
      .filter(e => {
        if (discipline && e.discipline !== discipline) return false;
        if (typeFilter && e.techniqueType !== typeFilter) return false;
        return true;
      })
      .map(e => ({ entry: e, score: score(e, q) }))
      .filter(({ score: s }) => q ? s > 0 : true)
      .sort((a, b) => b.score - a.score)
      .map(({ entry }) => entry);
  }, [query, discipline, typeFilter, entries]);

  return (
    <div className="space-y-6">

      {/* ── Search bar ── */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search techniques, Korean names, Japanese names…"
          className="w-full bg-brand-card border border-brand-border rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-red/60 transition-colors text-sm"
          autoFocus
        />
      </div>

      {/* ── Filter chips ── */}
      <div className="flex flex-wrap gap-2">
        {/* Discipline filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setDiscipline("")}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              discipline === ""
                ? "bg-brand-red text-white"
                : "bg-brand-card border border-brand-border text-brand-muted hover:text-white"
            }`}
          >
            All
          </button>
          {disciplines.map(d => (
            <button
              key={d}
              onClick={() => setDiscipline(d === discipline ? "" : d)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                discipline === d
                  ? "bg-brand-red text-white"
                  : "bg-brand-card border border-brand-border text-brand-muted hover:text-white"
              }`}
            >
              {DISCIPLINE_LABELS[d] ?? d}
            </button>
          ))}
        </div>

        {/* Type filter */}
        {techniqueTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                typeFilter === ""
                  ? "bg-white/10 text-white"
                  : "bg-brand-card border border-brand-border text-brand-muted hover:text-white"
              }`}
            >
              All types
            </button>
            {techniqueTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t === typeFilter ? "" : t)}
                className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
                  typeFilter === t
                    ? "bg-white/10 text-white"
                    : "bg-brand-card border border-brand-border text-brand-muted hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      <p className="text-brand-muted text-sm">
        {results.length === entries.length
          ? `${results.length} techniques`
          : `${results.length} of ${entries.length} techniques`}
        {query && <span className="ml-1">matching &ldquo;<span className="text-white">{query}</span>&rdquo;</span>}
      </p>

      {/* ── Results grid ── */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-4xl mb-4">🥋</p>
          <p className="font-medium text-white">No results found</p>
          <p className="text-sm mt-1">Try a different search term or clear the filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map(e => (
            <Link
              key={`${e.discipline}/${e.beltLevel}/${e.slug}`}
              href={`/${e.discipline}/${e.beltLevel}/${e.slug}`}
              className="group bg-brand-card border border-brand-border hover:border-brand-red/40 rounded-xl p-4 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`text-xs font-medium capitalize ${typeColour(e.techniqueType)}`}>
                  {e.techniqueType}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${beltPill(e.beltLevel)}`}>
                  {e.beltLevel.replace(/-/g, " ")}
                </span>
              </div>

              <h3 className="font-bold text-white group-hover:text-brand-red-light transition-colors mb-0.5">
                {e.title}
              </h3>

              {e.nativeName && (
                <p className="text-xs text-brand-muted font-mono mb-2">
                  {e.nativeName}
                  {e.nativeScript && <span className="ml-1.5">{e.nativeScript}</span>}
                </p>
              )}

              <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                {e.summary}
              </p>

              <p className="text-[10px] text-brand-muted/60 mt-2 capitalize">
                {DISCIPLINE_LABELS[e.discipline] ?? e.discipline}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
