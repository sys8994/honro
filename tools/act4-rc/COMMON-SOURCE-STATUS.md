# Common RC source and QA build

Source commit `fc11f8fdc650a4af86d1fe4d4ae4a5b5daf31403` includes P0 active-fall correction, title pending-direct resume, independent Act4 subtitle node and priority, movement persistence and cold-cache import preparation. The isolated QA preview used these exact source file SHA-256 values:

- `shared/engine/src/engine.ts`: `fc886a37ad03a02df27ae171baa2549dbe6ed52028d81807b9fb4795d8c48cbf`
- `shared/runtime/main.js`: `a86cdaaaf3443fc641ebf1bb83d21d965f053b5595419e2516648018915f768e`
- `shared/runtime/rest-journey.js`: `1ab0dee5ef8a787ffe12570014b976f6307fa3085aa21039d5114e1d3f93703f`
- `shared/runtime/act4-events.js`: `98001bd7521c38ea6803e92529dc2c9d1004de04bc053ca0b1c40641823c4310`
- `shared/runtime/act4-campaign.js`: `dd6989caea8e7c8b5976d41742d360b67ebea33b2f7e9d4815756f7a58ec3157`
- `game/src/presentation.css`: `8d0dec87e1d85ac16b8b70e9bbdad0f48f8f1083423b0356619a542ac046f53f`

QA-only `HONRO.html` SHA-256 `6f91174f3609d8827c7499aad094bce999b6250c445c9bbc81fb120392b01ae4`; `web/manifest.json` SHA-256 `83311f845e7d8ff428110924bdb203cb6de56a1e67ab845f88f2abf3672f7783`. Candidate data and assembly are pinned by `README.md`; this is not a production build or Pages release. The stage 31 P0 fullplay used its earlier frozen runtime, as stated in `PLAY-RESULTS.md`, not this later combined build. The common `main.js` changes require focused reruns across normal saves, stage 1–30, workshops/custom, reward once, and all Act4 stages that relied on prior source.

`profile-store-p01.mjs` continues to fail its schema-4 expected-value assertion also seen on the baseline, and `rest-journey.mjs` and `custom-map-return-profile.mjs` have previously documented baseline fixture mismatches. Do not report them as passes or fix by blindly changing expectations. Specific Act4 archive/quota and title pending-direct tests passed; details are in the related result documents.
