# DESIGN — The Little Lighthouse (visual system)

## Concept
A hand-inked 1950s cel cartoon, drawn in code: warm amber light against cool blue paper night.
The lamp is a lighthouse keeper with no face; the whole performance lives in its shade, its spring
neck and the shape of its beam.

## Palette (flat ink + screenprint flats, on cream paper)
| role | hex | use |
|---|---|---|
| paper | `#efe3c8` | the paper the film is printed on; moonlight walls |
| paper-shade | `#e2d2b1` | second paper tone, shade side of the room |
| ink | `#241a15` | all line work + darkest flats (warm black, never #000) |
| night | `#1d2f38` | the dark room, cool teal |
| night-2 | `#2b4550` | mid teal: wall panel, window frame shadow |
| wood | `#6d452c` | desk top |
| wood-dark | `#46291c` | desk front, shadow side |
| warm | `#ffc65c` | the lamp's light pool, bulb glow |
| warm-core | `#fff2c9` | hottest core of the bulb |
| ember | `#e2662c` | filament, the shade's enamel rim, the one accent |
| moon | `#b9d4dc` | moonlight, cool silver |
| moon-core | `#e8f2f4` | moon disc, moth's wing glow |

Two accents only: ember (warm, the lamp's pride) and moon silver (the world's gift). Nothing else.

## Type
Title/deliverable lettering: **Cormorant Garamond** small caps, wide tracking, drawn through the ink
boil so it reads as hand-lettered. Labels/credits: IBM Plex Mono, 13 px, +0.12em — the only "modern"
element, used once, tiny, at the end. (Different from the last two projects: no grotesk display, no
brutalist caps, no Swiss grid.)

## Motion character
- Drawn on twos at 24 fps; static art boils through 3 drawings.
- Acting is weight, not speed: slow anticipation (0.4–0.6 s), fast action (3–6 frames), long settle.
- Camera is paper: tiny drift, no digital easing showpieces. Cuts land on bars, the bulb pop on a kick.
- Boil amplitude ~2 px at 1080p, pen weight 5–7 px on the lamp, thinner (3 px) on dust and moon.

## Signature moment
The moonbeam catching the inside of the shade and throwing a silver sweep across the desk — a
lighthouse with a borrowed beam. It replaces the warm sweep of SC.2 exactly, same camera, same beat
length, so the audience feels the rhyme.

## Composition rules
- The lamp never smaller than 18 % of frame height except in the two wides (SC.1, SC.6).
- The beam is a shape in the frame, not a gradient: a flat amber wedge with an inked edge and a soft
  paper-grain falloff, cut off by the frame edge.
- Shadows are solid ink shapes, always displaced from the object (screenprint registration).
- Every shot has one cool element (paper, moon, glass) so the warm light reads as light.

## Avoid
1. Any "AI cartoon" smoothness: no gradients, no bloom, no vector-clean curves, no 3D.
2. A face on the lamp (eyes/mouth) — posture only.
3. Centred title cards doing the storytelling; only the final title card is allowed to be centred.
