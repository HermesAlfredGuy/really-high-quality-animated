# REFERENCE — The Little Lighthouse

## What this film is built against (real work, looked at, not imagined)

**1. `mg-styles-15 / 05-cel-boil` (in-house, MIT)** — the technique parent. A hand-inked cel look drawn
in canvas 2D: flat off-register colour, three-drawing line boil, pen weight that compensates for camera
scale, paper multiply + tooth overlay, title lettering drawn through the same boil. I reused the drawing
engine (`src/ink.js`, copied from `demos/05-cel-boil/js/engine.js`) and wrote a new film on top: my own
palette, staging, rig and light system.

**2. Pixar, *Luxo Jr.* (1986)** — the acting reference. A lamp with no face, no arms, no eyes; every
emotion is posture (shade angle), weight (base squash, hops) and the shape of the light. This film is
built on that rule: the lamp never gets a face, so the audience reads its pride, its huff and its hope
from how it holds its head and where the beam lands.

**3. UPA / 1950s limited animation (Gerald McBoing-Boing, Rooty Toot Toot)** — flat colour, ink line,
characters held still and then snapped into a pose; the snap is the comedy. Our moth is animated this
way: three or four positions per beat, not smooth interpolation.

**4. Charley Harper / mid-century screenprint** — limited palette, shapes that are also graphics, no
modelling. Our moon, hills, beam and window are single flat shapes with inked edges.

**5. lottie/gsap-style motion films ("explainer" school)** — what I deliberately did NOT do: no
centre-screen text cards, no icon-grid storytelling, no smooth digital easing over a gradient. The story
is acted, not captioned.

## Sound references
- **Pixar short scores** (Randy Newman, *Luxo Jr.* / Michael Giacchino shorts): simple acoustic theme,
  stops dead when the character stops, returns warm when the character understands something. Our score
  does exactly that: the licensed acoustic bed cuts out on the switch-off and comes back on the chorus
  when the moonlight lands.
- Bed: **"Bright Bouncy Acoustic" — Music for Creators, CC BY 4.0**, Free Music Archive (credited in the
  film page and DONE.md). 120.01 BPM, section grid measured with `beat-grid.sh`; every cut sits on a bar.

## What I checked in the references
- 05-cel-boil stills at 1080p (line weight vs. camera scale, paper grain strength, how a fill sits
  off-register from its ink).
- Its render timings on this machine (24 frames = 27 s at 1080p) — that set the render budget.
- The mg-styles style sheet images for 05-cel-boil, 06-collage, 20-pixel to confirm the ink/paper family
  is the right one for a warm character piece (collage was too graphic, pixel too cold).
