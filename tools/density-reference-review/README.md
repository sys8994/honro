# Stage31 S4: declared reference chapter comparison

Run `node tools/density-reference-review/capture.mjs` from repository root.
Output: `_local/reports/density-reference-review/final-v5/` (ignored).
Source: frozen final-v5 `project-deduplicated.json`, original campaign stages 3, 6, 30 and final density31. Declaration checked against `tools/stage31-production/blueprint.json`.

## Scope

S4 in `shared/map/production-contract.js`: **기존 참조 장의 실제 화면·구현과 비교했는가?**
This is production `runtimeParts` + compiler + Engine + Scene rendering on Native Canvas. Camera is deliberately fixed for inspection, with actual camera equality assertions. Actors stay at original initial positions; geometry and actor positions are asserted unchanged. The collision overlays are separate annotated evidence, not game art. This does NOT prove browser/HUD/device performance, campaign input traversal, natural App camera, or whole release approval.

`implementation.json` records source/runtime/stage hashes, material and collider identities, one-way/breakable flags, bounds, render layer placements, actual initial actors. `manifest.json` records PNG hashes and camera values. View actual PNGs before signoff; source counts are not visual approval.

## Visual + implementation comparison (reviewed 2026-10-29)

| Declared reference | Actual screen inspected | Actual implementation compared to final31 |
| --- | --- | --- |
| 3, 나루의 남은 장부 | `3-overview.png`, `3-contact.png` | Low concave earth bank under three timber docks; clear supports and different-height actor contacts. `ferry-ground` is solid earth, `dock-west/mid/east` are one-way wood, plus breakable side gangway and roof/cargo route.31 preserves low-earth versus upper-timber choices using solid `s31-estuary-bank`, three one-way boardwalk colliders and a separate one-way roof. It does not copy3's breakable gangway mechanic. |
| 6, 끊어진 나무다리 | `6-overview.png`, `6-contact.png` | Much taller broken bridge over continuous lower rock road; foreground material broad and simple; bridge brace silhouette communicates support. `lower-road` solid rock and `bridge-west/mid/east` one-way wood confirm two actual collision elevations.31 uses lower/shorter supported timber and two gaps, not6's giant bridge height. `s31-west-boardwalk` ends x1700, middle starts1920/ends2470, east starts2690: two220-world-unit gaps remain actual collision gaps. |
| 30, 남겨진 길 | `30-overview.png`, `30-contact.png`, `30-quay.png` | Coastal earth/stone/wood vocabulary, steep upper/lower choices, quay masonry and timber lofts.29 separate terrains include actual lower ford, cape, stairs, quay, barge and recovery shore, not merely background pictures.31 deliberately simplifies this into6 terrains and a shallower riverbank; dock and roof remain actual one-way collision surfaces. Shared funeral sign/cargo vocabulary and ferry-house palette provide continuity without reproducing30's large angular wall blocks. |

## Final31 judgment for S4 only

Inspected `31-overview.png`, `31-contact.png`, `31-contact-collision.png` against the above images. Actual characters remain legible on both upper planks and lower soil. Detailed contact strip and plank grain carry more visual information than low-contrast deep terrain; misted background is subordinate. Foreground reeds/ridge frame the scene away from the local walking contacts. Timber/soil/house material family remains recognizable relative to3/6/30, while31 has a lighter coastal palette and softer deep-body shapes.

Collision overlay confirms the drawn upper boards and lower bank correspond to distinct engine terrain, rather than drawn fake routes. Blueprint roof collider also tracks the ferry-house roof; a dedicated roof close-up/route probe belongs to the parent production evidence, not an inference of traversal from these stills. Node counts are intentionally NOT forced equal across layers: collider node count is separate from visible art complexity, and low-complexity collision quads do not justify flat-looking contact art.

**S4 comparison evidence is complete; final reviewer must independently view named images before approving.** This is not a claim that references themselves meet every new art standard, nor a substitute for C1/C4 natural-camera and campaign proofs. No runtime, artwork, collision or release guard modified.
