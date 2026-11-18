# Empty-stripe experiment result

CI44216228446 at b0897d5a99c6e665c67330f2d86bf75d2faa3ac4 succeeded. Artifact14387479167. Test-only helper; no production update.

All seven reviewed SS2 image hashes and existing semantic counters are unchanged in actual Chrome. Native production and candidate contracts pass.

Empty stripes occur: left initial2/6 and full benchmark22/70; portrait/landscape overview/bottom each1/2. Lower and desktop-walk have0. Left high-resolution raster pairs fall70→48 while source/state/alpha/normal-grass behavior stays exact. Logical memory and resize counts remain unchanged as intended.

Same-run cold medians: lower181.6→180.8ms; left123.8→116.7ms (observed−5.7%). Left accumulated correction time813.3→737.2ms. Pan maxima lower43.7→43.5ms, left64.8→64.6ms. Therefore this removes some unnecessary work but does not solve the tile-rebuild spike. Single-run noise and JIT/GC affect timing; the numeric cold improvement is not a robust device-performance guarantee. Warm left p95 also varied2.1→5.4ms, so no blanket speedup claim.

Verdict: verified byte-safe, limited work elimination; retain as an optional narrow candidate, not as the answer to the85.9ms spike and not as a release-quality or phone60FPS pass. No benefit is assumed for lower/walk views, where preflight adds a small scan without skipping work.

A shared high-res atlas is not a minimal follow-up: even a1548px-wide,178px-high band at2x exceeds the existing1Mi-pixel scratch cap; at296px band height, high color+label readbacks (~14.7MB), high canvas (~7.3MB), low mask/readbacks exceed24MiB without new splitting/packing/cache policy. Affine phase, tile-edge AA, provider/style invalidation and clear would need new contracts. No atlas implementation is proposed in this unit.

## Registration follow-up

Production helper registration uses exactly the reviewed test helper bytes (SHA2560281052db3e3d89efff8a75d9859ffe871a50ceef4a7d17ec7398a7c2ff1f6b0). Historical SS2 cleanup contract continues against its preserved fixture. A separate new production contract checks exact equality with the reviewed empty-stripe candidate and all six-buffer/source/state guards. Registered App fixtures update only the helper SHA assertion; original seven-image goldens and source/physics/protection tests remain unchanged. Real Workshop/Game builds and actual registered7-view Chrome verification must still pass before reporting this production registration verified.
