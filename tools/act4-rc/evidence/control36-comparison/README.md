# Stage 36 comparison action streams

See [the comparison report](../../CONTROL-36-COMPARISON.md) for source, controls, the real turn-7 UI export/context boundary, and limits. These are the two original append-only bounded `actions.jsonl` segments, compressed independently as XZ and encoded as base64. They contain game state, game controller commands and execution timestamps; no profile, token or full world is included. They have been byte-for-byte verified after decoding.

| Segment | Raw bytes | Raw SHA-256 | XZ SHA-256 |
| --- | ---: | --- | --- |
| `segment-1.jsonl.xz.b64` | 1,183,843 | `5ba178b5fe6358e9cf14b0b8e9a5c5d7bbb656d65195f0e200b533a47608ddb3` | `32fbc1aca996cf1448d2b7d70f0fd1c190abc24518723032865c4f7ee5194255` |
| `segment-2.jsonl.xz.b64` | 618,840 | `8394c4ea032b985d347a951e48d971e0e8004e8e012f9345c45dbf82d87740e4` | `4433599fa2c9800a8857493b967db14337ef94cd8300b64c523a9d2e4af2268c` |

Decode with `base64 -d segment-1.jsonl.xz.b64 | xz -d > segment-1.jsonl`. The second context starts from a real UI export, not the final line of the first log alone; the precise export hash and comparison are in the report. The 270 log entries are controller operations, not 270 attacks. Screenshots are small WebP evidence, not a complete replay.
