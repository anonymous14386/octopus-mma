"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const disciplines = [
  { slug: "taekwondo", label: "Taekwondo", short: "TKD" },
  { slug: "bjj", label: "Brazilian Jiu-Jitsu", short: "BJJ" },
  { slug: "karate", label: "Karate", short: "Karate" },
  { slug: "tai-chi", label: "Tai Chi", short: "Tai Chi" },
  { slug: "muay-thai", label: "Muay Thai", short: "Muay Thai" },
  { slug: "boxing", label: "Boxing", short: "Boxing" },
  { slug: "wrestling", label: "Wrestling", short: "Wrestling" },
  { slug: "judo", label: "Judo", short: "Judo" },
  { slug: "kung-fu", label: "Kung Fu", short: "Kung Fu" },
  { slug: "krav-maga", label: "Krav Maga", short: "Krav Maga" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-surface/95 backdrop-blur border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg shrink-0">
            <span className="text-brand-red">MMA</span>
            <span className="text-brand-muted font-normal text-sm hidden sm:inline">Reference</span>
          </Link>

          {/* Desktop discipline nav */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {disciplines.map((d) => {
              const active = pathname?.startsWith(`/${d.slug}`);
              return (
                <Link
                  key={d.slug}
                  href={`/${d.slug}`}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-brand-red/20 text-brand-red-light"
                      : "text-brand-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  {d.short}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="text-brand-muted hover:text-white transition-colors p-2 rounded"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-brand-muted hover:text-white p-2 rounded"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-brand-border bg-brand-surface">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-1">
            {disciplines.map((d) => {
              const active = pathname?.startsWith(`/${d.slug}`);
              return (
                <Link
                  key={d.slug}
                  href={`/${d.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-red/20 text-brand-red-light"
                      : "text-brand-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  {d.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
