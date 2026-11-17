# Stage 7 ordinary Chrome SVG study

**Not a game Scene, VectorArt, save, physics, campaign, mobile or deployment test.**

This loads two self-contained SVG sources into fresh Chrome Image objects and renders them into a transparent Canvas. The unmodified original source and candidate are rendered at five exact viewports. The same browser is used for interleaved baseline/candidate timing. Real performance.now is used, never virtual time. The script starts installed Chrome with its normal sandbox, creates a fresh isolated temporary profile, and uses loopback CDP only. It does not read user sessions or contact external hosts.

- Full-art diagnostic 1280x1198, viewBox -1200 0 3848 3600.
- Portrait-left 390x696, viewBox -1086 -798 2172 3876.
- Desktop-right 1331x763, viewBox 362 518 2172 1245.
- Join 2300x800 and source-contact 4600x1600, viewBox -450 750 2300 800.

`results.json` includes first-render per view, 7 repeated draw+readbacks, six interleaved fresh-Image pairs, and eight changed-viewBox pan pairs. Fresh-Image is NOT cold browser startup. Pan includes SVG reparse/decode and is NOT in-game pan cost. Canvas reuse may cache SVG rendering, so repeated draw is NOT native VectorArt performance. These timings are diagnostic, with no invented release or phone-FPS threshold.

`check.py` compares authoritative original Chrome PNGs, not Native renderer PNGs. It preserves all original opaque protected pixels and requires changed protected pixels to intersect the explicit old near-left gap footprint, source [8,991,13,1015.5]. Raw counts and failing coordinates are saved. The pixel footprint rule is explicit: a portrait pixel originating at y989.64 can cover source y991; this is NOT a blanket alpha tolerance. It also checks both 24-source under-contact bands are alpha>=128 and connected to the main body. Original source x>=8 and the real contact line are not redesigned.

The new left outside-source visual ridge replaces only a study-created copied RGB band; the real SOLE y991 and its continuous support remain unchanged. No collision data or runtime asset is injected here.

Visual art approval and all game runtime integration/performance tests remain outstanding even if CI exits green. PNGs must be reviewed, including maximum zoom-out and extreme side silhouettes. The workflow needs only contents:read and uploads test artifacts. It does not commit, push, merge or deploy.

Run locally where normal sandboxed Chrome is permitted:

    CHROME_BIN=/path/to/chrome node game/tools/stage7-svg-study/run.mjs
    python game/tools/stage7-svg-study/check.py

A Chrome sandbox/socket error is a hard failure, never a reason to disable the sandbox. No local Chrome success is claimed for the preparation environment.
