# Estuary native candidate

Raw terrain-source.png / terrain-traced.svg are immutable copies of root-authored native inputs.

Owner approved palette revision: #8c9d5c→#8fa15d and #172e52→#183053. Adjacent same-color paths are unioned, not redrawn or blindly split. All five broad native faces remain. The raw-vs-unioned raster comparison includes antialias compositing changes (alpha max44 on1171 source pixels; opaque RGB max17 near edges), so it is **not** claimed to have only4/255 pixel error or zero geometry error. See palette-report.json. Direct source before/after and overview/normal candidate pixels were reviewed; final runtime acceptance remains pending.

The source native top is measured from base path14. .015 source flatten + sampled .04 vertical approximation is used only for a contact proposal; original curves remain in the art. Fit preserves natural curves between explicit geographic anchors rather than copying graybox straight lines. Upper depth2.6, lower continuous affine mesh reaches1855world. This is intentional art fitting, not an optimization error. No synthetic art, bottom flat-color cover, clipping, terrain edit, actors, vector far background, or gigantic BODY reuse.

Candidate art: fitted-candidate/bank.json, 5 paths, maximum12281chars,33683bytes. Native map geometry keeps all contours. Independent3200point×5paint mapped occupancy test is recorded separately; numerical bounds do not imply visual or gameplay acceptance. World top in fitted-candidate/bank.top.json is a proposed collision input requiring geometry owner validation. No old roster SHA may be adopted; package builder waits for independently rebased roster and geometry normalized SHA.

Reproduction: clean-estuary-native.mjs → import-compact-native.py → refine-body-contact.py → fit-estuary-mesh.py → test-native-mesh-fill.mjs → package-estuary-body.mjs. Local preview renderer is actual HonroVectorArt, but not the full gameplay Scene. Main stage/art approval remains root-owned. Props and final jetty are separate follow-up units.
