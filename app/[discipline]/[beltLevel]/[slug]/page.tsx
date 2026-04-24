import { notFound } from "next/navigation";
import Link from "next/link";
import { BELT_COLORS, DISCIPLINE_META, type Discipline } from "@/lib/types";
import { getTechnique, getAllTechniqueSlugs, getPoses, findTechniqueSlug } from "@/lib/content";
import DiagramViewer from "@/components/technique/DiagramViewer";
import DownloadCard from "@/components/technique/DownloadCard";

interface Props {
  params: { discipline: string; beltLevel: string; slug: string };
}

export function generateStaticParams() {
  return getAllTechniqueSlugs();
}

export default function TechniquePage({ params }: Props) {
  const discipline = params.discipline as Discipline;
  const { beltLevel, slug } = params;
  const meta = DISCIPLINE_META[discipline];
  if (!meta) notFound();

  const technique = getTechnique(discipline, beltLevel, slug);
  if (!technique) notFound();

  const poses = getPoses(discipline, beltLevel, slug);

  const { frontmatter, content } = technique;
  const badgeClass = BELT_COLORS[beltLevel] ?? "bg-brand-card text-white";
  const displayBelt = beltLevel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Parse the markdown content into sections for display
  const steps = parseSteps(content);
  const keyPoints = parseKeyPoints(content);
  const commonMistakes = parseCommonMistakes(content);
  const intro = parseIntro(content);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-brand-muted">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/${discipline}`} className="hover:text-white transition-colors">{meta.label}</Link>
        <span>/</span>
        <Link href={`/${discipline}/${beltLevel}`} className="hover:text-white transition-colors">{displayBelt}</Link>
        <span>/</span>
        <span className="text-white">{frontmatter.title}</span>
      </div>

      {/* Header */}
      <header className="border-b border-brand-border pb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`belt-badge ${badgeClass}`}>{displayBelt}</span>
          <span className="belt-badge bg-brand-card text-brand-muted capitalize">{frontmatter.techniqueType}</span>
          <span className={`belt-badge capitalize ${
            frontmatter.difficulty === "beginner" ? "bg-green-900/50 text-green-400" :
            frontmatter.difficulty === "intermediate" ? "bg-yellow-900/50 text-yellow-400" :
            "bg-red-900/50 text-red-400"
          }`}>
            {frontmatter.difficulty}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{frontmatter.title}</h1>
        {frontmatter.nativeName && (
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            {frontmatter.nativeScript && (
              <span className="text-2xl text-brand-gold">{frontmatter.nativeScript}</span>
            )}
            <span className="text-brand-muted italic">{frontmatter.nativeName}</span>
            {frontmatter.pronunciation && (
              <span className="text-brand-muted text-sm">· {frontmatter.pronunciation}</span>
            )}
          </div>
        )}
        <p className="text-brand-muted text-lg">{frontmatter.summary}</p>
      </header>

      {/* Target areas */}
      {frontmatter.targetArea && frontmatter.targetArea.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-2">Target Areas</h2>
          <div className="flex flex-wrap gap-2">
            {frontmatter.targetArea.map((area) => (
              <span key={area} className="px-3 py-1 bg-brand-red/10 border border-brand-red/30 text-brand-red-light rounded-full text-sm capitalize">
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Prerequisites */}
      {frontmatter.prerequisites && frontmatter.prerequisites.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-2">Prerequisites</h2>
          <div className="flex flex-wrap gap-2">
            {frontmatter.prerequisites.map((prereq) => {
              const found = findTechniqueSlug(discipline, prereq);
              const label = prereq.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return found ? (
                <Link
                  key={prereq}
                  href={`/${found.discipline}/${found.beltLevel}/${found.slug}`}
                  className="px-3 py-1 bg-brand-card border border-brand-border text-brand-muted rounded text-sm hover:text-white hover:border-white transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <span key={prereq} className="px-3 py-1 bg-brand-card border border-brand-border text-brand-muted rounded text-sm">
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Diagram / animation */}
      {poses ? (
        <section className="space-y-4">
          <DiagramViewer poses={poses} />
          <DownloadCard frontmatter={frontmatter} poses={poses} />
        </section>
      ) : (
        <section className="border border-dashed border-brand-border rounded-xl p-8 text-center bg-brand-card/50">
          <div className="text-brand-muted text-4xl mb-3">📐</div>
          <p className="text-brand-muted text-sm">Animation coming soon</p>
        </section>
      )}

      {/* Introduction */}
      {intro && (
        <section>
          <p className="text-foreground leading-relaxed">{intro}</p>
        </section>
      )}

      {/* Step-by-step */}
      {steps.length > 0 && (
        <section>
          <h2 className="section-heading">How to Perform</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="step-number">{i + 1}</span>
                <p className="text-foreground leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Key points */}
      {keyPoints.length > 0 && (
        <section>
          <h2 className="section-heading">Key Points</h2>
          <ul className="space-y-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-foreground">
                <span className="text-brand-red mt-1 shrink-0">▸</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Common mistakes */}
      {commonMistakes.length > 0 && (
        <section>
          <h2 className="section-heading">Common Mistakes</h2>
          <ul className="space-y-2">
            {commonMistakes.map((mistake, i) => (
              <li key={i} className="flex gap-3 text-foreground">
                <span className="text-yellow-500 mt-1 shrink-0">⚠</span>
                <span className="leading-relaxed">{mistake}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related techniques */}
      {frontmatter.relatedTechniques && frontmatter.relatedTechniques.length > 0 && (
        <section className="border-t border-brand-border pt-8">
          <h2 className="section-heading">Related Techniques</h2>
          <div className="flex flex-wrap gap-2">
            {frontmatter.relatedTechniques.map((rel) => {
              const found = findTechniqueSlug(discipline, rel);
              const label = rel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return found ? (
                <Link
                  key={rel}
                  href={`/${found.discipline}/${found.beltLevel}/${found.slug}`}
                  className="px-3 py-1.5 bg-brand-card border border-brand-border text-brand-muted rounded text-sm hover:text-white hover:border-white transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <span key={rel} className="px-3 py-1.5 bg-brand-card border border-brand-border text-brand-muted rounded text-sm">
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Review info */}
      {frontmatter.reviewedBy && (
        <footer className="border-t border-brand-border pt-6 text-xs text-brand-muted">
          Reviewed by {frontmatter.reviewedBy}
          {frontmatter.lastReviewed && <> · Last updated {frontmatter.lastReviewed}</>}
        </footer>
      )}
    </div>
  );
}

// --- Simple markdown section parsers ---

function parseIntro(md: string): string {
  const lines = md.split("\n");
  const intro: string[] = [];
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("##")) break;
    if (line.startsWith("-") || line.startsWith("*") || line.match(/^\d+\./)) break;
    if (line.trim()) intro.push(line.trim());
  }
  return intro.join(" ");
}

function parseSectionList(md: string, heading: string): string[] {
  const regex = new RegExp(`##\\s+${heading}[\\s\\S]*?(?=##|$)`, "i");
  const match = md.match(regex);
  if (!match) return [];
  return match[0]
    .split("\n")
    .slice(1)
    .filter((l) => l.trim().match(/^[-*•]|\d+\./))
    .map((l) => l.replace(/^[-*•\d.]+\s*/, "").trim())
    .filter(Boolean);
}

function parseSteps(md: string): string[] {
  return parseSectionList(md, "Steps|How to Perform|Execution");
}

function parseKeyPoints(md: string): string[] {
  return parseSectionList(md, "Key Points|Tips|Coaching Points");
}

function parseCommonMistakes(md: string): string[] {
  return parseSectionList(md, "Common Mistakes|Mistakes|Errors");
}
