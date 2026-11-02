# Act1 BODY integration candidate

Opt in with HONRO_ACT1_BODY_CANDIDATE=1. Default builds are unchanged. The single Stage1 candidate is non-colliding art; the original stage terrain, units, camera, objectives and saved-game map revision are unchanged. It is NOT production accepted.

The new body-specific raster was generated from the canonical Stage1 layout and the approved vector style, traced using Inkscape with eight fixed semantic colors, then bounded absolute-grid serialization. Authoring SVG: art/act1-near-vector-candidates/stage01-body-v2/body.svg on work/act1-terrain-vector/20261102. This branch carries only the compiled runtime candidate, not duplicate raw attempts.

The candidate uses the original terrain-domain solids and a four-world-unit inset below the source walk edge. Its common base color continues through the existing terrain domain; no new physical skirt, collider, actor rescaling or camera restriction was introduced. Separate boulders, breakable branches and actors retain their native painters. Normal native start/middle/east/mobile views are usable; actual browser and gameplay acceptance remain separate.

Integration belongs in the existing Stage1 authoring pass. An initial shared/build.mjs hook changed the global runtime digest and correctly failed the Stage31 build guard. That unnecessary global edit was removed; shared/build.mjs is byte-identical to master. No gate, probe result or stored evidence digest was changed. The unchanged gate and ordinary npm build pass with this localized, opt-in art authoring path.

Checks: node tests/act1-body-candidate.mjs; HONRO_ACT1_BODY_CANDIDATE=1 npm run build. CI uses fresh official UI entry and actual keyboard movement/jump. It does not inject health, teleport actors, or claim combat completion. The geometry source lock fails closed on drift. Default is off until final review and release authorization requirements are satisfied.
