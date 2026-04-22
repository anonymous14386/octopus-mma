import Link from "next/link";

const disciplines = [
  {
    slug: "taekwondo",
    label: "Taekwondo",
    origin: "Korea",
    description: "Olympic striking art known for fast, high kicks and dynamic footwork.",
    belts: ["White", "Yellow", "Green", "Blue", "Red", "Black"],
    color: "from-blue-900/30 to-brand-card",
    accent: "text-blue-400",
    icon: "🥋",
  },
  {
    slug: "bjj",
    label: "Brazilian Jiu-Jitsu",
    origin: "Brazil / Japan",
    description: "Ground-based grappling system focused on submissions and positional control.",
    belts: ["White", "Blue", "Purple", "Brown", "Black"],
    color: "from-blue-950/40 to-brand-card",
    accent: "text-blue-300",
    icon: "🤼",
  },
  {
    slug: "karate",
    label: "Karate",
    origin: "Japan / Okinawa",
    description: "Traditional striking art emphasizing kata, kihon, and kumite.",
    belts: ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black"],
    color: "from-red-950/30 to-brand-card",
    accent: "text-red-400",
    icon: "✊",
  },
  {
    slug: "tai-chi",
    label: "Tai Chi",
    origin: "China",
    description: "Internal martial art practiced for health, meditation, and self-defense.",
    belts: ["Yang 24-Form", "Yang 108-Form", "Chen Style", "Wu Style"],
    color: "from-emerald-950/30 to-brand-card",
    accent: "text-emerald-400",
    icon: "☯",
  },
  {
    slug: "muay-thai",
    label: "Muay Thai",
    origin: "Thailand",
    description: "The Art of Eight Limbs — fists, elbows, knees, and kicks.",
    belts: ["Beginner", "Intermediate", "Advanced"],
    color: "from-orange-950/30 to-brand-card",
    accent: "text-orange-400",
    icon: "🥊",
  },
  {
    slug: "boxing",
    label: "Boxing",
    origin: "Global",
    description: "Pure hand-striking sport with advanced footwork and defensive systems.",
    belts: ["Fundamentals", "Intermediate", "Advanced"],
    color: "from-yellow-950/30 to-brand-card",
    accent: "text-yellow-400",
    icon: "🥊",
  },
  {
    slug: "wrestling",
    label: "Wrestling",
    origin: "Global",
    description: "Takedown-based grappling art — foundation of MMA ground control.",
    belts: ["Fundamentals", "Intermediate", "Advanced"],
    color: "from-stone-800/30 to-brand-card",
    accent: "text-stone-300",
    icon: "💪",
  },
  {
    slug: "judo",
    label: "Judo",
    origin: "Japan",
    description: "Throwing and pinning art — the gentle way of maximum efficiency.",
    belts: ["White", "Yellow", "Orange", "Green", "Blue", "Brown", "Black"],
    color: "from-indigo-950/30 to-brand-card",
    accent: "text-indigo-400",
    icon: "🎽",
  },
  {
    slug: "kung-fu",
    label: "Kung Fu",
    origin: "China",
    description: "Chinese martial arts encompassing Wing Chun, Shaolin, and the five animal styles.",
    belts: ["Foundation", "Intermediate", "Advanced"],
    color: "from-rose-950/30 to-brand-card",
    accent: "text-rose-400",
    icon: "🐉",
  },
  {
    slug: "krav-maga",
    label: "Krav Maga",
    origin: "Israel",
    description: "Reality-based self-defense system developed for real-world threats.",
    belts: ["Practitioner", "Graduate", "Expert"],
    color: "from-slate-800/30 to-brand-card",
    accent: "text-slate-300",
    icon: "🛡",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 border-b border-brand-border">
        <p className="text-brand-red text-sm font-semibold uppercase tracking-widest mb-3">
          OctopusTechnology.net
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Martial Arts Reference
        </h1>
        <p className="text-brand-muted text-lg max-w-2xl mx-auto">
          Complete belt-level curriculum for 10 disciplines — techniques, diagrams, kata, and forms.
          Built for practitioners, by practitioners.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/taekwondo"
            className="px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Start with Taekwondo
          </Link>
          <Link
            href="/search"
            className="px-5 py-2.5 border border-brand-border hover:border-white/30 text-brand-muted hover:text-white rounded-lg transition-colors text-sm"
          >
            Search Techniques
          </Link>
        </div>
      </section>

      {/* Discipline grid */}
      <section>
        <h2 className="section-heading">Disciplines</h2>
        <p className="section-subheading">Select a martial art to browse its full curriculum</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplines.map((d) => (
            <Link
              key={d.slug}
              href={`/${d.slug}`}
              className={`group bg-gradient-to-br ${d.color} border border-brand-border hover:border-brand-red/40 rounded-xl p-5 transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{d.icon}</span>
                <span className="text-xs text-brand-muted bg-white/5 px-2 py-0.5 rounded">{d.origin}</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-1 group-hover:text-brand-red-light transition-colors">
                {d.label}
              </h3>
              <p className="text-brand-muted text-sm mb-4 line-clamp-2">{d.description}</p>
              <div className="flex flex-wrap gap-1">
                {d.belts.map((b) => (
                  <span key={b} className="text-xs bg-white/5 text-brand-muted px-2 py-0.5 rounded">
                    {b}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-brand-border pt-8">
        {[
          { label: "Disciplines", value: "10" },
          { label: "Techniques", value: "500+" },
          { label: "Belt Levels", value: "60+" },
          { label: "Diagrams", value: "Coming" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-brand-red">{s.value}</div>
            <div className="text-brand-muted text-sm">{s.label}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
