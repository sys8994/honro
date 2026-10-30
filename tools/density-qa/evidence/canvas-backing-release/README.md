# Cache-owned canvas backing release

The renderer's existing domain LRU is bounded to 12 mobile / 24 desktop tiles.
This change does not assert an unbounded JS cache leak or change those limits.
It explicitly resizes offscreen canvases to 1×1 before dropping their ownership:

- Evicted tiles, after the draw loop has consumed them.
- All previous tiles when the domain raster key changes.
- A replaced single static-world canvas, after its replacement was built.
- The unused domain cache when moving to the single-world rendering path, and
  the previous single-world canvas when moving to domain tiles.

Only this Scene owns these cache canvases. The visible canvas is guarded from
release. Current live tiles are not resized; the existing screen raster has its
own copied pixels. No geometry, palette, physics, cache cap or raster scale changed.

`node --expose-gc tests/canvas-backing-release.mjs` compares the actual production
cache methods with their original repository source at569e111. It exercises52
Native Canvas frames at960×540 and390×844, including panning, return to evicted
areas, zoom/key changes, stationary screen-cache hits, scene invalidation,
non-domain replacement and domain/non-domain transitions. All pixels and build
counts are identical. Active domain counts and allocations are unchanged;
previously retained-but-unused domain tiles are intentionally zero in the
non-domain path. Every retired canvas is1×1, every live tile stays516×516, and the
visible render target is intact. `tests/renderer-visibility.mjs` also passes.

The test deliberately retains references to all allocated canvases to inspect
ownership. Their final dimensions imply106.03MB→6.39MB (desktop sequence) and
99.64MB→6.39MB (portrait sequence). These are NOT measured process RSS, browser
GPU memory, typical steady-state usage or mobile FPS improvements. Actual old
allocations could already have been reclaimed without those retained references.
The Stage35 exit137 cause remains unproven; browser and gameplay QA are separate.

An initial test assertion incorrectly expected unused domain tile counts to
remain equal in the non-domain branch. Pixel/build comparisons were already
identical. The assertion now explicitly requires zero unused tiles in that
branch, while retaining exact count parity in active domain mode.

No test-only native cache flush has been added to production.
