# 57KB two-view result and bounded source-owner classification

Actual run44237922977, commit8f6d634ab40cc7f58ee96d96bb57e9b710176562. Artifact14398491306 ZIP SHA25698da85bebee21af8639e79738ac75e98e7f0713242ce7b4c4d42dee8ea3c84ce matches server digest. The preceding run44237642600 failed before Chrome due a stale pre-metadata helper SHA; it supplied no quality evidence. Correct current helper is97fbd09a17d477ff3c62fe4601b6bc4b7b2de76c3e8bc7d447e1932f522715f0, static geometry57,038B; only stats metadata differed from the stale hash. Production remains unchanged.

## Actual strict results

- Desktop-walk:5483 changed RGB pixels; BODYalpha, Scenealpha, background, owner,49walk, original footprint all0 violations. Original production screenshot golden exact.
- Renderer-above1.05001:5401 changed RGB pixels; BODYalpha, Scenealpha, background,49walk, footprint0; raw Native owner14 conflicts2. CI correctly remains failure under that historical raw point gate.
- Exact original blit args/clips and paired BODY tile PNGs were captured. No draw argument was altered. These captures are diagnostic timing, not performance data.
- The319KB desktop1px mask problem does not recur with57KB and its strict original mask passes. The319KB candidate is rejected for cost anyway; further investigation of that obsolete1px is stopped, not marked solved by a tolerance.

## Uniform classification of every raw conflict

All raw conflicts emitted by the comparator are processed by the same original cubic nonzero winding oracle. There is no coordinate exception list. Both conflicts are original topological gray20/9, not an exposed grass face. Original Chrome point-membership agrees with Native14 but original/recentered ±.002source micro-raster has no residual14 fill. The latter alone is not a whole final-pixel proof.

Additional bounded checks cover a larger neighborhood. ActualCTM mapping of7×7 points across1.5×1.5device pixels for each conflict yields98 original cubic samples:56 top20,42 top9, no protected face. Recentered original source raster over ±.5 and ±1source has thin residualAA only: max39–77/255, no>128 grass interior pixels (Native supporting evidence, not new Chrome evidence).

The two relevant original cubics are grass14 segment513 and latergray20 segment741. Across201 source-x cross-sections332.3..334.1, gray20 boundary lies consistently above grass14 by .0000108682..000116408source. Three representative cross-sections evaluated before/between/after the boundaries have original top owner9/20/20 respectively. This is an overlap, not a genuine exposed-grass slit. Original paths remain verbatim.

Bounded conclusion: these two observed conflicts are classified as near-coincident point-hit disagreement over a non-exposed grass/gray AA junction. Raw failure counts and original CI failure are retained. This is not a universal continuous-coordinate proof, and is not automatic acceptance of future collisions: every new raw conflict must undergo the same original-curve/declared-gray/real-walk/raster classification. Genuine protected geometry, unresolved analytical/raster disagreement or changed original foreground outside the declared gray seam remains failure.

## Art and next step

The actual57KB renderer-above image was directly inspected. Central long seam improves, but upper/left vertical lines remain; the actual tile native gate and cached/live transition still pop. The fixed minimum-scale safe core alternative was separately rejected because it restores long lines. No production registration or complete-art claim is justified. End this narrow diagnostic loop and address screen-space continuous composition and remaining native seam coverage next, retaining original source/physics/save data and cost constraints.
