# Source-fixed semantic clip study

Status: Native SVG study, no production/Chrome/master/Pages change.

## Root cause and correction
The full diagnostic uses1280x1198 viewBox[-1200,0,3848,3600], source scale0.33264. It is a whole-art diagnostic, NOT the real portrait camera scale0.17956 or desktop0.6128. At pixel415,355 ~=source47.59,1066.78 the prior resolution-dependent SVG morphology produced grass protection255 and editable0, retaining original artificial closing color#251d25. Source1x grass protection at y1066 contains only14pixels, not a broad flat closure. Therefore shrinking the entire grass crop again would be the wrong remedy.

Freeze the source1x semantic halo geometry: alpha>0 cell union from the original vector mask, restricted to y>=912 because the nonwalk envelope is always below this. Add one source-cell conservative coverage reserve, extract boundary loops and remove ONLY collinear vertices. No paint image is edited. The final complement uses one nonzero path,11boundaries/2374vertices/21236characters, with reverse winding for grass holes. It is nested inside the native nonwalk envelope clip. SVG multiple child path union would not implement subtraction, so all boundaries deliberately reside in a SINGLE path. No active SVG filter/luminance mask is used for the center field now. Its raster image is still a study reference, not a production VectorArt asset.

Nonwalk envelope uses original root-floor+32, comprising semantic24 plus8source raster-AA reserve. The initial+28 and unexpanded fixed halo are preserved in build-before-reserve.py and verification-before-reserve.json. Source original paths/geometry are unchanged. Runtime VectorArt path/clip shape is compatible in principle (one21KBpath,under60KBperpath), but actual runtime execution remains unverified.

## Verification
Five independent Native views: full0.33264, portrait-left0.17956, desktop-right0.6128, join1x, source-contact2x. All protected central source pixels above local actual floor+24 are RGBA-identical to ORIGINAL (not merely prior study). All actual opaque warm grass pixels RGB-identical.

Two diagnostic distinctions are explicit rather than hidden tolerance relaxations:
- Portrait6pixels differ from the previous study, but restore the exact original RGB. The previous filtered mask was leaking new field near its envelope AA; original comparison is the correct protection reference.
- At2x,10warm-colored pixels at sourcex23.5..31,y1072..1072.5 are changed. They are the known artificial perimeter closure, not actual grass (actual descender ends1066). They were already changed identically in the earlier study; record raw count10, artificialClosure10, semanticChanged0. No broad warm-color exemption.

The opaque game background views were directly inspected: the central left flat black closure line is gone. No physical ground,13foothold or source core changes. The separate left side24source restored rock band remains an art issue in this checkpoint; see left-band study, not a silent acceptance.
