# Public release verification: preparation only

No public execution or deployment is enabled by this branch. The preparation workflow compiles/scans files and verifies the unchanged repository QA input; it does not install or launch a browser, fetch Pages, import a save, or change master/Pages.

## Provenance and execution gate

The normal UI flow is derived from tools/stage40-qa-resume/play.py at628fef36f1544de8e314619e725d62be258fd009 (blob74c534eb2901bf2c38e06002f0ad7e3096b7d75e). tools/stage40-app-flow/escort_inputs.py remains byte-identical (blob1c03144e99b19cf42ed023c44a1055284ae24009). The unmodified QA checkpoint decompressed SHA isada2099bcb273de6d7031cf1a8c8c3b361fa75054d73975521892ce112b7c3ed. It is repository QA evidence, not any user's save.

Future execution requires a coordinator-confirmed deployed generated commit, a clean checkout of that exact commit asHONRO_RELEASE_ROOT, HONRO_EXPECTED_RELEASE_SHA set to its full40hex SHA, and explicitHONRO_PUBLIC_REPLAY_ENABLED=1. No default to github.sha or master. The candidate generated objectc1e03f666bb4da8fccf71c530f3e6092570d617b is NOT evidence of deployment and is not activated here. Failed/denied publication must not be retried or bypassed by this verifier.

## Intended future checks

1. Validate the release checkout HEAD and clean entry/web bytes. Read manifest.version1/files schema from the existing shared/web-build.mjs contract.
2. Before App launch, fetch public HONRO.html and web/manifest.json and require exact release bytes. Fail immediately if stale/mixed rather than testing the wrong runtime.
3. Fetch each current manifest.files resource, check exactSHA256/bytes against both the generated checkout and manifest. Up to4 concurrent requests. Previous retained generations are not pre-fetched; any subsequently observed App request must still match an actual resource in the release checkout.
4. New1440×900 Playwright1.58.0 Chromium nonpersistent context. Assert empty cookies/origins before navigation. Never load a real browser profile or user's existing battle.
5. Same UI settings→record management→JSON import→file selection of unchanged QA29 checkpoint→Continue. Existing growth/equipment/proof/no-restart/round29/0enemies/aim guards retained. Existing normal input escort→E completion→41→same-context reload logic unchanged. Record observedround (previously33), do NOT add <=23 or force33. This is not fresh40combat or natural1–39play.
6. Record every browser response URL/status/bodySHA/size and compare actual bytes with the release checkout; verify206ranges against exact source ranges. Capture page/console errors and failed requests. Only record ordinary ERR_ABORTED media cancellation separately; HTTP/hash/other errors fail. Existing flow screenshots, state observations and saves remain QA-local artifacts.
7. Verify final campaign reward/clear/proof/growth/loadout and41reload using original checks. Page/public network identity result must pass before overall pass.

No runtime injection, request interception, direct Engine.fire/tick, localStorage writes, battle reset, or assertion weakening. Browser observations are read-only; game actions occur through original UI input. Static input-contract scans are not a substitute for later runtime checks.

## Known preparation limits

The actual generated manifest is not yet locally materialized here; schema is read from the official builder. Full identity fetch/runtime response observer has not been run against the new public deployment. Some normal requests may expose unsupported cases; such failures must be reported and investigated, not ignored. The completed localApp replay on628fef36/CI44171893067 does not prove futurepublic runtime identity.

No fresh40whole battle, physical mobile device, performance/framerate, broad art acceptance or allstage state matrix is claimed. After publication, retain separate deployment commit, verifier commit, CIrun and observed response identity.
