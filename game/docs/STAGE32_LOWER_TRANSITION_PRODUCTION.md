# Stage32 bounded lower transition production candidate

This candidate moves the reviewed d1cc421f prototype into the production helper. It is not deployed and is not whole-stage acceptance. Internal fine green seams remain.

Source geometry, all 25 original paths and gray-subpath selection, road paths 21–24, provider placement, physics and battle state are unchanged. The transition begins at source y780 (world1716) and colour buffers cover source780..904 only. Protected world y<=1700 must remain RGBA-exact in Chrome. Unsupported transform/opacity/compositing/filter/shadow states and canvases above 1M pixels retain the prior rendering. Three module-local auxiliary buffers have bounded sizes, explicit clear and logical-byte statistics, in addition to the existing material buffer.

The V1 contract is retained verbatim. The new test runs its frozen historical helper first, then records its intended one-buffer assertion incompatibility with the new four-buffer implementation. Additional tests retain state restoration, unsupported-state pixels, source/custom/large-canvas fallback, cache invalidation and clear coverage, and test exact logical bytes and caps. Historical adapter contract uses remote e89242ee, the documented tree-equivalent of local be99eb99; its exact adapter hash assertion remains unchanged.

Chrome fixtures load the actual production helper without instrumentation. The original control uses a separately named frozen V1 helper with exact SHA256 8f48f81c25be136756ac320abd3715d75fb9fbdd7ee6bb624180a3898601611d. Old control PNG hashes are required unchanged. Both helpers are present in the same runtime bundle; selected providers differ explicitly.

Raw BODY is intentionally retained: 843367 bytes versus old optimized684521, +158846 bytes. The optimized alias changes relative-m subpath semantics and is not safe for the unchanged gray-selection mask. This is separate from transition overhead.

Validation pending. Previous ROI prototype single cache samples were162.7/108.2ms versus original106.6/66.6ms, improved from first605/415ms, not formal p50/p95. Mobile, extreme-pan matrix, actual public UI, real hardware, real saves and gameplay quantitative acceptance remain unverified. No master/Pages deployment is authorized for this child task.
