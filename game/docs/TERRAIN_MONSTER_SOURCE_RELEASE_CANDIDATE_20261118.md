# Terrain + monster source release candidate: publication preparation
This is a SOURCE-ONLY release candidate, NOT a ready generated deployment and NOT published.
Production exactly09ac90235b89031b6df8d88cde4c16f39aba78f7, reviewed test tree c95b4067801a50bd95635e3fc3a68bb79e256206. Adds only unchanged Stage40 actual-App test assets from628fef36f1544de8e314619e725d62be258fd009 and release documents/manifest. Do not merge prototype32.
## Scope
50 production/source paths versus public7d238d20663c3ceffe430eb0304e01516ae625cf are enumerated with exact Git blob SHAs in tests/fixtures/terrain-monster-source-release-inventory-20261118.json. Complete252-file reviewed diff also recorded, including tests/docs/tools.
Terrain candidates include2,4,5,6,8–16,21,22,28,29,30,33,34,37,38 and common renderer/path/readability corrections. Not all are new artwork; consult individual ledgers. Stage3/7 rejected extensions are excluded from active author and optimizer registry, obsolete registration tools fail before writes, original BODY/bounds/stages restored with common guards retained. Their original lower-edge visual defects remain unfinished.
Stage32 new foundation/provider/helper is absent. A historical stage32-chrome-baseline workflow exists as diagnostic only; do not mislabel that as runtime integration.
Monster changes40;34/35/37/38;9/13/17/29;43/47/48. Source contracts preserve authorized positions/roles and source counts, other terrain/campaign state as recorded.
## Verified / incomplete
Individual candidate tests are separate from combined results. Combined09ac production has successful48terrain/35monster identity,3/7safe-exclusion,source/save/build, officialloader, Stage34 activeedge,61scene complete monster Chrome matrix44173739655, and actual App QA29→33escort→41reload44171893067. Full matrix is isolated scene/local-action diagnostics, not natural gameplay. Actual40 resume is intact QA save, not fresh40 fight or1–39clear.
No new Stage32 solution,3/7art completion, all-stage normal play, final performance, physicaldevice, public UI, or published-candidate acceptance. User save/current battle never accessed.
## Existing publication path: read-only findings
Read AGENTS.md,README.md,game/docs/RELEASE_OPERATION_GUARD.md,package.json,workshop/build.mjs,shared/web-build.mjs,_config.yml. Official build is npm run build→node workshop/build.mjs→buildWeb; generated files must not be hand-edited.
Pages REST GET /repos/sys8994/honro/pages rejected by connector URL allowlist (not authentication). No alternative credentials/settings/login used; actual settings API remains unread.
Direct observed workflow44026770659 on master7d238d2 is dynamic/pages/pages-build-deployment, success. Build job133848889472 checkout ref master exact7d, Jekyll source '.' destination './_site', no npm build. Deploy job133849597089 reports success2026-11-17T05:51:48.1757357Z and URL https://sys8994.github.io/honro/. This independently confirms existing root branch-generated site flow. Repository125 workflows are branch-specific diagnostic workflows; Pages uses dynamic service workflow.
_config.yml excludes shared/game/workshop source and authoring directories; built web and root HTML/BGM are served. Merely merging source cannot publish game changes.
The reviewed252-file diff has ZERO HONRO.html/HONRO_WORKSHOP.html/index.html/web changes. Current tracked generated graph is still public baseline.
## Next publication steps, NOT executed here
1. Single coordinator re-read master; currently7d238d2. Preserve any intervening changes, no force update.
2. Build from this exact source candidate in separate authorized CI checkout; preserve public assets with official registration first:
git fetch --depth=1 origin 7d238d20663c3ceffe430eb0304e01516ae625cf
node tools/release/retain-published-web.mjs 7d238d20663c3ceffe430eb0304e01516ae625cf --published-at 2026-11-17T05:51:48.1757357Z --evidence https://github.com/sys8994/honro/actions/runs/44026770659
HONRO_ACT4_RELEASE=1 HONRO_ACT5_RELEASE=1 npm run build
Use existing retention7days/minimum2successfulgraphs; candidates are not successful publications. Missing original/hash mismatch must fail, not delete retention.
3. Record generated diff and graph SHA. Required generated deliverables: index.html,HONRO.html,HONRO_WORKSHOP.html,web/manifest.json and entire web graph including runtime/styles/data/graphics/fonts/entries plus preserved published files. Build also emits workshop/HONRO_MAP_WORKSHOP.html compatibility redirect (excluded by current Pages; retain repository consistency). Preserve existing assets/bgm/7MP3 and _config.yml unchanged. Stage32 absent and3/7safe state rechecked in generated runtime/provider graph.
4. Commit generated changes to dedicated candidate branch only, preserving all earlier source/runtime. Production source identity and manifest file SHA/byte lengths prove exactsource→generated linkage. Recheck relevant Game/Workshop/module boot and storage protections on final generated graph, scoped40save/changedviews if graph not byte-identical to reviewed graph.
5. Coordinator obtains root go-ahead then integrates both source and generated graph into latest master nonforce. Observe exactmaster's dynamic Pages success; do not substitute source CI success.
6. Public read-only fetch HONRO.html/manifest and current entry/changed provider assets; compare SHA256 and lengths to generated manifest. Record actual HTML/activegraph hashes, not just source commit. Test expected changed visible behavior in independently permitted public UI without user-save or denied-reset access. If UI blocked, label deployment bytes verified/public interaction unverified.
No master write, build generation, Pages deployment, login, handoff, security setting or external site action performed in this preparation.
