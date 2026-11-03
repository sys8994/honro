# A2 selected vector frames

## Decision and scope

Selected direction: **12 어둑시니 frames + 4 flat 점복무녀 frames**, direct vectors first. Original textured munyeo and all raster/raw references remain research provenance, not gameplay payload. Candidate archive: commit `3af9c1869c2a8fd1be1e15e44e0828a81fc1b06f`, tree `8a349f01d2573c43093bef59d5b69f8b3ffff052`; Actions evidence run `41560464384`, artifact `13195623878`.

This narrowly allowlisted asset-profile exception is based on source-matched Chromium renderer comparison. **Ordinary monster-forge 350-anchor/90-path/16-color checks are unchanged.** This module is not a generic alternative for arbitrary overbudget artwork.

| Allowlisted family | Frames | Anchors/frame cap | Paths/colors cap | SVG bytes/frame cap |
|---|---:|---:|---:|---:|
| eoduksini | 12 | 750 | 6/6 | 30,000 |
| munyeo-flat | 4 | 2,000 | 9/9 | 75,000 |

Combined SVG cap 500,000 bytes; current **489,358**. Exact16 IDs and source hashes are independently pinned in `tools/monster-forge/a2-frame-policy.mjs`. A new ID, changed hash, unsupported SVG content, extra on-disk SVG, wrong pivot/base, stale counts or cap violation fails closed. Updating the allowlist requires renewed art/error/cost review, not merely editing the manifest. No textured munyeo, raw PNG or candidate manifest enters this runtime pack.

## Build/load contract

- `node tools/monster-forge/build-a2-frames.mjs` validates and writes `shared/assets/monsters/a2-selected/frames.runtime.js`.
- `node tools/monster-forge/build-a2-frames.mjs --check` validates without writing.
- `node tests/a2-frame-assets.mjs` verifies exact generated pack, source/hash parity and rejection cases.
- Integration owner imports `buildA2Frames` and loads the generated runtime before selecting these frames. Existing ordinary `buildMonsters()` remains separate and unchanged by this asset unit.
- Global `HONRO_MONSTER_FRAMES` contains `assets`, `poseMaps`, common `baseHeight`, `viewBox`, `footPivot`, revision and aggregate source hash. Each asset is compatible with existing `HonroVectorParts.create(assets)` (parts/palette/clips model).
- **Pre-authored poses, not skeletal rigs.** One root part, retained exact absolute M/L/Q/C/Z vector paths and solid fills; no frame-by-frame raster parsing. Empty animation tracks deliberately avoid fabricated articulation.
- State mapping is explicit: eoduksini stage1/2/3 each idle→prepare→attack→recover; munyeo idle→prepare→link→recover. Selection follows simulation state. Renderer must not invent attacks or timers.

## Coordinates and geometry

Common `baseHeight=128`, `viewBox=[-85,-150,230,160]`, origin/feet `[0,0]`. Apply simulation `u.h/128` scale, root facing sign and approved root bob consistently. **Never fit each state or growth stage to its own height.** Actual idle heights ~72.396/104.210/127.614 preserve growth. Action posture can lower the head; feet remain registered.

Visual bounds include long arms/fan and are not damage or movement bounds. `damageGeometry`, `hitGeometry` and movement footprint are unset here; authoring guide boxes were removed from selected metadata because they were not precise hurtboxes. Gameplay/renderer owner must separately review visible bent torso/head targeting against all12 pose contours. A capsule centered only on root can miss the bowed head. No art metadata implicitly changes locomotion h/r or declares decorative limbs targetable.

## Authoring and review evidence

Approved imagegen directions → actual Inkscape trace → actual Inkscape simplify/semantic intersection/difference/union → absolute coordinate serialization. No invented polygon replacement. 어둑시니 fingertip portions were restored from raw where simplification exceeded protected-outline tolerance. Flat munyeo is an explicitly approved alternate reference lineage, not a claim of original textured pixel equivalence. Stronger global simplify0.005 was rejected for visibly rounded skirt/garment facets.

Three distinct author reviews covered silhouette/growth, enlarged face/fan/hands/feet, and actual48/128px state/facing readability. Reference/raw SVGs and raw-vs-final comparisons remain in the authoring archive outside gameplay. Sampled 2× alpha silhouette distances: retained eoduk <=0.707 world px; selected flat idle/recover0.5, prepare/link0.707. Flat protected-band premultiplied RGB MAE 0.0110–0.0226. These are sampled comparisons, not continuous Hausdorff or universal semantic segmentation guarantees; stats alone do not approve art.

## Cost evidence and remaining acceptance

Exact renderer/source hashes verified; screenshots from1× and4× CPU runs byte-identical and visibly show each selected shape (not fallback).

20-actor48px direct **CPU command-submission** median ranges,1× / synthetic4× ms:
- shade0.68/1.96; ghost0.30/1.22;
- eoduk0.04–0.06/0.16–0.20;
- textured munyeo0.08–0.10/0.32–0.40;
- selected flat0.06/0.24–0.32.

Flat coldcompile+firstdraw median0.2/0.6–0.9ms versus textured0.4–0.8/2.0–3.6. Flat sources238,037 bytes versus textured874,442 (72.8% smaller). All20 QA fetch+parse+hash119.1/334.8ms uses loopback HTTP, not production network/load timing. Heap snapshots ~3.9MB are not attributed peak/steady-state storage. Path2D/GPU native memory remains unmeasured.

P95 batch outliers include7.56ms eoduk recovery direct48 and4.28ms flat idle at4×. Fixed-pose candidates also have less articulation overhead than baseline rigs. **No FPS/mobile-GPU guarantee follows.** Optional2× fixed-viewBox cache would cost9,420,800 RGBA bytes for16frames (~8.98MiB), before overhead; not required by this decision.

**Remaining mandatory acceptance:** actual stage9/24 desktop/mobile views, visible-core/attack targeting alignment, common-scale state/growth/foot continuity, normal load and full-game frame-cost comparison. Build/test success does not mark those unrun checks passed. This asset unit has no actor placement or gameplay integration.
