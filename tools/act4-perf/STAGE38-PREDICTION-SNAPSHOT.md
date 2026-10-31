# Stage 38 isolated arrow prediction

**Test correction:** the original 745-case runner carried the custom flag into later scenarios and did not reset the collision index. Both were fixed and independently rerun; see `STAGE38-A01-REPLAY.md`.

**Rejected:** independent review found a descriptor-access mismatch and potential duplicate external effects. The candidate described below is not integration-ready. See `STAGE38-PREDICTION-REVIEW-FOLLOWUP.md` for the full-clone restoration and its performance impact.

Code: `03fd076323e9bc0334bdb762b0486eec63e4fa7a`. This is narrowly scoped to official stage 38 arrow replay. The complete battle is still cloned on custom/workshop maps, other stages, unsupported object structures, or if simulated code reads or writes an omitted vector. No vector is shared with the live battle. The helper copies the non-art graph with aliases, checks the current art for cloneable plain data each time (no identity cache), and installs access guards on omitted values; access aborts the isolated replay and reruns with the original full clone. Collision geometry, gameplay fields, status, and RNG remain in the isolated copy. Visual vector data is unchanged in the live battle and renderer. The safety contract and fallback are tested by `tests/prediction-snapshot-isolation.mjs`.

The QA build starts from common source `97fa997591759541ca385124f51ae0edded02e14`, includes only the narrow e6f1/c1e6 guide changes and this commit's two engine files, retaining common compact autosave and the 4ebe stage-40 escort dirty update (confirmed in `act4-campaign.js`, QA SHA-256 `1013bf36c5f40f6b0580b68ec4eb2adef5530eb87ede78f188570e14fe37db0f`). The raw assembled world SHA-256 is `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. Do not replace common files wholesale.

## Equality and regressions

Against the same QA build using the old full clone, 149 non-passive skills in each of five scenarios (ordinary official stage 38, modified vector plus collision metadata, synthetic custom/workshop flag, broken terrain, and status effects) produced 745 identical prediction records. Every call retained the original battle JSON and RNG; no case raised an error. Baseline and candidate JSON SHA-256 are both `a4e5444fe613672f671080ba42b2d8c9d080a003c617a0f2f272bc12831c8db8`. This is a synthetic battle: the custom flag tests fallback, not an independently authored custom map, and it does not exhaust all effects, targeting, terrain or skill ranks.

A separate fixed-state comparison covers A01/A02/A05/A14 at three angles with and without unit collisions, a fixed rendered frame, original battle and RNG: both outputs SHA-256 `bf8e4b6b2e11d76a62202c1d920e8c60bb1ade131784a8d1ad856e3fd9ad5a97`. The screenshot pixel hash is `1011369ef6886e03ba8b9a015605f0254a254500f58f6d99fb0ddf3fcff50d12`. `tsc --noEmit -p game/engine/tsconfig.json`, snapshot isolation, synthetic stage-39 wreck, autonomous-friendly-fire and projectile-friendly-fire tests passed. `tests/aim-launch-collision.mjs` failed its first stage-1 fixture assertion (fixture did not reproduce embedded muzzle); it was not used as evidence for this change.

## Browser measurements

Chromium headless 1440×900 DPR 1, one active browser; 5 CPUs allowed, 18,440,100 kB total RAM, 15.9–16.4 GB available, 10 live Chromium processes including subprocesses. A synthetic progressed profile is used to launch 38, save, close the context and use the actual title **Continue** button to resume. Mouse wheel, drag, right-arrow movement and autosave are active. Camera and input timing are not perfectly fixed, so these are samples rather than phone FPS or a full playthrough.

| Order | Build | Moving rAF median / p95 / max, ms |
|---|---|---|
| 1 | candidate | 50 / 83.3 / 116.6 |
| 2 | full clone | 58.4 / 116.7 / 133.4 |
| 3 | candidate | 50 / 66.7 / 99.9 |
| 4 | full clone | 50 / 100 / 133.4 |

The direct synthetic-entry sequence gave candidate 50/66.7/100 and 49.9/66.7/83.4 ms, compared with preceding full-clone 50/83.4/100 and 50/83.3/100 ms. These are limited PC samples: median improvement is not consistent, long frames remain, and actual mobile, real user custom maps, long-session memory, all combinations and normal 39→40 play are unverified. Stage 40 cold-water raster remains a separate unresolved cost.

Reproduction: `stage38-all-skills-diff.py TAG`, compare its JSON with the committed full-clone baseline; `stage38-projection-parity.py TAG`; and `stage38-title-live-input.py TAG`. Point `HONRO_QA_BASE` to the corresponding built QA server. Compressed raw events, host details and parity data are in `evidence-stage38/`.
