# Act4 local vector candidate integration

Run from repository root:

    node tools/act4-vector-production/assemble-candidate.mjs

The output directory defaults to `_local/reports/act4-vector-production/integrated-candidate`. An alternative first argument must also stay inside repository `_local`. The command does not edit the official campaign/world, build a public entry, approve art, or publish anything.

Inputs are the current official campaign and Act4 world, the generated Stage31 release-candidate draft, and each stage's portable production package. Run `tools/stage31-production/forge.mjs` first if that draft is absent or stale. Stage32–34/37–40 packages use `package/stage.json` and `library.json`; Stage35/36 use their combined production-package JSON. Every input's SHA256 and byte size are recorded, and changed-during-run input files cause failure rather than a mixed snapshot.

Outputs:

- `project.json`: all40 stages; official1–30 copied exactly, new Act4 stages assembled, shared asset definitions preserved.
- `world.json`: candidate Act4 payload only. Source world revision is retained as metadata, not a release decision.
- `integration-check.json`: source inventory, collision and gameplay comparisons, new vector validation, Stage35 full official-to-candidate change list, and evidence boundaries.

Stage31 and35 were gameplay-redesign pilots. Stage31 collision must equal its authored draft. Stage35 collision/gameplay must equal the pinned `stage35-skeleton.json`: eight land vertices changed, original units and props re-grounded, and two walls moved to grounded clearings. Its central shot pocket remains fixed. It is **not** an appearance-only change or a two-wall-only exception. The assembler also verifies that the final successful Stage35 App replay's project fingerprint matches its source stage and every portable asset; its recorded runtime hash remains historical, never relabeled as a current replay.

Stage32–34/36–40 retain exact official compiled collision, units, materials, events, encounters, objectives, markers and gameplay design. Display palettes/far settings and canonical narrative revision1 markers can differ. Shared asset ID conflicts, unresolved static/dynamic asset references and unsafe vectors fail. Official1–30 are not taken from Stage31's normalized historical full-project draft.

Successful integration does not establish art quality, browser HUD/touch behavior, a linked31–40 campaign playthrough, remote publication, master integration or Pages deployment. Existing Stage31 review/probe records are copied as-is; no approval flags are generated. Production promotion remains a separate reviewed action.

## Targeted entry/save smoke

    node tools/act4-vector-production/smoke-entry-storage.mjs

Run after the package and runtime edits settle. Each stage31–40 runs in an isolated process with a prepared prior-clear profile and legal entry XP. This exercises actual official App launch, stopBattle, bounded5MiB UTF16 profile writes, whole-snapshot static-art restoration, empty-library cold title load and the real CampaignEntry asynchronous Continue handoff. Repeated Continue must share one pending load. Exact unit/terrain/water/event/turn/static-art snapshot fields must survive. The loader response, storage quota, DOM, rendering and audio are explicit fixtures; this is not real-network/browser, stage victory or linked campaign evidence. Any candidate/runtime change during the run fails its final binding checks.

The integration report also records compact JSON/gzip-level9 world sizes, actual stored/expanded path counts, maximum expanded tree size/depth, longest path, largest asset and equivalent no-symbol vector storage. This measures payload/tree costs, not phone FPS. Raw-to-optimized SVG visual error remains in the individual asset reports, not inferred from these totals.

Read-only reuse opportunities:

    node tools/act4-vector-production/audit-payload-reuse.mjs

This lists exact duplicate vectors/drawing trees across new asset IDs, repeated path strings, and new assets absent from static/configured references. It deliberately does not merge IDs or delete assets: rendering transforms, foot/anchor/bounds, collision, runtime-selected IDs and old saves must be audited first. Raw repeated-string totals are an opportunity ceiling, not a promised compressed download or memory reduction.

## Committed-only overlay backup

    python tools/act4-vector-production/build-overlay-backup.py
    python tools/act4-vector-production/build-overlay-backup.py --head <final-commit> --write

The first command is a dry scope inventory. The explicit write command creates a deterministic ZIP in `_local/archive/`, plus SHA256/size summary and full source manifest. Input paths are the reconciliation queue's commits plus the tracked diff from its `localHead` to the pinned final commit. Every byte is read through `git show <commit>:<path>`, never from dirty worktree files. Deleted paths are listed, not silently omitted or automatically removed. Internal/private paths, credentials and nonregular files are excluded; recognizable embedded credentials abort the archive. CRC and every archived source SHA256 are reread after creation.

