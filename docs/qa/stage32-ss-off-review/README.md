# Stage 32 isolated SS-off ablation (research only)

This changes exactly one call site: `if(!originalContext)coherentColor(c,cv,q);` becomes a comment. Reverse substitution reproduces the supplied final-material candidate byte-for-byte. The SS function remains present but uncalled; native 26,782-byte coverage, 6,184-byte internal-material join, original source paths/order, material/transition logic and clips are unchanged. `patch-contract.json` pins inputs. No production registration or remote writes.

The test draws actual supplied FOUNDATION then BODY through the real helper on Native Canvas, each variant in a fresh context. It is **not actual Scene Chrome**, does not reproduce tile resampling/foreground, and is **not a performance benchmark**. SS counters are 1 for on and 0 for off in each pose.

| Pose | Changed RGB pixels | Max channel delta | Alpha differences | Background changes | Centers outside both native and internal band |
|---|---:|---:|---:|---:|---:|
| .6 left | 463 | 17 | 0 | 0 | 452 |
| 1.65 maximum | 394 | 22 | 0 | 0 | 392 |
| .05735294 portrait minimum | 350 | 18 | 0 | 0 | 289 |

Finite 9-sample visible-protected point hits are 563 / 650 / 171; they are diagnostic sample counts, not proof of a source-geometry violation or justification for waiving a gate. Point containment is not exact filtered coverage. The minimum pose is direct low-CTM rendering, not the actual Scene tile CTM.

Directly inspected maximum on/off PNGs. The large internal gray joining effect remains. Turning SS off exposes a fine diagonal boundary running down-left from the upper grass boundary (roughly x334..600, y244..15), while upper/right boundary pixels also differ. Thus native and internal join do not fully supersede SS. The majority of remaining differences are outside their geometric center coverage. A broad SS deletion is not supported by this result. Actual Scene correctness and visual comparison, followed by whole-842 paired cost testing, are required before adoption. No automatic removal, new CI or performance claim is made here.

Run from workspace root: `node stage32-ss-off-review/proof.cjs`. The script depends on the explicitly named existing source-evidence/foundation/visible-geometry inputs. All output images are original unmodified captures.
