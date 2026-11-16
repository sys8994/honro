# Stage47 continuous cliff BODY candidate

Replaces the boundary-pixel stretch for stage47 only with a registered, genuinely traced rock BODY. This is an artwork correction, not a stage redesign or completed campaign playtest.

## Preserved

- The original stage, terrain, enemies, objectives, encounter triggers, save revision and camera policy are unchanged.
- `near-import.json` remains unchanged. Its stage47 BODY clips `a/b` are restored exactly within the original 1024×1536 art rectangle. All openings remain open.
- Original doorway backing is drawn before the new BODY. Original stair/bridge group `c` is drawn after it. Their shapes/positions are not generated or modified.
- Original image/vector sources remain authoritative for collision and authored surfaces.

## Production

`source/concept.png` was generated using the original stage art and a close-up of its rock style. Earlier candidates with giant flat rock tops and long regular vertical stripes were rejected and preserved locally. The current source uses medium/small irregular fractured rock masses rather than enlarged triangular faces, long stripes or repeated blocks; the brightest nonwalkable upper-face palette entry is reduced below the adjacent midtone, and the next-lightest tone is moderated to avoid false horizontal platforms.

`source/trace/color-raw.svg` and `alpha-raw.svg` are actual Inkscape1.4 traces, not a simulated SVG trace. Native color action: `8,false,true,false,4,0,0`. Pre-smoothing and corner rounding are off. `trace.json` records hashes and original actions.

The full source maps uniformly to art-space x[-1100,2200], y[-3300,4603.7]. A local upper-right exterior registration aligns the generated wall to the original mouth without clipping a rectangular notch. Source gameplay geometry is restored afterwards. Native Inkscape Boolean operations partition only over-budget color compounds and combine the original BODY silhouette with the exterior alpha. The importer and runtime limits are unchanged. Partitioning is for unchanged compound budgets, not a claimed reduction in bytes.

Rebuild with `bash tools/stage47-continuity/build-art.sh` in the repository. It requires existing Inkscape, Python PIL/numpy/lxml/svgpathtools, g++, and the repository Node dependencies. The tiny preloader initializes GTK C++ wrappers omitted by this Inkscape CLI; it does not alter pixels or tracing.

## Verification and status

Current Native Scene review set: `_local/stage47/candidate10/`. It is the production renderer in native Canvas, not a browser or a campaign run. It includes original actors, normal play-scale edge views, desktop minimum-zoom pans, portrait top/bottom pans, and320×1200 extreme aspect coverage.

The same-renderer original-vs-final BODY silhouette crop has alpha MAE0.0051/255 and0 pixels with alpha error greater than128 across1,572,864 pixels. Source stage47 gameplay hash remains `ad5801db74cf8ee6edb6e39831854d3998aa09bd8ee3b74f8d3a1ecf592b43ca`. The original stage/content data was also compared directly with the starting95c3d51 tree and found identical.

The coverage test includes1440×900,1920×1080,390×844,360×800,412×915 and320×1200 using the actual camera policy plus overscan. Full art covers world x[-4400,8800], y[-13200,18414.8]. The diagnostic overview at zoom0.108 is below the game's minimum desktop zoom and can show the far art sheet edge; permitted game views remain inside it.

**Native visual review accepted for integration on2026-11-16.** The exterior retains somewhat larger color faces than the original inner wall; this limitation is recorded, not claimed eliminated. Do not claim browser movement, completed gameplay, master integration, or Pages deployment from these Native results. Integrate only after visual review and preserve later master changes.