This is an overlay backup, not a complete repository, a remote publication substitute or a verified production deployment. Final creation waits until intended package commits are complete; changing HEAD later does not silently change a previously produced archive.

## Frozen candidate payload snapshot · 2026-10-28

For combined project SHA256 `ef3fb448efccd250f55f02e235d7def2804be3c24ee7ca9c09ac99da42a25578` (Stage31final5d16edd, Stage40water30d3ff7, Stage34/39crack8163138, Stage38crackc9e398e):

- Official old Act4 world:283,241 compact JSON bytes;43,278 gzip-level9 bytes.
- Candidate Act4 world:29,087,314 compact JSON bytes;12,130,264 gzip-level9 bytes. This is materially heavier, not a lightweight/mobile-performance claim.
-148 Act4 vector assets:2,088 stored path nodes,945 distinct path strings across assets,4,403 expanded path nodes. Maximum expanded asset tree451nodes, depth8, longest path59,977characters; current limits remain512/24/60,000.
- Exact internal-symbol reuse: equivalent expanded vector storage71,089,230bytes → stored28,850,976bytes (~59.4% reduction). This is lossless subtree-storage reuse, not evidence of shape simplification quality.
- Largest asset `s39v:wreck`:1,338,506JSONbytes,46stored paths.
- Read-only audit found4,036,713raw bytes of potential exact full-vector cross-ID duplication and no new assets missing static/configured references. Cross-ID canonicalization is not implemented; bounds/foot/paint/event contracts must remain independent.

The executable report is authoritative after any subsequent source change; rerun it rather than copying these numbers to a changed release. Browser rendering, mobile FPS and actual network transfer remain separate measurements.

### Exact shared-definition refinement

The final local assembler now additionally applies only four explicitly reviewed full-asset families through `canonicalize-shared-assets.mjs`. Every field except top-level `id` and `name` must match. Canonical IDs are `s34v:crack`, `s31v:abandoned-skiff`, `s32v:old-wall` and `s37v:haul-footing`. Only explicit asset references in candidate stage data change; original element/event IDs, all official shared definitions and authoring packages stay intact. A runtime source-literal audit refuses aliases newly used as gameplay selectors. The integration report records every alias and changed reference and rechecks complete compiled collision before/after reuse.

Candidate project `bdae829e1ecd667c708e0ce11a52158882080908d773378fd20985b8509104ab` removes five duplicate definitions and rewires14references. World JSON drops29,087,314→27,247,226bytes; gzip-level9 drops12,130,264→11,303,277bytes, a measured826,987compressed-byte reduction. The resulting143Act4vectorassets have2,037stored path nodes,945distinct path strings and4,352expanded paths. Maximum451nodes/depth8/path59,977 and the1,338,506-byte wreck remain unchanged. Internal-symbol vector storage is69,253,335 equivalent expanded bytes versus27,015,081stored bytes. It remains a substantial payload, not a phone-performance pass.

    node tools/act4-vector-production/verify-shared-reuse-pixels.mjs

The focused native Scene comparison renders the actual before/after projects at fixed cameras for33skiff,37wall,38crack,38footing and39crack. All five RGBA buffers matched exactly. The prior `project-before-shared-reuse.json` is retained locally for reproduction. Directly inspected crack imagery confirms the subject is visible; this parity test does not confer new art or browser approval.

The final ten-stage entry/storage smoke passed against the same `bdae829e…` candidate and codec fix7f43a78. Stored UTF16 byte sizes for31–40 respectively:148264,88274,115080,90302,101042,69814,87852,85872,90174,81208; all below the explicit5,242,880-byte fixture quota. Whole-snapshot decode and actual deferred Continue matched dynamic state and all three artwork holders, including environment placements. Before the fix,35/36 correctly failed because environment artwork alone occupied11.26/8.21MBUTF16; those diagnostic failures are retained. This is a storage/entry contract pass with fixtures, not a real browser quota or full-ten-stage completion claim.
