# Act4 sea-side silhouette and dawn candidate

This is a **review candidate**, not release approval. Main world and shared runtime are not edited by this package.

## Diagnosis and correction

Stage32's apparently distant rock is gameplay cover `a4-32-prop-4`, originally asset `s32-density:stone-cover-natural`, L1-back. Its detailed old-wall trace was clipped to an eight-vertex polygon. Its center foot `(2390,1832)` exactly touches the upper ramp. An initial ground-only inference that it floated physically was incorrect; the full support check corrected it before editing. The flat original base is buried on its left and unsupported on its right across the slope, which explains the floating-card appearance.

The first new traced artwork fitted across that ramp was rejected: it became an implausible long jagged ridge on wood. Rejected source fitting and isolated screenshot are retained. The adopted **test candidate** is a compact cover on the existing flat upper landing, instance `(2130,1760)`, scale1, extent x1980–2280. New authored outer silhouette, not the old eight-point clipping mask, supplies its collider. 32 terrain/route is unchanged; this one cover collider and placement change explicitly.

## Actual authoring

- Built-in image generation made `stone-ramp-cover-concept.png`, five major blue-slate stone masses, quiet interiors, stepped/notched silhouette.
- Actual Inkscape GUI: Multicolor/Colors,8 scans, Smooth/Stack/Remove background ON, speckles2, smooth corners1, optimize.2. Saved embedded-reference `stone-ramp-cover-source.svg`.
- `stone-ramp-cover-raw.svg`: exact seven generated trace paths, reference image removed without path edits.
- Native Inkscape CLI master cleanup: delete pale fringe path7, set underlying path6 fill to#293a4a. This is intentional art cleanup, not claimed lossless optimization. `stone-ramp-cover-master.svg` retains six paths.
- No secondary Simplify was needed to meet engine budget; normalized source paths are shared across support-fitting slices, rather than copied. Clip boundaries derive from actual support and traced bottom, never invented decoration.
- `fit-cover.py` generates32 module,95 collider vertices with bounded0.22local-unit polygon simplification; actual outer curve determines geometry. 14 clipped affine pieces maintain the traced artwork and correct contact. Native vector validation passes. Final gameplay/paint acceptance is separate.
- Explicit material `rock`, `breakable:false`, authored HP360, oneWay/climbable false. Legacy asset omitted material and compiled as wood. Runtime maps indestructible HP to99999; do not claim compiledHP360.
- `fit-related-covers.py` creates six35/37 variants at their unchanged instance positions/scales using each actual land profile. Variants are pending targeted gameplay validation.

## Dawn palette candidate

`authored-far-art-blue-dawn.js` is a candidate copy of the production renderer, **not active shared runtime**. `make-dawn-preview.mjs` derives it from current source. Only act4Dawn/act4Sea keys change; actors/HUD are untouched. It removes bright daytime grading, maps cloud luminance to a restrained blue-gray range, and changes the sea gradient/ripples. The first overly-flat dark-sky candidate is retained as rejected.

`palette32.mjs` recolors only selected non-character32 assets by role: architecture, wood, contactsoil, deepbody and supports. It creates scoped asset aliases and retains all their geometry/collision. No global screen tint is used. `palette32-assets.json` and `palette32-manifest.json` are integration inputs.

## Native review evidence

Ignored review directory: `_local/reports/sea-silhouette-v3/`.
- before/32/normal.png: actual baseline App scene.
- after/32/normal.png: rejected ramp-ridge candidate.
- after-flat/32/normal.png: compact cover before explicit material metadata fix; appearance identical.
- coherent-dawn-v1/32/normal.png: compact cover, palette32 and isolated dawn renderer.
- related-after/{35,37}/{normal,party}.png: support-fitted covers before shared dawn palette rollout.

The native adapter uses actual App/Scene with fixture DOM/audio. It is **not browser/mobile QA**. Coherent dawn project SHA256: `2c4501c5de754c02aef5fcdda5cb8ee872123aec283d8a1e4d6e38eeb9f3a0e7`. Cover-only gameplay candidate SHA256: `6725348e76004f9d77606f2dfc75f5bde33d3991530972c956538f0777cf1bbd`.

Remaining: actual32 gameplay/impact/contact check; final integrated runtime and palette capture;35/37 related gameplay tests; large terrain and long platform silhouettes are not fixed merely by this cover/palette candidate. No master/Pages publication is represented here.
