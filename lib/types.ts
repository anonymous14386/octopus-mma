export type Discipline =
  | "taekwondo"
  | "bjj"
  | "karate"
  | "tai-chi"
  | "muay-thai"
  | "boxing"
  | "wrestling"
  | "judo"
  | "kung-fu"
  | "krav-maga";

export type TechniqueType =
  | "kick"
  | "punch"
  | "strike"
  | "block"
  | "stance"
  | "throw"
  | "sweep"
  | "submission"
  | "escape"
  | "form"
  | "combination"
  | "defense"
  | "footwork"
  | "other";

export interface TechniqueFrontmatter {
  title: string;
  slug: string;
  discipline: Discipline;
  beltLevel: string;
  techniqueType: TechniqueType;
  targetArea?: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites?: string[];
  nativeName?: string;
  nativeScript?: string;
  pronunciation?: string;
  language?: string;
  relatedTechniques?: string[];
  diagramCount?: number;
  lastReviewed?: string;
  reviewedBy?: string;
  summary: string;
}

export interface TechniqueDoc {
  frontmatter: TechniqueFrontmatter;
  content: string;
  slug: string;
}

export const BELT_LEVELS: Record<Discipline, string[]> = {
  taekwondo: ["white-belt", "yellow-belt", "green-belt", "blue-belt", "red-belt", "black-belt"],
  bjj: ["white-belt", "blue-belt", "purple-belt", "brown-belt", "black-belt"],
  karate: ["white-belt", "yellow-belt", "orange-belt", "green-belt", "blue-belt", "purple-belt", "brown-belt", "black-belt"],
  "tai-chi": ["yang-style", "chen-style", "wu-style", "24-form"],
  "muay-thai": ["beginner", "intermediate", "advanced"],
  boxing: ["fundamentals", "intermediate", "advanced"],
  wrestling: ["fundamentals", "intermediate", "advanced"],
  judo: ["white-belt", "yellow-belt", "orange-belt", "green-belt", "blue-belt", "brown-belt", "black-belt"],
  "kung-fu": ["foundation", "intermediate", "advanced"],
  "krav-maga": ["practitioner", "graduate", "expert"],
};

export const BELT_COLORS: Record<string, string> = {
  "white-belt": "bg-belt-white text-black",
  "yellow-belt": "bg-belt-yellow text-black",
  "orange-belt": "bg-belt-orange text-white",
  "green-belt": "bg-belt-green text-white",
  "blue-belt": "bg-belt-blue text-white",
  "purple-belt": "bg-belt-purple text-white",
  "brown-belt": "bg-belt-brown text-white",
  "red-belt": "bg-belt-red text-white",
  "black-belt": "bg-belt-black text-white border border-brand-border",
  "beginner": "bg-belt-white text-black",
  "intermediate": "bg-belt-blue text-white",
  "advanced": "bg-belt-black text-white border border-brand-border",
  "fundamentals": "bg-belt-white text-black",
  "practitioner": "bg-belt-white text-black",
  "graduate": "bg-belt-blue text-white",
  "expert": "bg-belt-black text-white border border-brand-border",
  "foundation": "bg-belt-white text-black",
  "yang-style": "bg-emerald-700 text-white",
  "chen-style": "bg-emerald-900 text-white",
  "wu-style": "bg-teal-800 text-white",
  "24-form": "bg-teal-700 text-white",
};

export const DISCIPLINE_META: Record<Discipline, { label: string; origin: string; icon: string }> = {
  taekwondo: { label: "Taekwondo", origin: "Korea", icon: "🥋" },
  bjj: { label: "Brazilian Jiu-Jitsu", origin: "Brazil", icon: "🤼" },
  karate: { label: "Karate", origin: "Japan", icon: "✊" },
  "tai-chi": { label: "Tai Chi", origin: "China", icon: "☯" },
  "muay-thai": { label: "Muay Thai", origin: "Thailand", icon: "🥊" },
  boxing: { label: "Boxing", origin: "Global", icon: "🥊" },
  wrestling: { label: "Wrestling", origin: "Global", icon: "💪" },
  judo: { label: "Judo", origin: "Japan", icon: "🎽" },
  "kung-fu": { label: "Kung Fu", origin: "China", icon: "🐉" },
  "krav-maga": { label: "Krav Maga", origin: "Israel", icon: "🛡" },
};
