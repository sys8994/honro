# ImageBitmap material transport prototype

Research only, not registered product. Baseline J helper 6823eda0; pilot ded8 remains unchanged. One native material raster is transferred synchronously to one ImageBitmap and reused for all 16 existing bitmap calls. Shape, clipping, source coordinates, compositing and painter order are unchanged. This is not a static world cache and still rasterizes on each camera change.

## Lifetime and fallback
- `transferToImageBitmap` replaces the OffscreenCanvas image with a blank image. Cache hits return the retained ImageBitmap, never the cleared source canvas.
- Cache key adds canvas/image mode to the existing context, asset, dimensions, matrix and style identity. Cached SS still receives a real canvas for getContext/readback.
- Before rerasterization, clear or resize, close the prior ImageBitmap. At most one retained image. Recursive originalOnly native draw uses the current image cache hit.
- Unsupported API uses original canvas output. Failed transition-trio allocation reacquires canvas material before old SS, avoiding ImageBitmap.getContext.
- Native preflight conservatively reserves canvas plus ImageBitmap at 8WH bytes, alongside existing helper buffers. Actual stats include image payload. 48MiB admission is logical resources after cleanup, not physical GPU transfer transient allocation or fallback guarantee. Reservation can reject a size previously admitted at 4WH; no automatic 4K support.

## Evidence and pending test
Contract reverses all changes byte-exact to frozen J. Native unsupported branch: four poses RGBA/alpha exact, created=0; this does NOT exercise ImageBitmap. Mock copy-clear-close lifetime checks same-camera reuse, pan, cached/native return and clear (3 created/3 closed), plus failed transition allocation reaching SS with canvas. Mock is not browser transfer semantics, quality or speed proof.

Actual Chrome must establish positive transfer, strict RGBA/alpha at max and native-walk with moving camera, same-source runtime pins, cached/native roundtrip, clear/close and logical payload. Total frame time must include transfer and close; reported transferMs/closeMs are diagnostic subscopes, not subtractable overhead. A small failure or no measured benefit rejects the prototype. First upload may simply move or remain; no performance improvement claimed.

API reference: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/transferToImageBitmap
