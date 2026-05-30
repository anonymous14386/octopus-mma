# octopus-mma Animation Master Plan

Everything that needs a `.poses.json` file + Blender pose asset + muscle highlights.
Organized by priority: what octopus-health needs first, then MMA depth.

---

## FORMAT REFERENCE

Each `.poses.json` has frames with these joints:
`head, neck, spine, shoulderL/R, elbowL/R, handL/R, hipL/R, kneeL/R, footL/R`

Each frame can have `"highlight": ["jointName", ...]` for the 2D stick-figure glow.
Blender pose assets carry `hl_color_1..6` custom props for the écorché muscle highlight.

Coordinates: percentage of canvas (0–100), origin top-left.
Orthodox stance = right-handed fighter facing right (footL=front).

---

## BLENDER STATUS (as of 2026-05-30)

**File:** `~/Documents/Octopus MMA/mmaCurrent5-13-bak.blend`
**Model:** `male_ecorche` — imported, rig connected, texture NOT applied (pink = no texture)
**Highlight system:** `Ecorche_Highlight` material exists with 6 color slots, drivers on rig props `hl_color_1..6`
**Script:** `~/blender-scripts/setup_highlights.py` — idempotent, safe to re-run

### IMMEDIATE BLENDER TASKS (do before animating more)

**Task 1 — Reapply texture:**
1. Select `male_ecorche` mesh
2. Open Shader Editor
3. Find `Ecorche_Highlight` material → find the `ShaderNodeTexImage` node
4. If image slot is empty: click the image dropdown → navigate to:
   `~/Documents/Octopus MMA/Ecorche_Musclenames_Female_and_Male_Anatomy(1)/diffuse.jpeg`
5. Switch viewport to Material Preview (3rd sphere icon) — should show the labeled anatomy texture

**Task 2 — Verify highlight system:**
1. Select `rig` → N-panel → Item → Custom Properties
2. Drag `hl_color_1` to a bright hot-pink (not black)
3. In Material Preview, some region of the écorché should turn red
4. If nothing turns red: run `~/blender-scripts/setup_highlights.py` in the Scripting workspace
5. TOLERANCE may need raising to 0.15+ (texture has shading variation per region)

**Task 3 — Muscle color sampling (MUSCLE_COLORS dict):**
The texture uses ~8 hue families. Sample each with the eyedropper in Blender's color picker.
Known families from handoff:
- Salmon-pink: PM (pectoralis major), D (deltoid), LD (latissimus dorsi), GMa (gluteus maximus), Tr (trapezius)
- Hot magenta: RA (rectus abdominis)
- Dark purple: EO (external oblique)
- Blue: BB (biceps brachii), VL (vastus lateralis), S (sartorius)
- Green: RF (rectus femoris), VM (vastus medialis), TFL (tensor fasciae latae), GMe (gluteus medius)
- Lavender: BF (biceps femoris), Ga (gastrocnemius), AM (adductor magnus)
- Yellow-sand: bones

---

## MUSCLE GROUP MAP (for hl_color slots → pose highlights)

Use 6 slots as logical groups, not per-muscle. Assign per-pose based on primary movers.

| Slot | Group | Key muscles | Texture color family |
|------|-------|-------------|----------------------|
| hl_color_1 | Push / Chest+Shoulder | PM, D (anterior), Tr (upper) | salmon-pink |
| hl_color_2 | Pull / Back | LD, Tr (mid-lower), rhomboids | salmon-pink (LD section) |
| hl_color_3 | Core / Abs | RA, EO, IO | hot magenta + dark purple |
| hl_color_4 | Hip / Glutes | GMa, GMe, TFL | salmon-pink + green |
| hl_color_5 | Legs | RF, VM, VL, BF, Ga, S, AM | blue + green + lavender |
| hl_color_6 | Arms | BB, TB (triceps brachii), BR (brachioradialis) | blue + (sample triceps) |

---

## ANIMATION BACKLOG

### STATUS KEY
- ✅ Done (poses.json exists)
- 🔲 Needs poses.json
- 🎯 Priority (needed for octopus-health daily workout integration)

---

## 1. STANCES / FOOTWORK

| File | Status | Notes |
|------|--------|-------|
| `orthodox-stance` | ✅ | exists in boxing |
| `southpaw-stance` | 🔲 | mirror of orthodox |
| `muay-thai-stance` | 🔲 | hands higher, weight more even |
| `wrestling-stance` | 🔲 | lower, wider, head down |
| `bjj-base` | 🔲 | open guard base position |
| `kick-guard` | 🔲 | high guard variant |

---

## 2. BOXING

All in `content/boxing/fundamentals/` — currently have: jab ✅, cross ✅, hook ✅, uppercut ✅, slip ✅, bob-and-weave ✅, orthodox-stance ✅

