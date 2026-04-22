import { notFound } from "next/navigation";
import Link from "next/link";
import { BELT_LEVELS, BELT_COLORS, DISCIPLINE_META, type Discipline } from "@/lib/types";
import { getTechniquesByDisciplineAndBelt } from "@/lib/content";

interface Props {
  params: { discipline: string; beltLevel: string };
}

export function generateStaticParams() {
  return Object.entries(BELT_LEVELS).flatMap(([discipline, belts]) =>
    belts.map((beltLevel) => ({ discipline, beltLevel }))
  );
}

export default function BeltLevelPage({ params }: Props) {
  const discipline = params.discipline as Discipline;
  const { beltLevel } = params;
  const meta = DISCIPLINE_META[discipline];
  if (!meta) notFound();
  if (!BELT_LEVELS[discipline]?.includes(beltLevel)) notFound();

  const techniques = getTechniquesByDisciplineAndBelt(discipline, beltLevel);
  const badgeClass = BELT_COLORS[beltLevel] ?? "bg-brand-card text-white";
  const displayBelt = beltLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const byType = techniques.reduce<Record<string, typeof techniques>>((acc, t) => {
    const key = t.frontmatter.techniqueType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {/* Breadcrumb + header */}
      <div className="border-b border-brand-border pb-8">
        <div className="flex items-center gap-2 text-sm text-brand-muted mb-3">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/${discipline}`} className="hover:text-white transition-colors">{meta.label}</Link>
          <span>/</span>
          <span className="text-white">{displayBelt}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`belt-badge text-base px-4 py-2 ${badgeClass}`}>{displayBelt}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{meta.label} — {displayBelt}</h1>
            <p className="text-brand-muted text-sm mt-1">{techniques.length} technique{techniques.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Grouped by type */}
      {Object.keys(byType).length === 0 ? (
        <p className="text-brand-muted italic border border-dashed border-brand-border rounded-lg p-8 text-center">
          Content for this level is coming soon.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(byType).map(([type, items]) => (
            <section key={type}>
              <h2 className="text-lg font-semibold text-white mb-3 capitalize">{type}s</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${discipline}/${beltLevel}/${t.slug}`}
                    className="technique-card group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-brand-red-light transition-colors mb-1">
                      {t.frontmatter.title}
                    </h3>
                    {t.frontmatter.nativeName && (
                      <p className="text-xs text-brand-muted mb-2">
                        {t.frontmatter.nativeName}
                        {t.frontmatter.pronunciation && (
                          <span className="ml-1 italic">({t.frontmatter.pronunciation})</span>
                        )}
                      </p>
                    )}
                    <p className="text-brand-muted text-sm line-clamp-3">{t.frontmatter.summary}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        t.frontmatter.difficulty === "beginner" ? "bg-green-900/50 text-green-400" :
                        t.frontmatter.difficulty === "intermediate" ? "bg-yellow-900/50 text-yellow-400" :
                        "bg-red-900/50 text-red-400"
                      }`}>
                        {t.frontmatter.difficulty}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
