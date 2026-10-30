# Density-candidate functional QA

These tools consume isolated density-rollout candidates. They do not change runtime, artwork, official stages, or release gates.

## Entry and cold Continue

`node tools/density-qa/run-entry.mjs [candidate-root] [output] [comma-separated-stages]`

Each input is frozen before running the established actual-App entry/storage smoke in a separate process. The summary binds exact source bytes, normalized project hash, runtime hash and records whether the original remained current. The explicit 5MiB UTF16 storage fixture exercises actual profile compaction and empty-library asynchronous Continue, including repeated Continue suppression and complete snapshot restoration. DOM, rendering, audio, storage quota and loader response are fixtures. This is not browser or linked-campaign evidence.

## Ordinary-input replay

`node --expose-gc tools/density-qa/replay.mjs PROJECT TAPE OUTPUT STAGE`

For31–37 and39. For38 and40 use their existing phase-specific production verifier (40 requires explicit prior-proof fixture and handles zoom inputs). Uses the existing stage-specific production App adapter and ordinary recorded inputs. No actor positions, combat resources, collision or event state are injected. A mid-run actual stopBattle/Continue verifies exact units, objectives, turn, round and phase. The replay requires victory and a successful resume. Input/runtime hashes and traces remain in reports. Stage31 and35 use their established non-rendering adapters; other stages use their Native Canvas adapter. This is functional evidence, never an automated art approval or actual browser/mobile-performance pass.

If a historical tape is absent from the recovered committed package, regenerate it with the corresponding existing `tools/stageNN-production/play-inputs.mjs` policy, using the historical recorded entry build. Preserve the generated tape and policy result alongside the replay. Do not reconstruct inputs from screenshots or invent terminal outcomes.
