# Act 4 sharp browser diagnostics (QA only)

Runtime baseline: `8594270a0f164498289b79fa2f1c0b993c3c8d5e`. The seven input projects come from `e0e3428e18c6c4d820a41cb9cf0794df55a7e997`, via `restore.py`. Fetch that exact commit first. Base64 length, compressed bytes/hash and decompressed bytes/hash are checked against its manifest. Raw JSON stays under `_local`; it is not committed. Far assets come from `c2c84576307a5d6428ee2ba2b7222bf53b6e0101`, except the baseline cave entrance. Only the four new image keys are added.

In a disposable worktree, install root and game dependencies, run `python tools/qa-act4-sharp/restore.py`, `node tools/act4-source/world-source.mjs materialize`, and `node workshop/build.mjs`. The latter is a **QA-only preview**, not the release build; never publish its outputs. Then, for example:

```
HONRO_BROWSER=/usr/bin/chromium python tools/qa-stage31/capture_sharp.py --stage 33 --candidate _local/reports/act4-sharp-browser-inputs/stage33.json --out _local/reports/act4-sharp-browser/stage33
```

This imports the real candidate through production App/Engine/renderer but disables story, dismisses dialogue, freezes the frame, and sets camera views. It preserves units and terrain; it is **not gameplay, event progression, or release evidence**. Each `results.json` records candidate SHA, actor/terrain/landmark state, viewports, zoom, and console messages. Overview may use zoom outside the allowed range; other shots apply focus and containment constraints. The initial support snapshot precedes simulation settling. A false grounded value alone is not proof of a bad placement. Direct image decoding confirms the files decode, not by itself that each is used by the scene; inspect scene screenshots too.

The fixed source commit and candidate manifests must remain available. Images in `review/act4-sharp-browser/` are actual PNGs from these diagnostic contexts, not lossily recompressed. No FPS or physical-device claim is made.
