# E Stage3-only actual validation: structural pass, scoped visual review

- Source: E abdef6fc12042714f02d8ea2bf3b2c80757273f0 against master 5b2edf0b868a6f4ab656574b036586304eb12808.
- CI 44292746267 succeeded. Artifact 14421249013 downloaded, ZIP SHA verified, paths checked; local actual checker rerun PASS.
- Both official Game/Workshop builds use original default release policy, no HONRO environment override.
- All50 own codec exact. 49 whole fresh battles exact. Stage3 only explicit approved body artwork differs and full candidate asset matches independent approved oracle. Units/terrain exact. Latest master monster source preserved.
- Paired actual Scenes: Stage7 and32 normal/actor-free pixels exact. This proves E leaves them unchanged, NOT that existing Stage7 or32 artwork is satisfactory.
- Official App launch/mount/stop 3→7→32→3→menu: frame camera/physics paired exact; Stage7/32 App PNG exact. Baseline and E each repeat first/last3 camera/physics/PNG exactly. Synthetic storage only, paused RAF, not autonomous playthrough.

## Direct image observations

Actual baseline/candidate Stage3 overview: baseline visible large rectangular bottom cutoff and lateral flat bars are removed in E, with continuous deep terrain below the silhouette. Tree crown/upper walk silhouette remains visible.
Actual native closeup: original tree/root shape and wood detail remain; material palette is darker/less olive. No newly obvious break in this crop.
Actual old dpr3 crop: baseline vertical body seam is removed, but its source-coordinate (1774,760) looks into body interior. It DOES NOT validate the right walking edge. Upper shore endpoint (1774,470) and lower ferry-ground endpoint (1774,638) supplementary actual captures are prepared separately. Do not mark this visual coverage complete before those images are inspected.

## Lifecycle allocation evidence and limits

For BOTH baseline and E, after stops at3/7/32/3, observed reachable logical Canvas bytes were respectively 33,703,796 / 59,342,736 / 94,394,812 / 110,706,244. At menu:106,377,920 bytes,82 canvases,3 prior Scene WeakRefs still live. Every stop/menu had sceneNull=true and engineNull=true; pendingRAF remained2, same as baseline. These sequences are identical, so no additional retained allocation was observed in this paused-RAF smoke.

GC was not forced. WeakRef presence is NOT proof of a leak or successful reclamation. Logical canvas dimensions are NOT process/GPU RAM. Old Scenes and queued RAF remaining live do NOT justify claiming memory fully released. This suite does not determine device performance, frame-tail acceptance, real-phone behavior or a full-playthrough pass. Separate cost/save suites own those narrower results.

Requested high DPR3 is actually official backing cap1.7, not uncapped3 and not a physical phone. No publication/deployment occurred in this worker. Stage7 remains independent unfinished artwork; Stage32 rejected improvement is excluded from E.
