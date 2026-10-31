# Act 4 candidate assembly (QA only)

The current v3 index and manifests come from auxiliary commit `6f65b57fa7d389daec0f3932c7b094cff1b2dcc9`; v2 came from `c5df56daf71d62d28d308d982bc431b3c75fb98d` and v1 from `a5c521b384ef9086194cfaafcf36291f06e05569`. Run `python tools/act4-rc/restore.py` after fetching that object. It verifies compressed and raw lengths, SHA-256, and stage identities before writing ignored `_local/act4-rc/candidates/`. These are review candidates, not release approvals.

After `node tools/act4-source/world-source.mjs materialize`, run `python tools/act4-rc/assemble.py`. It checks every asset ID against the candidate and canonical libraries, retains all assets, checks recursive references and stage 40's dynamic ferry, and writes only ignored `_local/act4-rc/world.json` and `assembly.json`. Stage 36's vector `a4:door` conflicts with a different placeholder used by stage 32: assembly preserves the placeholder and copies the stage 36 vector under `act4rc:stage36-door`, selected through the existing `vectorDoorAssetId` contract. The audit records both hashes. This proposed QA resolution requires event-scene and save/restore review before release.

For browser QA, copy the checkout to a disposable directory, copy the assembled world into its Act 4 source, run that copy's `node tools/act4-source/world-source.mjs pack`, then `HONRO_ACT4_RELEASE=1 node workshop/build.mjs`, and serve it locally on port 8770. This is an isolated QA build, never a production package or Pages deployment. The production `npm run build` guard remains in force. The browser scripts use a declared 45 SP synthetic entry fixture and direct App launch for entry inspection: they do not establish normal player completion. `browser-migration.py` instead restores a preserved old synthetic battle and uses the normal restart UI. `browser-views.py` uses UI camera inputs for inspection; screenshots are captured under ignored `_local/act4-rc/browser/`.

Checks: `node tools/act4-rc/preflight.mjs`; `python tools/act4-rc/check-legacy.py /path/to/qa-copy`; `python tools/act4-rc/browser-entry.py`; `python tools/act4-rc/browser-migration.py`; `node tests/act4-map-revision-rc.mjs`; `node tests/act4-rc-archive.mjs`. Initial QA found all 10 candidates valid and loaded with matching reachable assets; stages 34 and 38 receive three existing narrative revision fields at runtime. Chapters 1–30 retain identical compiled stage data and reachable assets. Browser camera captures include the stage 40 ferry; they do not establish every event's rendering or mobile performance. Fresh normal play, full event sequences, RC save/reload, and the mandatory 20-turn ceiling remain separate gates. Stage 39's prior 31-turn clear failed that ceiling.

## Reproduce on another worker

This pins the tool checkout and selected index, and makes a separate disposable build checkout. `npm ci` requires the package registry; Chromium and Python Playwright must already be available. Run from a writable parent directory:

```sh
git clone https://github.com/sys8994/honro.git honro-rc
git -C honro-rc checkout --detach 2577ef15e1c9b81fbb824ffd68f3f265ca9086b2
git -C honro-rc fetch origin work/act4-source-patch-integration-20261031
cd honro-rc
npm ci
npm ci --prefix game
node tools/act4-source/world-source.mjs materialize
python tools/act4-rc/restore.py
python tools/act4-rc/assemble.py
sha256sum _local/act4-rc/world.json
node tools/act4-rc/preflight.mjs
cd ..
git clone --no-local honro-rc honro-rc-preview
git -C honro-rc-preview checkout --detach 2577ef15e1c9b81fbb824ffd68f3f265ca9086b2
cp honro-rc/_local/act4-rc/world.json honro-rc-preview/shared/data/act4/world.json
cd honro-rc-preview
npm ci
npm ci --prefix game
node tools/act4-source/world-source.mjs pack
HONRO_ACT4_RELEASE=1 node workshop/build.mjs
python -m http.server 8770 --bind 127.0.0.1
```

