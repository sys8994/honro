# Live viewport cap and bounded logical-memory review (read-only)

Current helper transition cap is1,048,576pixels, material cap8,388,608pixels. `canTransition` checks actual destination canvas dimensions, not CSS viewport. Live route sceneScale>1.05 does not override this cap. If it fails, material may still render; transition=false also skips native/internal/replacement final branch. This is a partial different rendering route, not an all-or-nothing safe fallback. Never raise cap blindly. Cached tile dimensions are separate and may remain under cap despite a large viewport/DPR.

For full live canvas W=deviceWidth,H=deviceHeight, material canvas4WH bytes. If boundary splitting is active, staged BODY adds4WH. Two transition-band canvases add8WB, where B is device band height. Thus fresh live SS-off logical canvas total is8WH+8WB, upper bound16WH. No SS scratch/readback is required on live route, but previously allocated SS buffers can remain; no normal lifecycle release proof. These formulas exclude source/display canvases, Scene tiles/background caches, Path2D/native/GPU memory, encoded source and JS heap.

Band formula for axis-aligned transform: y0=max(0,floor(worldScale*1716+translateY)-2), y1=min(H,ceil(worldScale*1988.8+translateY)+2), B=max(0,y1-y0). Only when0<threshold<H is staged BODY full-size; otherwise its canvas may remain1x1 or retain earlier dimensions. Current cap rejection on a fresh helper avoids transition allocation and leaves only material canvas plus negligible scaffolding; retained prior buffers are not freed by rejection.

| CSS/DPR | Device pixels | Fresh current material bytes | Hypothetical8WH+8WB at sceneScale1.65, cameraY1650 | Full-band bound16WH |
|---|---:|---:|---:|---:|
|1920×1080 /1|2,073,600|8,294,400|23,255,040 (B434)|33,177,600|
|390×696 /2|1,085,760|4,343,040|11,687,520 (B481)|17,372,160|
|390×696 /3|2,442,960|9,771,840|26,282,880 (B720)|39,087,360|

All three exceed current transition cap; DPR2phone is only37,184pixels above it, still a strict skip. The hypothetical camera is explicitly illustrative, not a claim about the existing minimum-zoom pose or actual DPR implementation. Actual live device transform/canvas dimensions must be captured in the new probes.

Bounded next plan if probes confirm: first document actual path/caps/sceneScale/device dimensions and visible result. Then evaluate a separate supported-device budget using complete8WH+8WB plus retained buffers, not just the first canvas. Choose an explicit overall byte ceiling and fallback behavior preserving appearance before any cap change. Smaller region processing or source-anchored caching may reduce work, but prior integer clip changed actual pixels so no presumed safe crop. Retest actualDPR1/2/3, min/max/route threshold and normal stage transitions, along with source/protected/exterior checks and clean CPU/memory. Current three-pose experiment remains independently meaningful but does not cover these device cases.
