# Stage 36 tactics action evidence

The original same-context `actions.jsonl` is XZ compressed and base64 encoded in `actions.jsonl.xz.b64`. Raw bytes: 1,403,136; raw SHA-256 `b17170dd1264ce00b3075106112ea15d0f03990fe57a28ec687fc5032516a43e`; XZ SHA-256 `764de8ae8c3c2644ac9fbc25923b9675c85c6dce228e0f1a78e07c3e3959132c`. Compression was verified by byte-for-byte decompression. Restore with `base64 -d actions.jsonl.xz.b64 | xz -d > actions.jsonl`.

The bounded records include actual input, round, actor, positions, HP, camera, selected skill, grounding, accepted shot counter, last-shot skill/angle/power, phase, observed A02 projectile contact transitions, HP delta and timing. It is 207 controller operations, not 207 attacks; 50 ms sampling can miss fast transitions. See [the results and limitations](../../TACTICS-36-RESULT.md).
