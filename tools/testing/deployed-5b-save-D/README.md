# Latest5b → isolated Stage3/7 candidate D save/continue validation

Ready for research CI registration, NOT YET EXECUTED. Baseline 5b2edf0b868a6f4ab656574b036586304eb12808; candidate D 3700686f1556b5fbc8f3c4fe93413b957d3650bb, parent5b. D is the independently scoped nine-source Stage3/7 candidate; Stage32 remains the deployed5b control, not the rejected32 research candidate.

This separate active package retains the successful44288167626 codec/App test body, including pre-chdir absolute payload path fix. It does not reuse C results as D results. Research workflow runs on inspect/stage32-scanline-20261118 and checks out pinned D; no workflow on D source branch is needed. Original frozen preparation remains unchanged.

Stages3/7/32: official synthetic old5b snapshots must roundtrip, restore directly onD, recompact and restore again exactly with no normalization. Real official App.continue on5b/D mounts the same encoded snapshot. Marker/HP/position/size and full battle must agree at mount and after three explicit Engine.tick and Mission.tick calls. Terrain stays unchanged during ticks; official App.stopBattle releases current scene/engine. In-memory storage only, RAF paused, no actual user saves or product modification.

This does not validate autonomous App.frame, long gameplay, all historical saves, full-profile migration, artwork or performance. Diagnostic PNG is not image-ready visual acceptance. Whole-release/D success must await actual evidence. Source-scope, fresh-model and visual/performance gates are separate.
