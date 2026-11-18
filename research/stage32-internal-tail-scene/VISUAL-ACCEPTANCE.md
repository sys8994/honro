# Bounded final-model visual review plan

Candidate:7843-byte internal join/tail clip; original source and physics unchanged. This is a review checklist, not a passed result. Actual nine views and their unchanged baseline must be read together. Keep current frozen candidate unchanged while collecting evidence.

## View-specific checks

- Portrait overview and bottom at the minimum camera scale: all original terrain mass, transparent openings and paths remain present; no new broad pale/gray patch, isolated bright line or clipped grass top. A subpixel seam disappearing is acceptable; a solid terrain gap closing is not. Compare full frames, not only the left target.
- Landscape overview and bottom: same silhouette/opening requirements, plus preservation of the broad original gray/brown layering and road contrast. No new axis-aligned or rectangular paint boundary from the authored band.
- Gray-left .6: follow the whole target from upper grass tip through central vertical contact to lower-left diagonal and gray/brown contact. The internal green/pale leakage should not reappear at any join between the old correction and new band. Natural material shading is allowed and should not be flattened.
- Maximum1.65: inspect the thin connected grass-tail end and the three small recolored overlap regions; large exposed grass must keep its shape and natural tip, and the deliberate tail truncation must not look like a square cutoff or isolated green dash. Inspect both ends of each cleaned line and the neighboring gray/brown strata. A remaining conspicuous line in the declared target is incomplete, even when automated gates pass.
- Renderer1.04999/1.05001: compare corresponding world regions, not raw whole-image equality across different camera scales. No new correction-on/off pop or reappearing long line at the tile/live renderer transition. Ordinary raster resampling may change pixels; classify it separately rather than claiming exact cross-scale identity.
- Desktop-walk: preserve the normal exposed road/grass/steps and play region. Zero change is expected when the declared join is outside the viewport. This fixture does not prove actual player movement or a full gameplay pass.

## Explicit protection classes

1. Original source descriptors, physical bounds, save source and walk/road geometry remain unchanged. Source equality is necessary but does not alone prove rendered foreground preservation.
2. Final terrain is the original transparent FOUNDATION-union-BODY plane, not an opaque sky-composited Scene. Its alpha and original transparent support stay strict. BODY asset alpha itself may change only inside the independently rendered direct-camera join support; report its changed count rather than hiding it.
3. Original large exposed grass, roads/steps, other pale foreground and other material regions are not broadly reclassified. Nine source-owner samples per changed pixel and source geometry checks are bounded evidence; they are not an exact proof of every original foreground contribution in every possible filtered mixed pixel.
4. Exactly four declared, pinned artist regions intentionally change original material contribution: pale .09477583source²; isolated grass .10881839; mixed diagonal .68786069 (analytic gray9/grass12/grass15, not puregrass12); connected thin tail .18837201. The last is genuinely connected to the large grass component. The exceptions are the exact region geometry, never a whole original path index or all green-looking pixels. Raw sample counts stay visible and only other-region violations remain strict failures.

The opaque-white clip replay is a conservative support oracle for the actual clip/bitmap primitive and recorded blit. It establishes possible change support, not actual source material alpha/color correctness. Final terrain alpha, original baseline hashes, exact raw source, other-region checks and direct visual material assessment must also pass. No generic RGB1 waiver, coordinate exception or alpha tolerance is used.

## Completion boundary

These nine views can support a bounded art/protection result for the declared left join. They do not alone establish phone60fps, clean wholeScene cost, normal Workshop/Game loading, save/reload behavior, all-stage regressions or deployed master/Pages. Those remain separate checks. SS is retained: existing ablation shows residual effects outside this join across the map. Do not remove it based only on the improved left seam.
