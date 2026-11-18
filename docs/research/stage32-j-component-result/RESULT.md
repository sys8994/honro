# J component submission diagnostic
Run44303896590 / researchbe170743557868ed3e3c1e57a986d70ade62305b, artifact14427705736, ZIP SHA256 2282aa9dd5d0af616600705d397ae1e6a214794ec965e114f353dec53d809ce1.

All seven actual frames RGBA exact between uninstrumented registeredJ and inverse-exact instrumented copy. Source/camera/purity/codec/storage gates pass. No product change.

Five pan frames: bitmap16 calls total3.0–3.4ms (median3.2); material3 calls0.1ms, field12fills0–0.1, originalBODYInclusive0.1–0.2, offline33Faces0.2–0.3, lowerTargetROI0.3–0.5, each native correction0–0.1. Original full Scene pan median5.1ms versus profiled5.2ms. Cold7.1/7.3ms. All scopes are nested, not additive. Thirty-three face fills mostly round to0 at clock resolution; gradient/setup difference is approximate only.

The bulk bitmap time exceeds BODY-related inclusive scopes, suggesting the FOUNDATION bitmap call dominates the measured submission stall. Caller-specific bitmap times were not directly instrumented, so this is an inference, not an exact isolated attribution. Deferred field raster/flush/synchronization can be charged to drawImage; these are not independent GPU timings. It does not prove that copying rather than preceding vector raster is the underlying work.

This argues against further subpath text/33gradient micro-optimization without a new mechanism. Architecture receives the raw counters to design a way to remove sustained material/raster/blit work without reducing art or DPR. Existing J vs5b performance failure stands. Per-frame readbacks and instrumentation perturb performance; this is not a clean acceptance suite or physical-phone FPS test.
