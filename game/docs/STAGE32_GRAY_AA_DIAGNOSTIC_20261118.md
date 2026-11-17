# Stage32 gray compound edge diagnostic (not production repair)

Source base13d671e3cc80a9e70ab0a299d45860094bfe3181; exact production helper SHA aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953. No geometry, palette, optimizer alias, producer, user save, master or Pages changes. Raw25paths hash76e4fc6c... fixed. Original source contracts and old world<=1700 blanket comparison remain recorded rather than silently removed.

Three independent production Scene controls at two established cameras:
1. current helper unchanged, requires exact prior2PNG hashes;
2. gray-outside: only gray selected fill moves outside enclosing full-path clip; retains original apron;
3. solid-color: current full-path clip, per-path original opaque color instead of field, same gray overpaint. A diagnostic to distinguish color/material effects from coverage, not an implementation candidate.

For each original cache tile seen by current Scene, capture pre-BODY ImageData, transform and paint state. Replay current/gray-outside/solid helpers on independent canvases, require current replay bytes equal actual current BODY draw. Only this exact-match gate lets tile coverage comparisons claim the same raster grid. Tile diagnostics are not used to alter production.

White/black source-over masks preserve the order of all25 original raw paths and apron at the exact cache transform. Grass12..17 and roads21..24 use final visible contribution, not a union which would incorrectly label overpainted underlay as protected grass. Readback red on an opaque black canvas gives0..255 contribution; it is not a recovered alpha from the opaque final scene. Canvas source-over uses premultiplied compositing internally; exported scene ImageData is straight RGBA. Opaque contribution255 is separated from partial1..254. Source path geometry, source fill palette, original order and apron stay immutable. Final AA-edge RGB may depend on allowed non-walk background colors and is measured explicitly, not waived or called identical. Gray opaque visibility mask uses original full compound clip solely to identify255 coverage, not to define a corrected AA edge.

For every selected gray compound: count gray coverage>0 while full coverage==0, plus gray coverage greater than full. These are silhouette/hole-leak indicators; direct fill must not be accepted merely because it reduces AA lines. Tile samples do not prove whole-source geometric containment. Source/provider/element evidence is exported for additional full-source checks and major-object masks. Collision, walk edges, stage, battle, source and camera are fixed. Major-object source identities and bounds are evidence, not a claim that all object edge pixels have been protected by this first diagnostic.

No mask/result is an art acceptance. Any opaque protected-color change or new silhouette must be investigated; no tolerance was added to old tests. The earlier all-upper-pixels gate would freeze some defective non-walk material edges, whereas source-defined roads/grass/walk/object protection addresses user intent. This diagnostic reports both, and a production change needs explicit reviewed semantic requirements and real before/after images.
