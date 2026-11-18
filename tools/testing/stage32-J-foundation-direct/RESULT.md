# FOUNDATION-only direct display probe: not accepted

Only the native FOUNDATION display changes from one clipped shared bitmap to the original 12 field path fills under the same silhouette. BODY, material generation, original source, physics, cached renderer and all other helper code remain unchanged; contract.json reverses the single replacement exactly to J 6823.

Native evidence only: maximum exact; renderer-above 179 RGB pixels, maximum 2, alpha unchanged; cached exact; native-walk 198 RGB/alpha pixels, maximum RGB 35 and alpha 177. The native-walk alpha changes lie at x1117..1330/y711..749, baseline alpha 8..244 becoming 72..254. These are final transparent-terrain boundary pixels, not an authorized gray-interior tolerance.

Likely compositing explanation: the original offscreen field is combined first and silhouette coverage is applied once to its bitmap. Direct painting applies the silhouette clip to each of 12 source-over fills; overlapping field contributions can accumulate clip AA. Same path geometry therefore does not preserve boundary alpha. This causal interpretation has not been independently tested in Chrome.

No Chrome quality/performance claim. Single Native cold timings are not a benchmark (even unchanged cached code has large timing variance). Material preparation remains, so eliminating the first bitmap could merely move deferred raster/upload cost to the first BODY bitmap. No product adoption or remote modification.
