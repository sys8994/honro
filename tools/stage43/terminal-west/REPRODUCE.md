# Stage43 west short terminal reproduction

Use the preserved pre-clip original west SVGs, not west-v2 JSON or an already tapered candidate.

```sh
python edit-west-terminal.py \
  --west-color path/to/exterior-optimized.svg \
  --west-alpha path/to/exterior-mask.svg \
  --source path/to/original-source.svg \
  --out path/to/new-output
python path/to/import-native-clip.py \
  path/to/new-output/color.svg path/to/new-output/alpha.svg \
  --config path/to/new-output/config.json --output path/to/new-output/asset.json
```

The generated config sets `params.silhouetteUnderpaint=false`, as in the existing west asset. Requires Python+lxml+svgpathtools+numpy and Inkscape with the existing `/tmp/honro-inkscape-headless-init.so`. All input paths may be relative. Only `--out` is written.

The original inputs were `stage43-recovery-west-study/exterior-optimized.svg`, `exterior-mask.svg`, and the unchanged source.svg. The actual deep upper-left is x4.7631578947/y710.02 in source coordinates. Existing strip abovey680 is unchanged. Below it, preserve the original inward contact while narrowing only the exterior edge toward that upper deep contact. End overlap at y710.12, not y750. Actual Inkscape difference protects original alpha and intersection limits the terminal. No new paint is drawn.

The final west asset is `shared/assets/environment/act5/stage43-continuity-west.json` from the repository root. Original source SVG remains separately preserved in the source study; its SHA256 is d024022a56991bc56e6d507698a6683c11d47915984dfcf2ca02b936c1d927b4. The two small original west inputs are included here. The first point-convergence experiment in the parent v2 folder failed because it pulled the inward edge away from original alpha; it is not the adopted input. Counts and limits are in `report.json`. This is a geometry edit, not an optimizer nonincrease result. Integration/native1.65 and.45 previews are in the preserved local study `stage43-west-terminal-taper/v2/surface-merge/{native-default,native-wide}`.

The preserved headless initialization source is `../honro-inkscape-headless-init.cpp`. On the same Inkscape1.4 environment it can be rebuilt with `g++ -shared -fPIC ../honro-inkscape-headless-init.cpp -ldl -o /tmp/honro-inkscape-headless-init.so`. This initializes the CLI object wrappers; it does not alter tracing or vector geometry.
