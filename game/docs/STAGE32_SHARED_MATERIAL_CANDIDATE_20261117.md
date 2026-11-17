# Stage 32 shared material candidate, 2026-11-17

Status: implementation candidate only. No master or Pages deployment; no public normal-UI or real-device acceptance. Work is limited to finishing the already-started Stage 32 repair.

## Cause and scope
The actual isolated Chrome baseline confirms a rectangular BODY paint termination above the old blue coastal foundation. A foundation-only V3 change (89052d4) did not remove the BODY seam and was rejected visually despite green CI. This revision replaces that approach, not its acceptance criteria.

The V4 source is the already preserved traced material at art/stage32-edge-extension-20261117/v4/final.svg. The original 25 BODY paths, colors and order remain byte/structurally identical in a new provider. Original roads, grass, surface paths and selected source gray subpaths stay in original draw order. Other geology clips sample one common world-coordinate field. No Boolean simplification of protected paths is used. Source paths 1–4 include roadbeds and must stay protected. Thin original footer marks are still a Chrome review item.

The old foundation and body-joined providers remain registered for existing saves. World, terrain, dimensions, placement, source silhouette, physics and static-sea policy are unchanged. No synthetic tide is introduced. Other stages are excluded from the new renderer.

## Cost and compatibility
V4 is 609,306 bytes as a JSON provider, versus the first exploratory 300,000-byte guard. The explicit revised provider budget is 750,000 bytes; this is not a relaxation of geometry/error checks. The traced source retains 18,780 segments after 37.97% reduction, zero embedded images, and documented raster-error bounds. Long path strings are split only at original subpath boundaries into dParts and concatenate verbatim.

One latest device bitmap is reused by foundation and BODY. Key: raw context, full transform, device size, field identity and visual-style key. Opacity is applied at composition, not cached into material. Allocation is capped at 8,388,608 pixels (32 MiB); above cap or invalid configuration uses the previous ordinary vector path and increments explicit fallback statistics. The pre-existing domain tile is separate. This fallback is a compatibility path, not proof of identical seam correction at oversized DPR/resolution.

## Verification
Locally passed: historical adapter/source/provider contracts, every original path identity, other-stage equality, provider codec roundtrip with missing-provider behavior, deterministic V4 generation, cache reuse/invalidation/one-buffer limit, battle-state purity, non-32 and old-provider exclusion, vector validation.
Native art-only preview: two draws, one rasterization, one hit, 7,795,200 bytes. Native is not browser acceptance.
Pending at this commit: isolated Chrome baseline/candidate overview and left/right/lower details, official build, and visual assessment of thin remaining footer marks.
Unverified: public UI, actual camera input, real saved-battle migration, mobile/high-DPR hardware, gameplay and event-state transitions. Branch presence and CI success do not imply visual approval or deployment.

## Historical separation
This branch inherits earlier preserved candidate work, including the rejected foundation-only implementation which this unit replaces. Do not merge intermediate research commits as an approved release. Earlier valid candidates through 80e5f5b remain separately preserved.

## Actual compiler clone regression
First remote run 44084959966 passed source/codec/cache checks and baseline four views, but failed candidate cache reuse. The compiler clones provider objects; foundation used the battle clone while BODY used the library original, producing two rasterizations and zero hits. This was reproduced locally before changing the implementation. BODY now resolves the same battle foundation provider first. The unit fixture uses compiler-equivalent cloned providers and preserves the strict one-rasterization/one-hit requirement. No acceptance assertion was relaxed. Failure diagnostics now preserve bounded draw metadata and failed images without treating failures as accepted results. Follow-up Chrome/build validation remains required.