| File | Status | Primary muscles |
|------|--------|-----------------|
| `overhand` | 🔲 | PM, D, Tr, RA, EO |
| `lead-uppercut` | 🔲 | BB, D, RA |
| `body-jab` | 🔲 | PM, D, EO |
| `body-cross` | 🔲 | PM, D, RA, EO, GMa |
| `lead-hook-body` | 🔲 | EO, PM, D |
| `rear-hook-body` | 🔲 | EO, RA, D |
| `jab-cross-hook` | 🔲 | combo — all upper |
| `jab-cross-body` | 🔲 | combo |
| `double-jab` | 🔲 | PM, D |
| `pull-counter` | 🔲 | slip + cross |
| `pivot` | 🔲 | footwork — legs + core |
| `step-jab` | 🔲 | footwork + jab |

---

## 3. MUAY THAI

`content/muay-thai/fundamentals/` — directory doesn't exist yet, create it.

| File | Status | Primary muscles |
|------|--------|-----------------|
| `muay-thai-stance` | 🔲 | base |
| `teep-front` | 🔲 | RF, VM, VL, IP (iliopsoas), RA |
| `teep-rear` | 🔲 | same, rear leg |
| `roundhouse-lead` | 🔲 | GMa, GMe, TFL, RF, EO |
| `roundhouse-rear` | 🔲 | same, more hip rotation |
| `high-kick-lead` | 🔲 | RF, AM, adductors, EO |
| `high-kick-rear` | 🔲 | same |
| `low-kick-lead` | 🔲 | VL, BF, TFL |
| `low-kick-rear` | 🔲 | VL, BF, GMa |
| `switch-kick` | 🔲 | footwork + roundhouse |
| `lead-knee` | 🔲 | IP, RF, GMa, RA |
| `rear-knee` | 🔲 | same |
| `flying-knee` | 🔲 | explosive — full body |
| `lead-elbow` | 🔲 | D, Tr, BB |
| `rear-elbow` | 🔲 | same + rotation |
| `spinning-back-elbow` | 🔲 | EO, D, Tr |
| `horizontal-elbow` | 🔲 | D, Tr |
| `diagonal-elbow` | 🔲 | D, PM, Tr |
| `thai-clinch` | 🔲 | pull-down — LD, Tr |
| `knee-from-clinch` | 🔲 | IP, RF, GMa |
| `push-kick-defense` | 🔲 | cover + teep |

---

## 4. BJJ (existing: armbar ✅, guard ✅, mount ✅, side-control ✅, triangle-choke ✅)

`content/bjj/white-belt/` + add `blue-belt/`, `purple-belt/`

### White belt additions
| File | Status | Notes |
|------|--------|-------|
| `rear-naked-choke` | 🔲 | from back — LD, BB |
| `guillotine` | 🔲 | LD, BB, Tr |
| `kimura` | 🔲 | shoulder lock — D, Tr |
| `americana` | 🔲 | shoulder lock |
| `sweep-scissor` | 🔲 | RA, EO, hip flexors |
| `hip-escape` | 🔲 | bridge + shrimp |
| `shrimp` | 🔲 | EO, RA, GMe |
| `bridge` | 🔲 | GMa, LD, Tr |
| `double-leg-takedown` | 🔲 | explosive — full body |
| `single-leg-takedown` | 🔲 | |
| `guard-pass-toreando` | 🔲 | |
| `guard-pass-knee-slice` | 🔲 | |

### Blue belt
| File | Status |
|------|--------|
| `spider-guard` | 🔲 |
| `lasso-guard` | 🔲 |
| `x-guard` | 🔲 |
| `de-la-riva` | 🔲 |
| `kneebar` | 🔲 |
| `heel-hook` | 🔲 |
| `omoplata` | 🔲 |
| `gogoplata` | 🔲 |
| `berimbolo` | 🔲 |

---

## 5. WRESTLING

`content/wrestling/fundamentals/` — create directory

| File | Status | Notes |
|------|--------|-------|
| `wrestling-stance` | 🔲 | |
| `double-leg` | 🔲 | explosive |
| `single-leg` | 🔲 | |
| `high-crotch` | 🔲 | |
| `body-lock` | 🔲 | |
| `suplex-grip` | 🔲 | |
| `sprawl` | 🔲 | |
| `front-headlock` | 🔲 | |
| `duck-under` | 🔲 | |
| `trip` | 🔲 | |

---

## 6. KARATE (existing: age-uke ✅, gedan-barai ✅, gyaku-zuki ✅, oi-zuki ✅, zenkutsu-dachi ✅)

