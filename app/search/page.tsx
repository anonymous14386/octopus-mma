import { getAllTechniqueSlugs, getTechnique } from "@/lib/content";
import type { Discipline } from "@/lib/types";
import SearchClient, { type SearchEntry } from "./SearchClient";

export const metadata = {
  title: "Search Techniques | MMA Reference",
  description: "Search across all martial arts techniques by name, Korean/Japanese name, type, or description.",
};

export default function SearchPage() {
  const slugs = getAllTechniqueSlugs();

  const entries: SearchEntry[] = slugs
    .map(({ discipline, beltLevel, slug }) => {
      const doc = getTechnique(discipline as Discipline, beltLevel, slug);
      if (!doc) return null;
      return {
        ...doc.frontmatter,
        discipline,
        beltLevel,
        slug,
      } satisfies SearchEntry;
    })
    .filter((e): e is SearchEntry => e !== null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Search Techniques</h1>
        <p className="text-brand-muted">
          Search by technique name, Korean or Japanese term, type, or description.
        </p>
      </div>

      <SearchClient entries={entries} />
    </div>
  );
}