The commands above reproduce the historical pinned `2577ef15` checkpoint. For the current v3 selection, use the current branch and the immutable commit named at the start of this document; selected input hashes are in `tools/act4-rc/REVIEW_INDEX.json`. Restoration verifies each compressed and raw hash and size. At the pinned tool commit the assembled world SHA-256 is `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. From `honro-rc` in another shell run `python tools/act4-rc/browser-entry.py`; the declared fixture is `tests/fixtures/act4-rc/support-entry-fixture.json`, and results and captures are under `_local/act4-rc/browser/`. Each independent worker should use its own preview and port or machine; the current scripts default to port 8770. Do not overwrite live player saves, share a browser context between runs, or promote this build to production.

`python tools/act4-rc/browser-door-save.py` separately checks stage 36’s dynamic door ID and exact vector contents across an action, normal same-context reload and Continue. It uses a synthetic entry fixture and is not a full event or reward test.

`fullplay31-reference.py` and `fullplay32-reference.py` record ordinary input runs and enter an interactive prompt after combat; they do not claim automatic mission completion. They refuse to overwrite an existing event log. Stage 32 needs `HONRO_PRIOR31_EXPORT` pointing to an actual prior 31 clear export, not a fabricated maximum-stat profile. The present run used SHA-256 `385cde46eec83faaa92a8b8087af4c9d31c0f5865481ca8e4d246fb02337a30a`, with stages 1–30 declared by the earlier fixture. Use the normal map restart UI when the saved battle has an older map revision.

The stage 31 input policy now checks the active hero's health, visible enemies and actually observed pilot warning markers before choosing an attack. Below 45% HP with a visible enemy within 1400 world units, or inside a visible warning's danger area, it considers short walking routes with sampled terrain support; when the route improves distance from visible threats, it uses normal movement and verifies grounding. A low-health or still-exposed actor then uses normal defense, which the production App implements as 4% max-HP healing and a 12% shield. A marker avoided at healthy HP may proceed to ordinary attack. No enemy HP, actor position, warning receipt or combat event is set by the policy. This is a testable policy hypothesis, not a prediction that defense or retreat will survive every attack. Failed movement, new injuries and idle stops remain evidence.

The stage 36 visual leaf's `act4DoorForeshortening` now carries the optional finite `fallenOffsetY` in world units; absence/invalid values default to 0. Assembly sets 79 on the selected stage 36 asset without changing its original source bytes, physical collision, or event coordinates; the renderer no longer ties the offset to the QA alias. The resulting QA assembly has world SHA-256 `2b07f06d90668187b9e53ef94569841f05396dff2d9334e98bff49f415c9b601`, 82,713,567 bytes; selected alias asset SHA-256 `4bfa0254eb06c3e33dfab2e5f28324df0c60fd060aec85dbef6d730a9df89a65` in `assembly.json`. This is a new assembled asset/manifest signature, not a change to the pinned candidate input hash or a production approval. `node tests/act4-stage36-door-geometry.mjs` also checks a renamed asset, midpoint, final pose, invalid/default offset and unchanged landmark position.

`browser-falling-resume.py` uses the supplied original round-12 localStorage snapshot, not the separate UI export. Its compressed/raw SHA-256 are `31e99635e19177107e1322c7ef5833ba8a156be1ddc9a38a3f2779a1e46f2bd0` / `02e5bcd185cf2bc687faeff0af30a18a6fe54727b5ead5f1bdab87c3e59f88b5`. In a newly seeded isolated Chromium context, the actual Continue UI resumed the fall, reached fallen with sound/render timestamps, one committed `itm_hw_06`, and four surviving party members; a subsequent real reload and Continue in that same diagnostic context retained the fallen state and one reward. The original context is not recreated. The QA HTML SHA-256 was `13c919c7117312e372ed2cb496aa12248bd83cfa846d6913d33415d2108ae731`; [actual restored frame](evidence/stage36-falling-param-restored.png) and [observations](evidence/stage36-falling-param-restored.json). This is not a fresh full 36→37 playthrough, natural audition, or final release approval. Stage 37 signal change is imported from `6bebeaa5`; existing restored-save mobile evidence remains separate from a new full run.

The separate `browser-door-save.py` check on that build performed an ordinary round-1 action, real same-context reload and Continue, then verified the assembled door asset matches the selected candidate except for the alias and the explicitly authored offset; the dynamic event ID remained `a4:door` and no page errors occurred. This complements but does not replace the real falling-checkpoint diagnostic.
