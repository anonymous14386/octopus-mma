import { notFound } from "next/navigation";
import Link from "next/link";
import { BELT_LEVELS, BELT_COLORS, DISCIPLINE_META, type Discipline } from "@/lib/types";
import { getTechniquesByDisciplineAndBelt } from "@/lib/content";

interface Props {
  params: { discipline: string };
}

export function generateStaticParams() {
  return Object.keys(BELT_LEVELS).map((discipline) => ({ discipline }));
}

export default function DisciplinePage({ params }: Props) {
  const discipline = params.discipline as Discipline;
  const meta = DISCIPLINE_META[discipline];
  if (!meta) notFound();

  const beltLevels = BELT_LEVELS[discipline];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-brand-border pb-8">
        <div className="flex items-center gap-2 text-sm text-brand-muted mb-3">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">{meta.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{meta.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{meta.label}</h1>
            <p className="text-brand-muted mt-1">Origin: {meta.origin}</p>
          </div>
        </div>
      </div>

      {/* Belt levels */}
      <div className="space-y-6">
        {beltLevels.map((beltLevel) => {
          const techniques = getTechniquesByDisciplineAndBelt(discipline, beltLevel);
          const badgeClass = BELT_COLORS[beltLevel] ?? "bg-brand-card text-white";
          const displayName = beltLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <section key={beltLevel}>
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href={`/${discipline}/${beltLevel}`}
                  className={`belt-badge ${badgeClass} hover:opacity-90 transition-opacity`}
                >
                  {displayName}
                </Link>
                {techniques.length > 0 && (
                  <span className="text-brand-muted text-xs">{techniques.length} technique{techniques.length !== 1 ? "s" : ""}</span>
                )}
              </div>

              {techniques.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {techniques.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${discipline}/${beltLevel}/${t.slug}`}
                      className="technique-card group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-white group-hover:text-brand-red-light transition-colors text-sm leading-tight">
                          {t.frontmatter.title}
                        </h3>
                        <span className="shrink-0 text-xs bg-white/5 text-brand-muted px-1.5 py-0.5 rounded capitalize">
                          {t.frontmatter.techniqueType}
                        </span>
                      </div>
                      {t.frontmatter.nativeName && (
                        <p className="text-xs text-brand-muted mb-1">
                          {t.frontmatter.nativeName}
                          {t.frontmatter.pronunciation && (
                            <span className="ml-1 italic">({t.frontmatter.pronunciation})</span>
                          )}
                        </p>
                      )}
                      <p className="text-brand-muted text-xs line-clamp-2">{t.frontmatter.summary}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-brand-muted text-sm italic border border-dashed border-brand-border rounded-lg p-4">
                  Content coming soon.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
