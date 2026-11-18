# Stage32 isolated buried-component Canvas primitive diagnostic

Test only. Original source vector SHA is pinned; no production helper, original assets, physics, save data or other stage changes. This is **constant-gray source-only**, not actual Scene, field-material, SS or performance acceptance.

## Selected component
Original path13 subpath17 and path17 subpath22 are identical 512-byte closed contours. GEOS source-role analysis: area1328.658975 source², bounds1342.7031,781.9082..1406.291,837.90234, no holes; fully behind later gray, visible-protected/walk/road overlap0. Distance to BODY/apron54.199736source; visible-protected25.771001source. Curves/source assets remain immutable. The original whole compound solid fill is retained. Only this duplicate hidden paint gets an immediate source-atop gray fill, once at each original occurrence.

## Why actual Chrome is necessary
Native pattern vs solid shader control changed alpha even when color was uniform. Splitting compound paths also changed remote AA pixels with original colors. Extra save/restore under an existing AA apron clip caused non-local changes in isolated source-atop and source-over trials. Manual restoration of fillStyle/composite state eliminated those changes in initial Native probes. This is evidence of a backend/state-path difference, not proof of a Chrome bug or permission to waive alpha.

One browser page tests7scales (.05,.125,.25,.35,.6,1.05001,1.65), at world center3020,1820, 1331×763. It compares baseline, original-color no-op, gray with save/restore, and gray with explicit state restoration. Source-atop no-op is not required to have zero RGB inside the hidden target: it can change hidden AA mixture; alpha/background/outside-target must remain exact. Save/restore variant is diagnostic and never masks failures in the manual candidate.

The independent support mask uses only the selected original subpath, original apron and the same direct source transform. Every changed pixel outside support, original transparent background change and alpha change must be0. True visible-grass contribution is separately tagged using the existing GEOS visible-protected oracle (source flatten .005); original road/pale tags must remain exact. This finite raster/approximate semantic evidence is not a universal continuous proof. Artifact is written before assertions.

Eight baseline/candidate images at.6/1.65 permit direct visual inspection. The isolated right-side closed green outline is the only intended improvement; the manual source-atop local image still retains a fainter line, unlike the rejected partition prototype. This is not art completion. Left long seams and Stage32 overall art remain incomplete. No production adoption or deployment is authorized by this probe.