### White belt additions
| File | Status |
|------|--------|
| `mawashi-geri` | 🔲 | roundhouse kick |
| `yoko-geri` | 🔲 | side kick |
| `ushiro-geri` | 🔲 | back kick |
| `mae-geri` | 🔲 | front kick |
| `uraken` | 🔲 | backfist |
| `shuto` | 🔲 | knife hand |
| `soto-uke` | 🔲 | outside block |
| `uchi-uke` | 🔲 | inside block |
| `kokutsu-dachi` | 🔲 | back stance |
| `kiba-dachi` | 🔲 | horse stance |

---

## 7. TAEKWONDO (existing: white + yellow belt ✅)

### Orange belt additions
| File | Status |
|------|--------|
| `back-kick` | 🔲 | |
| `spinning-hook-kick` | 🔲 | |
| `axe-kick` | 🔲 | |
| `crescent-kick` | 🔲 | |
| `jump-front-kick` | 🔲 | |

---

## 8. 🎯 STRETCHES (octopus-health integration — HIGH PRIORITY)

`content/stretching/` — create directory. These feed the daily workout DM.

### Upper body / shoulders / chest
| File | Primary muscles stretched |
|------|--------------------------|
| `chest-doorway-stretch` | PM, D (anterior), pec minor |
| `cross-body-shoulder` | D (posterior), Tr |
| `overhead-tricep-stretch` | TB, LD |
| `doorway-bicep-stretch` | BB, D (anterior) |
| `neck-lateral-tilt` | SCM, scalenes, Tr (upper) |
| `neck-rotation` | SCM, Tr |
| `eagle-arms` | Tr (mid), rhomboids, D (posterior) |
| `thread-needle` | Tr, Rh, D (posterior) |

### Core / spine / back
| File | Primary muscles |
|------|----------------|
| `cat-cow` | erector spinae, RA, EO |
| `childs-pose` | LD, Tr, erectors |
| `seated-spinal-twist` | EO, IO, rotators |
| `standing-side-bend` | EO, IO, QL |
| `cobra-pose` | RA, EO, hip flexors |
| `sphinx-pose` | RA |
| `supine-twist` | EO, glutes, TFL |

### Hips / glutes / groin
| File | Primary muscles |
|------|----------------|
| `pigeon-pose` | GMa, GMe, TFL, piriformis |
| `hip-flexor-lunge` | IP, RF |
| `figure-four-stretch` | piriformis, GMa |
| `lizard-pose` | IP, adductors, hip capsule |
| `frog-pose` | adductors, AM, groin |
| `butterfly-stretch` | adductors, AM, gracilis |
| `seated-groin` | adductors |
| `cossack-squat-hold` | adductors, VL, hip capsule |
| `deep-squat-hold` | full lower chain + ankle |

### Hamstrings / legs
| File | Primary muscles |
|------|----------------|
| `standing-hamstring` | BF, SM, ST |
| `seated-forward-fold` | BF, SM, ST, Ga |
| `supine-hamstring-strap` | BF, SM |
| `standing-quad-pull` | RF, VM, VL |
| `runner-lunge-quad` | RF, IP |
| `calf-wall-stretch` | Ga, So (soleus) |
| `downward-facing-dog` | BF, Ga, So, LD |
| `worlds-greatest-stretch` | full-body compound |

### MMA-specific mobility
| File | Notes |
|------|-------|
| `hip-car-standing` | hip controlled articular rotation |
| `shoulder-car` | shoulder CAR |
| `hip-90-90` | external + internal rotation |
| `scapular-pushup` | serratus anterior |
| `band-dislocates` | shoulder mobility |
| `pancake-stretch` | groin + hamstrings — for guard |
| `grappler-hip-circle` | BJJ hip prep |

---

## 9. 🎯 EXERCISES (octopus-health integration — HIGH PRIORITY)

`content/exercises/` — create directory

### Push pattern
| File | Notes |
|------|-------|
| `push-up` | PM, D (ant), TB |
| `push-up-wide` | outer PM |
| `push-up-diamond` | TB |
| `pike-push-up` | D, Tr (upper) |
| `push-up-board-start` | neutral position for HOTWAVE |

### Pull pattern
| File | Notes |
|------|-------|
| `pull-up-hang` | dead hang — LD, BB |
| `pull-up-top` | full contraction |
| `chin-up-top` | supinated — more BB |
| `band-row-start` | |
| `band-row-finish` | LD, Rh, BB |

### Core
| File | Notes |
|------|-------|
| `ab-roller-start` | kneeling |
| `ab-roller-extended` | RA, EO, LD |
| `hollow-body-hold` | RA, EO, hip flexors |
| `plank` | RA, EO, glutes, shoulders |
| `side-plank` | EO, GM, GMe |
| `hanging-leg-raise-bottom` | dead hang |
| `hanging-leg-raise-top` | RA, IP |
| `dead-bug` | RA, diaphragm |
| `v-up` | RA, IP |

