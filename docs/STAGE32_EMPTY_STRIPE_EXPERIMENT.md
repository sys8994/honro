# Stage32 empty-eligible stripe experiment

Test-only helper. Production remains byte-identical registered SS2. No Stage3 changes, source geometry or visual redesign.

The original helper already performs low-resolution mask, destination and field reads, then high-resolution colors+labels for every stripe. This candidate checks exactly the original low eligibility predicates first. When there is no eligible pixel, it skips only the two high rasterizations and readbacks. Low readbacks and final putImageData are retained, preserving possible backend premultiplied roundtrip effects. Scratch canvas resize/allocation shape, source/state guards and clear remain identical. Original semantic counters are preserved. Empty/high-stripe counts and scan-pixel cost are added. Memory metrics accurately omit high readback payload on empty stripes, without claiming reduced retained canvas allocation.

Potential cost: the preflight scan is additional work. It stops at the first eligible pixel; empty stripes scan twice to retain semantic counters. Empty stripes may be absent or too rare. No benefit is assumed.

Actual Chrome compares `candidate` (unchanged registered production SS2) with `ss2` (test-only optimized helper). Production App manifest order is retained except automatic main.js; the alternative is explicitly test-injected. Both must retain every one of seven reviewed SS2 PNG hashes, complete source/physics/state hashes and original low semantic counters. Native production and new candidate contracts both run. Same-run cold10/pan60 measurements and detailed empty-stripe counts are saved. Cached behavior is not a full-game or phone performance pass.

Discard if no empty stripes, no meaningful measured same-run benefit, output drift, guard failures or unclear accounting. Passing CI only makes the experiment measurable; it does not authorize production promotion or claim85.9ms spike solved. This unit is independent from residual-line artistic work and does not change samples or the1420..1716 correction band.
