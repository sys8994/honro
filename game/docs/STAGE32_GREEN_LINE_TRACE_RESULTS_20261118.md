# Stage32 residual green-line paint-order diagnosis

## Fixed source and tests

Production reference is 13d671e3cc80a9e70ab0a299d45860094bfe3181, helper SHA256 aab056752d65b36fcb620f5e3896ee4404926170de4c67d9fc33aa83fea22953. Diagnostic-only HEAD 09dbfb52975d6484a6a304de9a6ca8df6c81d425, branch inspect/stage32-gray-trace-20261118, actual Chrome CI 44177034021 success. Source/25 path hashes, battle/physics and storage non-access contracts pass; both current Scene PNGs still match the previous production hashes exactly. No production change or deployment.

Four controls: current; outside selected-gray fill (previously rejected for hole leakage); solid original-fill-color with the existing duplicate clipped gray pass and lower transition; raw canonical BODY25 paths each filled exactly once in original order/color, without duplicate gray or lower transition. The raw group uses canonical vector SHA76e4fc6c04fc1f95aa9dcd0d97c9b8294c05cbe0a75169eb53174768f8da7cd1 and unchanged stage/provider params, not the published optimized BODY. Its foundation remains the current candidate foundation. Thus raw is a narrow causal control, not old-public equivalence or a ready-to-ship version.

## Three representative pixels

Lower screenshot patch centers: gray-upper(815,90), gray-diagonal(753,150), arch-inner(800,167). Each7x7 patch captures the RGBA before all25 source-path paints, field RGBA, isolated full/gray coverage and original ordered grass contribution. Within each patch the maximum G-B pixel is selected deterministically, not as a quality threshold. Native and Chrome16x16 point-containment samples agree exactly.

|Patch|field alpha|p19 full alpha|p19 selected-gray alpha|raster visible grass contribution|geometric topmost grass samples|
|---|---:|---:|---:|---:|---:|
|gray-upper|255|111|0|97/255|0/256|
|gray-diagonal|255|108|0|100/255|5/256|
|arch-inner|255|114|0|98/255|0/256|

Geometric sample labels: upper p0=132,p1=6,p19=118; diagonal p11=144,p13=5,p19=107; arch p0=142,p19=114. Sampling is finite16x16, not an exact analytic area proof. The large excess over0 or~2% is nevertheless directly measured. Grass-labelled raster contributions are not automatically genuine intended grass.

The sampled green comes from protected p13/p16 underpaint surviving repeated partial source-over coverage at the boundary of later p19. Field pixels are fully opaque, so missing field alpha is not the cause here. The last p19 has gray contribution0, so its gray double clipping is not the cause here. Current and outside groups produce identical final pixels at these three representatives. Canonical raw single-fill also retains green, proving it is not introduced solely by the duplicate gray pass.

Final actual BODY original pass representatives: upper current/outside[126,128,98,255], raw[109,115,85,255]; diagonal current/outside[126,129,97,255], raw[109,115,84,255]; arch current/outside[106,109,78,255], raw[112,118,87,255]. The staged alternate pass can differ1..2 channels from the preserved original pass, which is separately reported rather than conflated. All sampled BODY pixels are opaque255 and sit on internal color seams, not transparent exterior silhouette.

## Meaning and constrained next approach

The visible thin lines track shared internal color boundaries, while wide original grass clusters are separate shapes. Source-order and geometric topmost evidence strongly identify these examples as hidden green underpaint leaking through correlated AA edges, not a broad green patch to preserve unchanged. Exact original authored raster matching this arch remains unavailable: the Library file stage32-vector-production--body-concept.png, SHA540c72da211179dd98c3620aba4cc60ba210f8a5f333fbbab2dad2a2de05684e, was inspected and is an older long blue cliff concept, not this arch. Do not cite it as proof of moss intent. Authored intent beyond measured source topology remains uncertain.

Do not introduce gray Boolean as a remedy for these lines. Do not inflate p19, stroke over the hole, remove entire grass paths, force grass contribution0, or relax protected road/physics checks. The diagonal has real geometric grass samples5/256 and should retain that small contribution.

Recommended next test-only candidate: derive a source-defined, non-walk internal-seam classification and correct only excess premultiplied color contribution toward coverage-coherent topmost source/material colors while retaining the current full BODY alpha and major arch-hole silhouette exactly. Keep raw path geometry/order/hash and original opaque genuine grass/road color fixed. Actual grass partial coverage should follow the source geometric contribution, not preserve the erroneous38-39% independent-AA residue. A cache-build coverage-coherent supersample/color reference can first establish the expected color target; it is not authorization to blur the finished image, supersample every frame, or rewrite optimized source. Before implementation, select a bounded performant representation with actual Chrome coverage, entire-view visual and timing validation. No candidate is implemented by this report.

## Evidence and limitations

Artifact14370403071, ZIP3,992,369B, SHA256608855b893622c69f7b5c1839cf16022ad0c4ebbb5cf58bb39095d19c2a583a2; all19 entries CRC pass. Eight PNGs and corresponding source/trace JSON retained locally under stage32-gray-trace/topology-review. Main current/raw lower images directly inspected; previous outside/solid lower images inspected in the preceding diagnostic. Earlier corrected-coordinate CI44175782672 and initial CI44174657327 are preserved, not overwritten. Remote artifact expiry remains a retention limit. The compact trace summary accompanies this report; full per-pixel traces are in the artifact. This does not cover all residual lines, all zooms, mobile gameplay, real devices or new production performance.
