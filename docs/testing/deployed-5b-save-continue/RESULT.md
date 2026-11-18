# Latest deployed 5b → integrated C synthetic save compatibility

PASS: actual Chrome CI 44288167626; research f5acafac6115ca5db9f7d41e36b453ca5d686b66. Artifact 14420551679 ZIP SHA256 837e0d52602d2dfa5e855c4827250480a75846e958568575c9d41df3c2d729e6 independently verified. Both result checkers rerun successfully against downloaded evidence.

Baseline 5b2edf0b868a6f4ab656574b036586304eb12808 → candidate dbb25e21e075a495581ddaf8e2c0e615fe2e621e.

- Synthetic stages 3, 7, 32: original official codec snapshots restored directly, re-compacted and restored again exactly. No normalization, actual user storage access 0.
- The same encoded snapshots passed real official App.continue on baseline and candidate. Mounted battle and battle after three explicit Engine.tick and three Mission.tick calls matched exactly across versions, including monster revision/marker, HP, position and size. Terrain remained unchanged during the bounded ticks. Official stop released the current engine and scene.
- RAF remained paused, synthetic profile/Map storage only. This is not an autonomous frame loop, long playthrough, full-profile migration or proof about real user saves. Auxiliary screenshots were not image-ready visual acceptance captures. Performance and final release remain separate gates.

Historical CI 44287326787 remains failed: codec passed, then the continue fixture read its payload relative to a changed working directory. The one-file correction resolves the path before chdir; no product source or comparison criteria changed. The complete suite was rerun above.
