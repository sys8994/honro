# Act 4 water paint correction — isolated candidate

The generator itself never writes shared runtime. Approved patches were subsequently applied at the clean boundary documented below. `prepare-patch.py` reads preserved pre-water baseline modules and emits reviewable candidates and unified diffs under `art/water-coherence-v4/`.

## Cause and correction

The legacy pool pass adds a rectangular vertical reflection to each independently clipped pool. Overlapping authored shallow strips and live tide volumes make hard steps particularly noticeable in stage 33. `HonroGeometry.material` also normalizes authored `shallow-water` to runtime `water-pool`; checking only runtime `kind` silently misses the wet-film branch.

The proposed call-site option explicitly selects `coastal-dawn` only for Act 4. The source material is resolved by exact authored stage ID and exact material ID, then checked for authored `kind === shallow-water` (never inferred from ID wording). It supplies a render-only `wetFilm` option without mutating compiled metadata. Wet film follows actual compiled bottom samples and remains clipped to the physical zone. True pools retain their actual water level and receive three restrained ripples and a soft reflection rather than a hard rectangle. Return inlet pools receive the same explicit style.

All simulation geometry, conductive contact, water policies, levels, units, and progression remain unchanged. Default calls retain identical legacy pixels.

## Checks

- `compare-pool.mjs`: 30 small Native Canvas default-paint fixtures, not 30 full campaign replays. Exact old/new pixel equality and zone-data immutability.
- `capture-33.mjs`: real ordinary balanced input tape reaches frame 11400 with high tide; same camera/state before and isolated after. Asserts visible west strip reaches wet-film branch and both authored strips resolve correctly. Full physical snapshot and runtime digest unchanged. This is not a shared-runtime deployment or full gameplay acceptance.
- `capture-40.mjs`: actual App initial-state pool, fixed camera only; isolated before/after and physical snapshot equality. Not an earned gameplay screenshot.

Native captures must be serialized with the team's QA lease. Reports/screenshots live in `_local/reports/water-coherence-v4/`; rejected first diagnostic remains in `water-coherence-v4-first-diagnostic/`. First diagnostic passed default compatibility but failed the intended wet-film classification visually; do not label it accepted.

Status: final isolated tests passed at 17:08 UTC; duplicate band removed in actual33 high-tide view. Root visual review pending. No shared-runtime application authorized yet.

## Second diagnostic and actual duplicate pass

The corrected wet-film branch ran, but a second rectangular band remained. Inspection of the actual Scene call chain found `art-dark.js`'s `surfaceZones` cached material pass also painting every attached water-pool before `environment-renderer.liveWater`. The engine `art.ts` water loop initially looked similar but is not this Scene's path and is NOT changed.

The next candidate declares `waterVisualOwner(b,z) === coastal-live` only for canonical Act4 battles with Act4 design and actual water polygon zones. The cached pass filters a local rendering list; simulation arrays and metadata stay untouched. The separate ice terrain pass is untouched. Native test instrumentation exercises actual Scene.surfaceZones legacy liquid/frozen fixtures and checks the ice-terrain pixels, as well as recording the static calls and owned zone IDs. Isolated capture uses an explicitly labeled equivalent local render-list wrapper, not a claimed deployed runtime.

## Applied checkpoint

Root approved the isolated direction. At the QA-clean runtime boundary the four scoped diffs were applied and committed as `af1cbc3`; runtime digest `9278a691f97be21437b58fe67cdffa6a7e031da6666b2b34faa2e6f6829e0544`. The actual loaded modules pass 30 default pool fixtures and eight actual Scene legacy liquid/frozen fixtures. Actual33 high-tide and40 return-inlet option assertions pass without paint overrides; both applied screenshots are RGB-pixel-identical to the root-approved isolated candidate. Typecheck passes. Generic environment checks are blocked by two untouched stage13 rubble scale errors. Normal build remains correctly blocked by three missing final release approvals; no gate was bypassed. No world source was edited.
