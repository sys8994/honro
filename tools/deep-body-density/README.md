# Deep BODY role attenuation

This is an intentional art composition change, not fidelity optimization against the earlier palette. Source geometry is current optimized native-Inkscape artwork. Physical clips, transforms, bounds and anchors are copied unchanged.

The first100world units next to the actual surface retain the source composite.24 cumulative masks are created by actual Inkscape silhouette union/depth intersection. Cosine-weighted solid opacity steps are spaced25world apart, beginning125world and reaching full base at700world. Adjacent total opacity changes by at most.0653. These are ordinary solid SVG opacity paths, not unsupported gradients. Cumulative masks avoid AA gaps between disjoint bands. Source drawing order stays unchanged because light soil paths may be full backing masks occluded by later rock masks.

Four abrupt steps were visually rejected for visible straight tonal bands.48fine steps exceeded expanded domain budgets and were reduced to24 after material-contrast analysis and normal-scene inspection. Root accepted32fine24 direction, not final campaign quality. Exact domain partitions may still be needed; never raise runtime limits.

33 has a separately recorded nativeInkscape material change: broad golden soil/internal ribbons are muted coastal earth/gray-green. It is not claimed to preserve the old gold colors.

`build.py` creates floor variants31/32/33/37/39/40. `build-cliffs.py` creates34body/overhang and38floor/roof, preserving both upper and accessible underside faces on ceilings.34overhang masks account for the existing outertexture transform[1.02,0,0,1.15,24,-495]; do not apply the mask in the wrong coordinates.

## Hidden geometry optimization

Native intersection trims source curves below702world, while the final fullyopaque mask begins700. Stage31 selected trim saves~70% versus untrimmed finefade, with3600px comparison meanRGBA0.000188, max13/255, alpha128 silhouette exact, noRGBerrorabove16. Other trim trials are retained but rejected:32/37 increasedcost;33/39/40 had sparse raster differences that were not justified by sufficient benefit. Their selected assets keep exact source geometry. Cliff variants are not yet hidden-geometry trimmed. Do not describe allvariants as smaller or fully optimized.

Rejected disjoint-band experiment is kept only for failure documentation. Reordering source backing masks floods the whole body; independently clipped paint stacks create colored seams. A duplicated quiet silhouette underlay also changed edge alpha and was removed.

No invented geological polygons or altered collision vertices are introduced. Boundary masks are technical geometry derived from actual physical contours. Rebuild mirrored domain continuations before evaluating scenes. Review normal/detail/mobile and domain joins. Native asset validation, actual scene review and browser/device QA are separate.
