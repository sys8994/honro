# Runtime integration boundary

The candidate `world.json` replaces **only `shared/data/act4/world.json`** after final visual/functional acceptance. Keep `shared/data/campaign.json` and stages 1–30 untouched. `shared/build.mjs` appends the Act4 stage/library payload after the existing campaign authoring transforms; `game/config/story-release.json` already enables Act4.

Read-only preflight:

```sh
node tools/density-rollout/verify-runtime-input.mjs _local/reports/density-rollout/final-v5
```

After explicit root integration go-ahead, copy that frozen world to the target; verify the recorded SHA and rerun the preflight and actual App entry regression. Production build command is **`npm run build`**, which invokes the Stage31 release guard before `workshop/build.mjs` / `shared/web-build.mjs`. Do not invoke the downstream builder directly to evade this guard.

## Release evidence still required

Changed Stage31 cannot build without `tools/stage31/production-package.json`. Its stage and referenced assets must exactly match the shipped world. Its production design contract, current Engine/App probe fingerprints/runtime digest, and actual review records/evidence hashes must pass `HonroProductionContract.assertExport`. The legacy unapproved hash is not an acceptance mechanism and must not be updated to the new candidate. Native Canvas actual App observations do not establish browser/HUD/mobile-hardware approval. Record unresolved criteria honestly; do not fabricate review receipts.

Build output `web/` uses content-hashed lazy stage data and `packJson`; candidate world raw/gzip bytes are **not** the measured published download payload. Measure manifest-selected initial/stage chunks after a permitted successful build. Remote branch push, master merge, Pages publication and remote verification remain separately gated; this tool never performs them.

The final-v5 change relative to final-candidate is solely the native Stage38 floor face fill. Other stage-specific QA may be reused only after matching exact referenced stage+asset fingerprints; global world SHA necessarily changes.

## Explicit draft preview (no production build bypass)

An already built `HONRO_WORKSHOP.html` supports **Import → PLAYTEST** with a candidate project JSON. `workshop/src/app.js` accepts governed draft imports and passes the selected stage into the existing embedded App via `launchMap`. Draft download/export is explicitly labeled; production export still invokes `assertExport`. This route requires the existing referenced `web/` build to be accessible and does not prove actual browser execution until tested. Do not call downstream build scripts to manufacture a preview around the production gate.

`prepare-release-evidence.mjs CANDIDATE_DIRECTORY` creates a **blocked** Stage31 draft with the original route/encounter definitions, exact current source fingerprint, separately hashed native evidence, and honest unverified reviews. If `current-probes/probe-results.json` exists it accepts only results matching the exact fingerprint/runtime digest. The supported suite is `tools/stage31-production/verify-gates.mjs`; all9 final-v5 declared tests were actually executed and passed. This is not an art/browser approval.
