# Playable terrain readability

The common Scene uses two restrained, independent cues. This is a rendering-only change; collision, materials, camera, saved geography, UI, targeting colours and existing art remain unchanged.

- After the background and before weather/terrain, one neutral `saturation` composite at 0.14 alpha reduces background saturation by a further 14%. It preserves hue and luminosity, fog and light shapes. There is no per-object Canvas filter, per-frame pixel readback or extra offscreen canvas.
- Exposed physical terrain boundaries use a 1.5 raster-pixel dark edge. Upward, walkable edges get a 2.2-pixel dark under-stroke and a 0.9-pixel pale top line (stone/earth `#c7d0bd`, timber `#c8b994`). The paired values remain meaningful in grayscale. These are raster-pixel targets; the existing quantized tile scale resamples them slightly at display zoom.
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
