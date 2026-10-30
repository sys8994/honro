# Geometry experiment preservation (not production approval)

This branch preserves small source, control inputs, tools, and failure records only. No canonical world or public runtime is changed. Do not merge this branch wholesale into production.

- Ripple v2 was visually rejected despite 60/60 movement and 4/4 boarding diagnostics.
- Asymmetric v3 received visual-candidate approval only; contour metrics failed and boarding was 3/4.
- The single-facet study is a visually approved study, not a stage acceptance; actual engine diagnostics passed 12/12 movement and 8/8 boarding with zero HP loss, but mandatory contour metrics failed (desktop 27.65%, mobile 43.36%).
- Local 43a9394ee adds a pure-controller seam regression; the subsequent 2d0f36304 unit records the bounded engine study; this is not whole-stage acceptance.

Generated stage31-v2.json and stage31-v3.json are intentionally not duplicated in Git. From repository root, regenerate before tests or facet analysis:

```sh
python tools/act4-pilot/curve-layout.py tools/act4-pilot/layouts/stage31-v2-controls.json
python tools/act4-pilot/curve-layout.py tools/act4-pilot/layouts/stage31-v3-controls.json
python tools/act4-pilot/test-curve-layout.py tools/act4-pilot/layouts/stage31-v2-controls.json
python tools/act4-pilot/test-curve-layout.py tools/act4-pilot/layouts/stage31-v3-controls.json
node tools/act4-pilot/build-skeleton.mjs 31 _local/reports/act4-pilot/stage31/skeleton-v3 tools/act4-pilot/layouts/stage31-v3.json
```

The immutable controls base is `tools/act4-pilot/layouts/stage31.json`, SHA-256 `99b4e3872258fd40af135dbeed2762263d2ff93a78291f2b5c94f62736b8cee4`. Builder outputs remain local draft artifacts. The current playable canonical world stays on the pilot branch, separate from these studies.
