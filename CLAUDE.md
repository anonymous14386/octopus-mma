# octopus-mma — Claude Handoff

## What this is
A martial arts reference site at `mma.octopustechnology.net`. Next.js 14 (App Router, TypeScript, Tailwind), deployed via Docker on the existing `web_proxy` network, proxied through Nginx Proxy Manager.

## Current state
The foundation is complete and deployed:
- Dark martial arts theme, 10 discipline routes
- File-based content from `content/<discipline>/<belt>/` — markdown with frontmatter for technique pages
- SVG stick figure animation system — `lib/poses.ts`, `components/technique/StickFigure.tsx`, `components/technique/usePoseAnimation.ts`, `components/technique/DiagramViewer.tsx`
- 3 sample techniques live (TKD white belt): `front-kick`, `low-block`, `walking-stance`
- `front-kick.poses.json` is the reference for how to author animations

## What to work on next

### Priority 1 — Content
Write MDX files for all remaining techniques per the project plan. Start with:
1. TKD white belt remainder (straight-punch, high-block, middle-block, attention-stance, ready-stance, fighting-stance)
2. TKD yellow → black belt (full curriculum in the plan)
3. BJJ white belt
4. Karate white belt

Each technique needs:
- A `.md` file in `content/<discipline>/<belt>/<slug>.md` with frontmatter matching `TechniqueFrontmatter` in `lib/types.ts`
- Optionally a `.poses.json` alongside it for animation (see `front-kick.poses.json` as the template)

### Priority 2 — Pose animations
Add `.poses.json` files for each technique. The format is defined in `lib/poses.ts`.

Key conventions:
- `viewBox="0 0 100 110"` coordinate space
- `nearSide="L"` (default) = figure faces RIGHT — L joints are bright warm (`#d4cfc8`), R joints are dark cool (`#3c3c52`)
- `nearSide="R"` = figure faces LEFT (used for partner/opponent figure)
- `highlight` array in a frame colours those joints red — use for striking limb at point of contact
- 5-frame pattern works well for strikes: Stance → Chamber → Extension (highlight) → Retract → Return

### Priority 3 — Pose editor UI
A drag-to-edit pose authoring tool would massively speed up creating pose JSON files. Rough spec:
- Route: `/tools/pose-editor`
- Live `StickFigure` preview in the centre
- Drag joint dots to reposition them
- JSON output panel that updates in real time (copy-paste into `.poses.json`)
- Load existing pose file for editing
- "Add frame / duplicate frame" controls

### Priority 4 — Search
`app/search/page.tsx` exists as a route but has no content yet. Needs a client-side search across all technique frontmatter using Fuse.js.

## File map (key files)

```
app/
  page.tsx                          ← home, discipline grid
  [discipline]/page.tsx             ← discipline landing, all belt levels
  [discipline]/[beltLevel]/page.tsx ← belt level, techniques grouped by type
  [discipline]/[beltLevel]/[slug]/page.tsx ← technique detail + DiagramViewer

components/technique/
  StickFigure.tsx       ← SVG renderer; nearSide prop controls depth/facing
  usePoseAnimation.ts   ← RAF loop, lerp, easing, play/pause/step/speed
  DiagramViewer.tsx     ← player UI (frame dots, prev/next, speed buttons)

lib/
  types.ts    ← TechniqueFrontmatter, Discipline, BELT_LEVELS, BELT_COLORS
  poses.ts    ← JointSet, PoseFrame, PoseData, NEUTRAL_STANCE
  content.ts  ← getTechnique(), getTechniquesByDisciplineAndBelt(), getPoses()

content/
  taekwondo/white-belt/
    front-kick.md          ← reference technique file
    front-kick.poses.json  ← reference pose animation file
    low-block.md
    walking-stance.md
```

## Deploy
Push to GitHub → Portainer pulls and rebuilds the `octopus_mma` container automatically (or manually redeploy the stack).
