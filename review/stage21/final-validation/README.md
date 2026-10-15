# Stage21 focused validation and observed-play PNGs

Implementation/doc checkpoint:6cba0ec; tests checkpoint:911627d. No master/Pages publication. The game build is unchanged from d1ae7f7; this packet adds evidence only.

Normal input result:round9 victory, four heroes alive, all five initial groups and three finite waves have recorded actions/effects. 18 original enemies and actual event/win rules remain. No live actor position/HP/resource writes. Legal prior20 reward-ledger entry is synthetic; it does not claim prior campaign completion. Prediction-assisted fixed native input policy; DOM/clock/storage doubles.

normal-trace.json.gz decompresses to the exact full raw trace, including the isolated synthetic profile, initial/final battle, actions, frames, input changes, damage, wave births, Continue and actor-write audit. This contains no personal save. normal-summary.json is the shorter view. Tests in the repository reproduce it.

PNG prefixes rescue/hold/exit/market/office are observed round1/3/6/7/9 snapshots restored through actual Game Continue, with actual HUD/targets retained and actor states unchanged. Suffixes pc/mobile/portrait/iframe identify Chromium views. These are restored-state browser evidence, not a full browser-input playthrough. browser-result.json compares actual Game/iframe goal text and party. world-parity-result.json is separately a world-only editorView comparison, not HUD pixel identity.

Occupancy10cases cover both authored event entries and all71 legacy hold candidates, warning/wait Continue, atomic budgets/IDs, blocked/resume/alternate, live actor obstacles and terminal fixtures. The occupancy setup is intentionally artificial; it is separate from the normal run.

No new production defect found. baseline-limitations.json records old helper/absent historical Git failures without claiming their passes. No whole-campaign verification requested or run. Reference-photo comparison and user image approval remain pending.

The digest-bound encounter manifest remains in ignored _local/reports/stage21-eupseong/ because recursively including a manifest's own source digest in this review directory would create a self-reference. It is regenerated after this evidence commit; parent can inspect its final status in the handoff.
