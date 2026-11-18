# Disabled native-only helper budget design

Status: arithmetic design only, ready=false; no helper/pilot/production edits. Based on target230bb complete lower-target ROI. Its actual clean study now reports 15.55ms median pan and 33.2ms rAF gap, not universal 60fps acceptance.

The current 1MP transition cap prevents the intended correction on common high-DPR phones and desktop1080. A new native-only 48MiB helper-owned logical canvas budget is proposed by the parent. It is NOT total process/Scene/tile/JS/GPU memory. Canvas resize can retain backend allocations transiently; logical release is not evidence of physical release.

Preflight must run before material() at BOTH FOUNDATION and BODY entry. Existing route.nativeLive and sceneScale must identify the real Scene route. Axis-alignment and original paint-state gates remain mandatory. Cached <=1.05 behavior and 1MP cap remain unchanged.

The planner reports actual retained material/work/color/body/SS/mask bytes, a no-release projection, then a scheduled projection. On the admitted native route only, SS canvases and unused color/body are resized to1x1, obsolete work likewise when rows==0. If material/work must grow, release the previous backing dimensions before allocation, invalidate material last-key, and record release/resize counters. Never release canvases in an active recursive draw. The outer call determines the decision; originalOnly recursion inherits it without mutating public route inputs.

If the native plan does not fit or the paint state is ineligible, retain original safe fallback semantics. Do not partly suppress SS then discover correction cannot run. A denied new-budget plan must not allocate the proposed larger work canvas. Existing original fallback allocation policy remains a separately documented limitation, not a magically total-memory-bounded fallback.

Return to cached rendering must lazily recreate the original SS/color/body canvases and produce original cached output exactly. Clear() must release all helper backing dimensions and invalidate cache state. Lifecycle 32-native -> cached -> other stage ->32 must be measured through official App lifecycle, not manualclear used as acceptance.

Test matrix for a later separate candidate: baseline230bb exact normal maximum/cached; new phone390x696 DPR2/DPR3 and1920x1080 DPR1 with positive corrections and original source/physics, terrain union/exterior/foreground validation; budget reject case; cached/native roundtrip; fresh and retained high-water logical bytes. Native scale/paint invalid cases must preserve original fallback. Chrome DPR must be real emulation, not forced DPR1.

Arithmetic examples are candidate eligibility estimates, not device support. Even if4K fits the helper-only formula, it is NOT supported/quality-approved without real renderer pixel-ratio/canvas caps and costs. Current readyfalse design excludes a 4K support claim.

Reproduce: node stage32-native-budget-prep/test.mjs. No package installation, new canvases, source edits, or browser runs occur in this unit.
