# Stage 31 local candidate browser harness

This is a local QA importer for the existing `art/act4-grounding-v1/stage31/project-v40-candidate.json`, not an official campaign install or release build. Candidate v40 is 2,741,335 bytes, SHA-256 `540e65d68ab2049ea0271fa168c78b1024b598703ec9e63bcf7fc19c9e67ccc1`. Pass `--candidate /path/to/project.json` for a different explicit candidate; every run records the bytes and SHA where applicable. No candidate data is copied into this harness.

Use a **dedicated disposable worktree**, with the repository's Node and Python dependencies installed and Playwright Chromium available (`HONRO_BROWSER` may point to a browser). The preview build writes generated web output in that worktree and can prune old generated files. Do not run it in a worktree containing changes you need to preserve; do not publish or deploy its output. The regular `npm run build` release guard remains unchanged and must still be used for release.

```sh
# From an isolated checkout of this harness branch, after installing dependencies:
node tools/act4-source/world-source.mjs materialize
node workshop/build.mjs   # QA-only preview; no release acceptance
python tools/qa-stage31/candidate_browser.py
```

`candidate_browser.py` creates a fresh prepared QA profile, explicitly marks chapters 1–30 cleared, sets audio off, replaces `HONRO_PROJECT` only in the browser page, and invokes `launchMap(project, stageId, {profile})` from the start. The original story entry, engine, scene frame, event hooks, warning DOM and boarding behavior remain in place; it does not dismiss dialogue, remove enemies, move actors or set battle phase. It is a custom-map fixture rather than an ordinary campaign entry. Results and an entry PNG are saved under `_local/reports/stage31-candidate-browser/` by default. It exits after capture; a playthrough script can import `launch_candidate(page, base_url, candidate)` from `candidate_browser.py` and continue with physical inputs in the same browser context. The returned record contains the candidate hash and initial battle/ground support state. Profile initialization is a fixture and does not prove earlier campaign completion.

Two separate **diagnostic** commands intentionally use stronger interventions; neither is a normal-play or mission-completion result:

```sh
python tools/qa-stage31/capture_static.py --out _local/reports/stage31-static-capture
python tools/qa-stage31/boat_diagnostic.py --out _local/reports/stage31-boat-diagnostic
```

The static capture uses `story:false`, dismisses dialogue, freezes the animation frame and moves the camera to fixed inspection views. It is render/grounding evidence only. The boat diagnostic begins with the real entry loader and keyboard inputs, but then explicitly removes all enemies, forces the aim state, and separately places actors at the western ledge and harbor to test water recovery and deck contact. Its JSON labels these preconditions. It cannot prove combat, normal traversal, boarding by the full party, receipts, or mission victory.

These scripts use a local HTTP server and a fresh browser context; they do not upload candidates or publish data. The source tests and any preview capture do not imply release approval, visual acceptance, or full Stage 31 completion.
