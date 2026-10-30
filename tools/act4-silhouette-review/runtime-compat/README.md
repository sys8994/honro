# Act4 dawn and authored BODY edge checkpoint

Shared runtime now contains the formerly isolated, reviewed Act4 dawn renderer and explicit authored BODY edge control. Only `act4Dawn` / `act4Sea` defaults change. Actor/HUD rendering is untouched.

`params.semanticLayer === 'BODY' && params.silhouetteUnderpaint === false` opts out of gameplay silhouette underpaint. It does not suppress source fills or actual physical contact highlights, and is not an art approval. Default, explicit true, PROP false, string `"false"`, legacy revision behavior and background behavior are regression-tested. Sources must prove opaque BODY coverage independently; this option cannot cure native closure paint.

Tests:
- `node tools/act4-silhouette-review/test-dawn-runtime.mjs`: 27 non-Act4 key/mood raster results exactly match the retained prior request function; both Act4 default paints change.
- `node tools/act4-silhouette-review/test-body-underpaint.mjs`: default and semantic opt-out cases pass, fill retained.

Runtime digest: `264b42d9b85f63847877ad839c67365a9b63b06b34a27cf9c84d53d9307ece2e`.

**Old runtime-bound evidence remains historical and is not rehashed into a new approval.** Native QA/browser owners were notified to restart on this actual source runtime. Current world/art package is still pending review; production release guard remains unchanged and blocked. This checkpoint does not approve or publish the redesign.
