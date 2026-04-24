import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Discipline, TechniqueDoc, TechniqueFrontmatter } from "./types";
import type { PoseData } from "./poses";

const contentDir = path.join(process.cwd(), "content");

function parseFrontmatter(raw: Record<string, unknown>): TechniqueFrontmatter {
  return raw as unknown as TechniqueFrontmatter;
}

export function getTechniquesByDisciplineAndBelt(
  discipline: Discipline,
  beltLevel: string
): TechniqueDoc[] {
  const dir = path.join(contentDir, discipline, beltLevel);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        frontmatter: parseFrontmatter(data),
        content,
        slug: file.replace(/\.mdx?$/, ""),
      };
    })
    .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
}

export function getTechnique(
  discipline: Discipline,
  beltLevel: string,
  slug: string
): TechniqueDoc | null {
  const candidates = [
    path.join(contentDir, discipline, beltLevel, `${slug}.md`),
    path.join(contentDir, discipline, beltLevel, `${slug}.mdx`),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: parseFrontmatter(data), content, slug };
}

export function getPoses(
  discipline: Discipline,
  beltLevel: string,
  slug: string
): PoseData | null {
  const filePath = path.join(contentDir, discipline, beltLevel, `${slug}.poses.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as PoseData;
  } catch {
    return null;
  }
}

export function findTechniqueSlug(
  discipline: Discipline,
  slug: string
): { discipline: string; beltLevel: string; slug: string } | null {
  const disciplineDir = path.join(contentDir, discipline);
  if (!fs.existsSync(disciplineDir)) return null;
  for (const belt of fs.readdirSync(disciplineDir)) {
    const beltDir = path.join(disciplineDir, belt);
    if (!fs.statSync(beltDir).isDirectory()) continue;
    const candidates = [`${slug}.md`, `${slug}.mdx`];
    if (candidates.some((f) => fs.existsSync(path.join(beltDir, f)))) {
      return { discipline, beltLevel: belt, slug };
    }
  }
  return null;
}

export function getAllTechniqueSlugs(): {
  discipline: string;
  beltLevel: string;
  slug: string;
}[] {
  const results: { discipline: string; beltLevel: string; slug: string }[] = [];
  if (!fs.existsSync(contentDir)) return results;

  for (const discipline of fs.readdirSync(contentDir)) {
    const disciplineDir = path.join(contentDir, discipline);
    if (!fs.statSync(disciplineDir).isDirectory()) continue;
    for (const belt of fs.readdirSync(disciplineDir)) {
      const beltDir = path.join(disciplineDir, belt);
      if (!fs.statSync(beltDir).isDirectory()) continue;
      for (const file of fs.readdirSync(beltDir)) {
        if (file.endsWith(".md") || file.endsWith(".mdx")) {
          results.push({ discipline, beltLevel: belt, slug: file.replace(/\.mdx?$/, "") });
        }
      }
    }
  }
  return results;
}
