# Stone cover role-density revision

This is an intentional art-master redesign of the existing optimized stage35 stone-wall source, shared through two scoped variants for32 and35. It is not a fidelity-preserving optimization of the old appearance.

Native Inkscape1.4 split the six interior compound paths (base path7 left intact), removed345 small interior components (bbox area<500source px² except long thin seams), recombined surviving winding paths, then united adjacent stone-face colors and shadow colors. Four colors and five source paths remain. The first pass is retained because reducing moss speckles alone still left excessive face transitions. Existing optimized contours remain; no further approximate geometry reduction was needed to meet runtime limits.

`source-optimized.svg` is immutable source; `split.svg` and `split-bounds.csv` retain the native split and measured component identities. `tools/stone-cover-density-v2/edit.py` replays native cleanup from those inputs. `art-master.svg` is the selected second-pass design. `import-config.json` and the conservative SVG importer produce `texture-asset.json`. `assemble.mjs` restores the original physical backing/clip and vertical texture-fit wrapper and emits stage32/35 scoped assets. `manifest.json` lists exact replacements. No existing global assets or physics were changed.

Runtime validation:17 nodes, max path49474 chars, no validator errors. Same32/35 compiled collision arrays deep-equal before/after; original default material intentionally retained. Physical clip/backing paths exact, but antialiased overlap pixels are not promised identical. See validation.json for actual alpha differences.

Actual production Scene was rendered at.53normal/.53portrait/1.1detail, with camera assertions. Reviewed: quieter moss and stone-face detail, retained readable main stones/joints/broken top. Source texture still inherits the earlier vertical fit and exact physical clipping; this revision does not redesign that shape. This is not whole-stage visual approval, browser QA, mobile hardware performance, or a released campaign.

## Natural proportion selection

Selected final scoped files are now `stage32-natural-asset.json`, `stage35-natural-asset.json`, and `stage37-natural-asset.json`; use manifest.json. Uniform source scale.495 replaces old x.24/y.495 stretch (2.0625relative aspect). Source geometry unchanged and cropped once inside identical backing/physical clip. Smaller uniform.33 test rejected due exposed flatbacking triangles at top. Larger uniformcrop restores broad naturalstone proportions without duplicategeometry, nodes or increasedruntimecost. See natural-proportion-decision.json and actualscene views.
