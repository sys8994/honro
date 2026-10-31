# Stage 31 browser input smoke (not full play)

This is a limited reproducibility probe. The isolated QA web build must contain the v40 candidate as its official Stage 31 input, and expose the identical candidate JSON at `/candidate.json`. It requires the QA server at `http://127.0.0.1:8765` (or `HONRO_QA_URL`), Playwright, and `/usr/bin/chromium`. Never publish this preview. The source, production package, release guard, and generated production artifacts in the checkout remain untouched.

The probe installs only the declared stage-30-cleared support entry fixture in browser storage, navigates the actual title/rest UI, confirms candidate stage identity and 34 enemies, advances dialogue with Enter, then uses keyboard movement, jump, angle and charge/fire. It records actual state and screenshots under `_local/reports/stage31-browser-fullplay/`. It asserts one shot was accepted; it does not prove damage, tactics, warning observation, mission completion, save/resume, difficulty or performance. The fixture is a declared prior-clear profile, not a record of playing chapters 1–30. `stars`/`shots`, `schema` and `game` were added to the original reference profile so the current validators and campaign loader accept it. SP, levels, skills, equipment and ownership are unchanged.

To reproduce, copy the checkout to a disposable `/tmp` directory including dependencies (the copy must be independent of the checkout), then from that copy run:

```sh
node tools/act4-source/world-source.mjs materialize
node tools/qa-stage31-fullplay/install-candidate.mjs /absolute/path/to/project-v40-candidate.json
HONRO_ACT4_RELEASE=1 node workshop/build.mjs
python -m http.server 8765 --bind 127.0.0.1
```

`install-candidate.mjs` refuses paths outside `/tmp` and checks the candidate hash. The build tool reads `git rev-parse HEAD`; use an isolated checkout or an appropriate read-only Git reference. Run the input probe in another shell against that server:

```sh
python tools/qa-stage31-fullplay/input-smoke.py
```

The canonical release build continues to require `npm run build` and its release guard. Review [`RESULT.md`](RESULT.md) for this run's exact inputs, output hashes and limitations before reusing any evidence.
