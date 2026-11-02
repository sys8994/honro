# Workshop selected-stage payload review

Source reviewed: `dd65fcec1` (common documentation head `31f8d8663`). No library filtering or other execution change was integrated. The existing full-library behavior is the safe fallback.

A static transitive exact-string scan of the actual current default project export, SHA-256 `78f15c7a51f6895640aa9d1592426a96ff57f450c9c82a91ec1f79e66025565d`, finds the following potential selected-stage libraries. Sizes are compact UTF-8 JSON, not measurements of browser memory or evidence that filtering is safe. The export's complete 1,147-asset library is 92,046,521 bytes.

| Stage | Candidate assets | Candidate bytes | Explicit dynamic reference |
| --- | ---: | ---: | --- |
| 2 | 8 | 40,049 | Geology and legacy renderer also read runtime-global project data |
| 32 | 6 | 3,138,511 | `vectorShelterDoor.assetId` |
| 36 | 6 | 3,817,634 | `vectorDoorAssetId` |
| 40 | 15 | 15,467,761 | `vectorReturnBoatAssetId` (`approved40:ferry`) |

These are only candidate closures. Runtime also resolves hard-coded and constructed IDs (for example stage 2's `act1-scene:rooted-pine`), geology references, and boss templates from `G.HONRO_PROJECT`, not exclusively from the selected project's stage tree. String scanning cannot prove an unknown runtime lookup is absent, and merely filtering the project input leaves the game iframe's own global library intact.

In an isolated actual Workshop UI stage 32 entry, the candidate's door asset `approved32:wood-door-extract` was given a test-only `params.qaProviderMarker` before the run. The normal Playtest's `customMap.project.library` contained the marker; its iframe `HONRO_PROJECT.library` had the same asset ID without it, and still contained all 1,147 assets. Campaign owner bytes were unchanged and no page error occurred. The runtime `nativeShelterDoor` path reads the iframe global library. At this initial state its render preconditions were not satisfied (`nativeDoorAvailable=false`), so this probe establishes a provider mismatch, not an observed door-render failure. Likewise, source inspection shows the stage 40 ferry path uses that global library; no new stage 40 end-to-end execution was claimed.

Consequently the required guarantee for edited dynamic assets and safe fallback cannot yet be established. Changing only `playProject.library` would neither resolve the provider mismatch nor remove the iframe's global library. Do not substitute a naive exact-string filter or claim its calculated bytes as measured RAM savings. A safe future design needs an explicitly scoped Playtest asset provider with declared dynamic dependencies and lifecycle/restore isolation, fallback for unknown references, and differential runtime/render/restore tests for custom assets, doors and escort before any full-size retry. That provider design requires additional review; it is not implemented here. This remains a preexisting large-project limitation, not a demonstrated Act 4 regression.

Reproduction: `probe-workshop-reachability.py PATH_TO_EXPORTED_PROJECT` gives the static candidate calculation; `browser-workshop-door-provider.py [BASE_URL]` uses the locally restored candidate fixture and an isolated browser context. Results and the small custom-project provider probe are in `evidence/workshop-provider-review-20261031.tar.xz`; the source UI export and candidate payloads are not duplicated in this evidence archive.
