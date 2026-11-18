# Bounded SS-replacement study, not product acceptance

The final 7,843-byte helper remains the baseline. Removing SS is an ablation only: left/maximum/minimum change 409/239/350 pixels, maximum RGB delta17/22/18, alpha/background0. This still exposes uncorrected regions and is not accepted.

A first author-time contour band uses original grass12..17 boundaries, width0.75 source, intersected with topmost gray and world1420..1716. Original visible/road/walk/BODY/foundation overlaps outside authorized gray are zero in the GEOS model. It adds one field bitmap composite, no runtime readback or new buffer, and removes SS for comparison. Its117,117-byte path has41 components. Native final differences against SS-on are1770/1486/542; alpha/background remain0, but pixels equal to the original grass palette change at left3 and minimum1 (paths12/13 share a color and must not be double-counted). Palette equality alone does not prove fully opaque exposed-grass contribution; these pixels remain unresolved pending original-primitive contribution tags. The zero-overlap geometric model alone is insufficient for raster protection. This candidate is NOT accepted and should not be promoted to full CI merely because maximum zoom looks clean.

Next structural model must distinguish three original display roles, not simply classify every gray owner as field material:
- original field-colored visible regions;
- original retained-color graySubpaths (these are repainted with original fill after field, NOT gray replacement regions);
- original native pale, exposed grass, and road contributions.
Original paths18..20 cover some grass12..17; moving all protected paths to the end or start does not preserve this ordering. Original source25paths and physics remain stored unchanged. An author-time display recipe must retain original compound fill rules, apron and holes, and explicitly account for original foreground coverage. Subdividing compound paths or adding clip+bitmap may alter AA even when analytic regions match; final alpha, opaque foreground, and mixed foreground contribution must be tested independently.

A practical next step is a bounded source-role recipe, not a full-map opaque gray paint. Derive final visible field mask and retained-color faces from original path/subpath order, then test replacing repeated field clips with one composition while retaining real foreground and original terrain union. All prior SS-ablation differences outside the new declared scope remain failures or unresolved items, never blanket waivers. Actual nine views, low/high zoom, tile/live transition, original roads/physics/save preservation and whole clean cost are required before adoption.

Native source comparisons are not actual Chrome Scene/filter proofs. Existing mixed-AA sample counts are diagnostics, not universal contribution proofs. No production/remote change has been made.

## Follow-up original-primitive tag diagnosis

`tag-proof.cjs` changes only original source fill colors to white for the selected original grass/pale/road paths and black for other source/material paths. It executes the existing helper primitive order, including graySubpaths, original clips, transition fill/pattern logic and existing native/internal joins. Both versions disable SS to avoid recomputing nonlinear eligibility on tag colors. This is an incremental original pre-SS contribution diagnostic, not a claim of frozen-SS/fullScene equivalence.

The four palette-matching problem pixels all have original grass tag255: left(648,262) and(646,263) become246, left(1292,419)239, minimum(149,362)227. Their original actual RGB equals a protected palette, so the unmodified baseline SS branch skips those exact pixels. This gives a stronger reason than palette equality alone: the new band itself reduces fully opaque original grass contribution. The current band cannot be adopted. Global tag diagnostics also show minimum-view pale mixed contribution loss; roads remain unchanged. Maximum view has no pale/road nonzero tag pixels, so its zero-change counts for those roles are vacuous, not positive coverage evidence.

Next work should preserve foreground composition structurally rather than waive these pixels or make pixel exceptions. Independent source-role/primitive review is pending.
