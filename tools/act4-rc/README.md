# Act 4 candidate assembly (QA only)

The pinned index and manifests come from auxiliary commit `a5c521b384ef9086194cfaafcf36291f06e05569`. Run `python tools/act4-rc/restore.py` after fetching that object. It verifies compressed and raw lengths, SHA-256, and stage identities before writing ignored `_local/act4-rc/candidates/`. These are review candidates, not release approvals.

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

The selected input hashes are in `tools/act4-rc/REVIEW_INDEX.json`; the index refers to immutable `a5c521b384ef9086194cfaafcf36291f06e05569`. Restoration verifies each compressed and raw hash and size. At the pinned tool commit the assembled world SHA-256 is `99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581`. From `honro-rc` in another shell run `python tools/act4-rc/browser-entry.py`; the declared fixture is `tests/fixtures/act4-rc/support-entry-fixture.json`, and results and captures are under `_local/act4-rc/browser/`. Each independent worker should use its own preview and port or machine; the current scripts default to port 8770. Do not overwrite live player saves, share a browser context between runs, or promote this build to production.
