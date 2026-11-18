# Lower-composite logical buffer policy, read-only proposal

Frozen helper bdb9b668db628cf1c74f51dc4d8c8fdb6d388ca732db208caf63b01541b26e5a, pilot636 unchanged. Current1MiPixel transition cap still rejects all four devices below: these are hypothetical enabled-route requirements, not measured support. The cap-safe fallback preserves old rendering but does not prove the requested corrected art works there.

Live new route uses material4WH + two lower ROI canvases8WB + retained transitionBody + retained supersample canvases. ROI is exactly floor/clamp(m.d*1716+m.f) through min(H,ceil(m.d*1988.8+m.f)+2). No staged full viewport is newly allocated on this live branch. However transitionBody is NOT released when coming from cached mode, nor are SS canvases. With cached1MiPixel gate unchanged, count up to4MiB staged and8MiB SS. If rows<=0, lower returns without resizing the two prior ROI canvases: count actual retained dimensions, not zero (table assumes up to8MiB cached ROI in that case). Fresh means new helper instance only.

Physical canvas / cameraY1650 scale1.65, fresh→cached-history bound MiB:
-390×696 DPR2 (780×1392):6.99→18.99; fullheight ROI bound24.43.
-390×696 DPR3 (1170×2088):15.73→27.73; fullheight39.96.
-1920×1080 DPR1:14.24→26.24; fullheight35.73.
-3840×2160 DPR1:44.94→56.94; fullheight106.92.

The table also includes cameraY1342 (band offscreen on common three): fresh4.14/9.32/7.91MiB, but cached retained upper bound24.14/29.32/27.91MiB, because rows0 does not clear old ROI. At4K453rows remainsvisible:44.91→56.91MiB.

## Minimal policy to investigate only after actual art proof
Keep cached/SS route's existing gate and existing SS stripe bounds. Replace only live eligible-route1MiPixel blanket decision with an explicit total logical allocation plan, provisionally48MiB helper-local research budget. This fits common three devices even fullheight twoROI + maximal old cached staged/SS, but does NOT fit4K typicalposes with retainedhistory. Keep fallback for4K initially; it is a documented art-support limitation, not an excuse to declare full support. The material8MiPixel cap remains:4K8,294,400px is just below8,388,608. Renderer6MP target is not a hard maximum because DPR floor1.

Compute prospective material + actual-or-prospective ROI + actual retained staged/SS BEFORE any resizing; material currently allocates before canTransition, so merely replacing its last condition cannot enforce a total-allocation budget. If ROI rows0, include actual oldROI allocation. If dimensions change, account width-first intermediate allocations (newW×oldH), or a separately validated release-before-resize policy; do not silently claim logical steady bytes bound native/GPU peak. Never clear buffers in the test and call that normal lifecycle release.

No cap increase, release, DPR change or code modification implemented. Need exact-device actual Chrome positive material/outeralpha/protected-role checks, cached→live→cached and portrait↔landscape resizing, stats-dimensions agreement, clean timing/rAF, and stage exit retained-memory evidence.48MiB excludes main Scene canvas, tile caches, JS/Path2D/native/GPU heap, delayed frees and transient old/new allocation overlap. FullSS fallback active readback payload has its separate budget and is not represented by retained8MiB.

## Scene accounting boundary
The architecture proposal4WH+8W*lowerRows+retainedSS/staged is the same live-only inventory used here. Decimal fresh bytes at y1650 are14.93MB1080p and16.49MB phoneDPR3 (14.24/15.73MiB), not inconsistent estimates. Scene/tile statistics such as another stage cached19.17MB cannot simply be added to these numbers: establish whether that metric already includes helper canvases or references the same storage, and whether those stage caches coexist or are evicted. Report disjoint inventory categories and simultaneous measured lifetime; no total heap inference from a sum of overlapping logical counters. Do not increase the cached/SS path cap globally.