### Legs / lower body
| File | Notes |
|------|-------|
| `bodyweight-squat` | RF, VM, VL, GMa, GMe |
| `split-squat-bottom` | RF, GMa |
| `reverse-lunge-step` | RF, GMa |
| `jump-squat-launch` | explosive — full leg |
| `calf-raise-top` | Ga, So |

### Conditioning
| File | Notes |
|------|-------|
| `jump-rope-basic` | Ga, shoulders |
| `shadow-box-jab` | cross-reference boxing |
| `shadow-box-guard` | |
| `burpee-bottom` | |
| `burpee-jump` | |

---

## BLENDER POSE ASSET WORKFLOW (per animation)

1. Apply pose to `rig` in the working .blend
2. Set `hl_color_1..6` custom props for the primary muscle groups engaged
   (use MUSCLE_COLORS dict once populated — see Task 3 above)
3. In the Asset Browser: Mark as Asset, name it, assign to correct catalog
4. **Critical:** In the Asset Browser → Asset Details → check "Include Custom Properties"
   so `hl_color_*` values save with the pose and restore on application
5. Save the .blend
6. Back up: File → External Data → Pack All Into .blend

## poses.json WORKFLOW (per animation)

1. Sketch keyframes using approximate joint coordinates (0–100 canvas)
2. Check in `content/<discipline>/<belt-or-level>/<slug>.poses.json`
3. Add matching `<slug>.md` with title, description, muscles used
4. Test in the Next.js dev server (the StickFigure component reads poses.json live)

---

## SCRIPT REWRITE PLAN (muscle selection was broken)

The old `yay.py` had selection issues. New approach:

**Problem:** Previous script tried to select mesh faces by material index, but the écorché
uses a single material with vertex-painted regions, not separate material slots per muscle.
The "selection" therefore selected nothing or the whole mesh.

**Correct approach:**
1. The écorché has UV-mapped regions that correspond to texture color areas.
2. To "select" a muscle group: select faces by UV island → those UVs map to the color region
   in diffuse.jpeg.
3. Better: don't select faces at all for highlighting — the highlight shader already does it
   by color-distance on the texture. The highlight system IS the selection system.
4. What was actually broken: `hl_color_*` were set to (0,0,0) so nothing matched.
   Solution: sample the correct RGB from diffuse.jpeg for each muscle group and store in
   the MUSCLE_COLORS dict.

**Revised script plan** (`~/blender-scripts/setup_muscle_colors.py`):
```python
# Samples pixel colors from diffuse.jpeg at known UV coordinates for each muscle group.
# Stores in a dict, then provides highlight(muscle_codes) helper.
import bpy, numpy as np
from PIL import Image

DIFFUSE_PATH = "~/Documents/Octopus MMA/Ecorche_Musclenames_Female_and_Male_Anatomy(1)/diffuse.jpeg"

# Known approximate UV center coordinates (u, v) for each labeled region
# These need to be measured from the texture — open diffuse.jpeg and sample
MUSCLE_UV = {
    "RA":  (0.50, 0.35),  # rectus abdominis — center chest/belly
    "EO":  (0.45, 0.40),  # external oblique — sides
    "PM":  (0.52, 0.28),  # pectoralis major
    "D":   (0.58, 0.25),  # deltoid
    "LD":  (0.40, 0.38),  # latissimus dorsi
    "Tr":  (0.50, 0.22),  # trapezius
    "BB":  (0.62, 0.32),  # biceps brachii
    "TB":  (0.58, 0.32),  # triceps brachii
    "RF":  (0.52, 0.58),  # rectus femoris
    "VM":  (0.54, 0.62),  # vastus medialis
    "VL":  (0.58, 0.60),  # vastus lateralis
    "BF":  (0.44, 0.62),  # biceps femoris
    "GMa": (0.46, 0.52),  # gluteus maximus
    "GMe": (0.50, 0.50),  # gluteus medius
    "Ga":  (0.52, 0.78),  # gastrocnemius
    "TFL": (0.56, 0.54),  # tensor fasciae latae
}
```

The UV coordinates above are approximate — they need eyedropper sampling in Blender's
Image Editor to get exact values. But the approach is correct.

---

## IMMEDIATE PRIORITY ORDER

1. 🔴 **Fix texture** (Task 1 above — 5 min)
2. 🔴 **Verify highlight shader** (Task 2 — 10 min)
3. 🟡 **Sample muscle colors** (Task 3 — 30–60 min, can be done in sessions)
4. 🟢 **Stretches** (content/stretching/ — needed for octopus-health daily workout DMs)
5. 🟢 **Exercises** (content/exercises/ — same)
6. 🔵 **Muay Thai** (deepest backlog, most content needed)
7. 🔵 **BJJ blue belt** (grappling depth)
8. ⚪ **Wrestling** (lower priority but completes MMA picture)

Total estimated animations needed: ~120 files
Currently done: ~32 files
Remaining: ~88 files
