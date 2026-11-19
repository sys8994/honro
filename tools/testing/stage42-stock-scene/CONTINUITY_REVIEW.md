# Stage 42 continuity proposal, not approved

Source: original production master 1e043b09d4ce107e1d2dcf70fe2274dff7098476, not any optimized candidate. Scope: Stage 42 decorative BODY only. No game, save, collision, camera, runtime, branch, master, or Pages changes.

## Observed defect and proposal
The original stock Scene's 18-camera proof shows finite geological BODY ending in a floating underside. It is present in the original baseline, not caused by the rejected hybrid epsilon candidate. Do not conceal the defect with a camera change.

New image-guided continuous geology fills the underside and exterior using existing slate geology and curved rock planes. Actual Inkscape 1.4 color tracing and independent alpha tracing produced native-v2-slate/raw.svg, 1,237,065 bytes, SHA256 4dcc0d6ad9de3beeedb963d0d2da298d0109db10abfbf76550361deee47d7e87. No simplification was run. The first white-matte trace had a pale rim and was not selected. Transparent color-input RGB changed to slate for v2, but source RGBA and binary native alpha were retained.

## Local composition
Run `python stage42-continuity-study/compose-study.py` from workspace root. contact-composition.svg registers the 1403x1121 native trace to artwork coordinates [-1200,0,4500,3600]. The first two canonical BODY underpaint contours provide the exact central upper contact boundary. Only their decorative outer closure coordinates extend from x=-338.11/2300 to -1200/3300 and bottom1169.33 to3600. Canonical BODY is behind the new face, not over it; canonical SURFACE is above. The original SURFACE JSON is unmodified. This removes the old finite underside outline from the local composition.

## Pending / not accepted
- This is isolated SVG composition, NOT actual game Scene. Existing near artwork/props and runtime SURFACE y700 clipping are absent here. Some tiny transparent flecks remain around west stair contact. Must reproduce or dismiss using actual stock Scene, not assume fixed.
- New geology material scale and lower extent require same-camera desktop/mobile review, including extreme sides, top/bottom/corners. No deployment approval.
- Native boolean contact flattening/import remains pending. Avoid redundant runtime concave clips that previously made opaque rectangles; validate in actual Canvas.
- Retaining the full original BODY as underlay increases render cost. If geometry is later extracted for overlap-only support, preserve native booleans and test actual Scene. No optimization authorized now.
- Current finite extent is a study, not a proved coverage bound for every supported camera/aspect ratio.
- No normal gameplay, collision landing, old-save continuation, asset budget, load-time, render-cost, or public-site verification has been run for this continuity proposal.

## Earlier optimization history
Hybrid18BODY/12SURFACE rejected for conspicuous right/lower angular distortion. Clip-only CI44622020170 completed as evidence with no noticeable difference in 18 fixed views; it does not repair continuity and is NOT adopted. No further optimization publication or merge is authorized in this work.

## First actual Scene rejection and corrected import representation
Run44624532695 stopped with `Invalid vector path`, before candidate capture. No quality pass. Canonical stock guard remained intact.
The corrected source splits ONLY path6 and path3 (native color ordering indices6,9) using actual Inkscape intersection at x701.5 with2-source-pixel shared interior. Other10color paths remain verbatim. Official `import-svg.py` preserve_compound uses unchanged dParts schema as one fill operation. No simplification. Native1403px comparison: alpha difference0pixels; seam strip maximumRGB2/255; overall9901RGBA differences,1pixelRGB>16(max29). Geometry not claimed mathematically identical. Enlarged seam strip inspected without visible gap/hole. Full actual Scene rerun required.
