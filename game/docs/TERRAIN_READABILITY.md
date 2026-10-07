# Playable terrain readability

The common Scene uses two restrained, independent cues. This is a rendering-only change; collision, materials, camera, saved geography, UI, targeting colours and existing art remain unchanged.

- After the background and before weather/terrain, one neutral `saturation` composite at 0.14 alpha reduces background saturation by a further 14%. It preserves hue and luminosity, fog and light shapes. There is no per-object Canvas filter, per-frame pixel readback or extra offscreen canvas.
- Exposed physical terrain boundaries use a 1.5 raster-pixel dark edge. Upward, walkable edges get a 2.6-pixel dark under-stroke and a 1.2-pixel pale top line (stone/earth `#c7d0bd`, timber `#c8b994`). The paired values remain meaningful in grayscale, including a half-pixel-aligned edge. These are raster-pixel targets; the existing quantized tile scale resamples them slightly at display zoom.
- One-way terrain gets only the landing edge. Sides and undersides do not acquire the visual suggestion of a hard obstacle. Water zones and decorative/rear-only art never become highlighted platforms.
- Exposed segments are split at intersections and hidden shared seams are removed. The canonical world polygon, including its continuation outside Play Bounds, remains the source. There is no new skirt or closure at the play boundary.
- Approximate legacy sprite hitboxes are not outlined: a 400px inspection showed that a chapter-1 rock's hitbox extends into air outside its art. Its existing authored art rim remains. Element collision may opt in only when `asset.params.collisionSource` is `sampled-drawn-roof`; rearOnly always excludes it. This matches the Korean-town roof's shared sample contract without touching roof art.
- Paths are built once per battle terrain source/sceneVersion and drawn inside the existing static-world or world-tile build. Warm cached frames add no second terrain traversal. Close inspection uses the same paths, culled to the view.

## References and original adaptation

These are observations from official released screenshots, not claims that the developers prescribed HONRO's values or that every bright shape is a collider.

1. [Hollow Knight official gallery](https://www.hollowknight.com/) and its [Blue Cave screenshot](https://images.squarespace-cdn.com/content/v1/606d159a953867291018f801/6cdafaab-e95a-49c7-a045-4f21469bb327/Blue_Cave.jpg): sharp dark rock contours and lighter top faces remain legible against soft, luminous blue atmosphere. Preserve the atmosphere while separating the contact edge.
2. [Celeste official site](https://www.celestegame.com/) and its [cavern screenshot](https://www.celestegame.com/images/screenshots/p04.png): pale stone trims separate the floor/ceiling perimeter from lower-contrast interior rock masses even in a highly coloured room. Edge/value hierarchy matters in addition to hue.
3. [Unity's Team Cherry case study](https://unity.com/made-with-unity/hollow-knight): the documented use of layered 2D assets and soft transparent lighting supports keeping soft atmospheric layers intact rather than flattening all background artwork to grey.

HONRO retains its existing Korean ink-and-light-wash shapes, material faces, lighting and palette. No borrowed game assets or new decorative patterns are included.

## Verification

`node tests/terrain-readability.mjs` covers exposure splitting, hidden seams, polygon winding, one-way landing-only cues, water/decorative exclusions, sprite-hitbox safety, sampled-roof opt-in, destruction invalidation, state purity, and all three common Scene render paths.

Before/after Native Canvas captures must use identical battle, camera, zoom, time and viewport. Native evidence is not browser/GPU evidence; final integrated Game/Workshop/Pages checks and browser performance are tracked separately.

`node tools/environment/capture-terrain-readability.mjs` reproduces 14 captures at 400×760: chapters 1 (grass/earth), 2 (rock), 8 (buildings), 14 (cave), 15 (water), and chapter 1 at 0.25/1.5 zoom. The two modes clone the same battle; only these two readability hooks are disabled for the baseline. Evidence goes to `_local/reports/terrain-readability/`.

On 2026-10-07 the full Native run passed state purity, 24-frame warm tile/path reuse and three grayscale edge tests. At an integer-aligned edge, the luminance range was 46.27/255 at all three zooms; the initial 0.9-pixel line failed this check and was widened to 1.2 pixels. Direct inspection confirmed the chapter-1 sprite wireframe was gone, cave landing surfaces stood apart from rear houses/rock, the water surface stayed a water effect, and close zoom kept grass and the contact line readable.

Warm Native median samples for chapter 14 were 5.95→6.06 ms, and chapter 15 5.11→5.23 ms. Early chapter-1 samples contained large warm-up variance and are not a speedup claim. All static-cache views kept the same tile memory (4.26–6.39 MB here), one edge-path preparation and no extra path/tile rebuild across warm frames. This supports the bounded draw-cost design; it does not establish browser/GPU frame-rate performance.

## Open follow-up: chapter-1 rock art/collision mismatch

This pre-existing geometry issue is deliberately not fixed by the readability patch. Source: `shared/data/campaign.json`, stage-1 elements and the referenced library assets' `visual[0].points` versus `collision[0]`. Both assets declare `collisionMode: independent`.

- `forest-boulder-a` → `mockup-granite-large`, compiled collision ID `forest-boulder-a:collision:0`. Instance `(910,1580)`, scale 1, rotation 0, snap false. At local x −248.268 (world x 661.732), the visual top is −59.375 and collision top −116.6, so collision lies 57.225 world units above the visible rock, or 22.89 CSS pixels at zoom .4. At the common leftmost x −270.3, visual y 62.5 versus collision y −95 gives the largest top-envelope separation, 157.5 world units / 63 pixels at .4. The floating line was directly visible in the initial mobile capture.
- Related source mismatch: `forest-boulder-b` → `mockup-granite-small`, collision ID `forest-boulder-b:collision:0`, instance `(1630,1510)`, scale .9, rotation 0, snap false. At local x −65.718, visual top −30.875 versus collision top −60.632 gives 26.7813 world units / 10.7125 pixels at .4 after instance scaling. Its leftmost top-envelope separation is 73.71 world units / 29.484 pixels after scaling.

These are exact polygon-envelope comparisons, not an asserted normal-play landing failure. A later collision/art repair should choose the canonical shape, check every instance sharing the assets and preserve save/traversal behaviour; changing physics here would broaden this visual task. For now both legacy element hitboxes keep their original artwork and receive no automatic edge.
