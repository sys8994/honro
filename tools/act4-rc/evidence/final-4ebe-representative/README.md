# Fixed 4ebe representative input evidence

These are the original files from `_local/act4-rc/final-4ebe-representative`, the representative stage 36→37 execution described in `FINAL-4EBE-36-37.md`. They are preserved byte-for-byte as XZ compressed streams encoded with base64; they are not recreated from screenshots or another attempt. The synthetic previous-chapter fixture is documented in the report and `attempt.json`; it is not evidence of actual prior-chapter play.

| File after decoding | Bytes | SHA-256 (decoded raw) | SHA-256 (XZ stream) |
| --- | ---: | --- | --- |
| `commands.jsonl` | 79,826 | `c1c3335f34ad74f1210c8ea3e04446afec34bf808b211facebe205d1350d1320` | `ff7a017e98168c618d5d27904cdd11169d178ef481676b2a9e919d0e852dd70d` |
| `attempt.json` | 4,106 | `61250d068f48a20be6a74e0d2f38063be702d382953b6d02ef9c939a71477107` | `d9c81075696dc18c7ae321a14dbf5688a79b36321f02ff356844bd330cc6d6ff` |

For example, `base64 -d commands.jsonl.xz.b64 | xz -d > commands.jsonl`. Both files passed byte-for-byte decompression verification before committing.

`commands.jsonl` has 811 timestamped input commands spanning the continuous 36→37 run and subsequent reload/export, including 163 `state` requests. It records command inputs only: it does not contain their stdout responses, hit results, or per-character round summaries. Its elapsed wall time includes inspection and debugging waits and is not human play time. `attempt.json` has only one recorded state, the initial stage 36 battle state; it does not contain later combat states. The original interactive driver printed manual `state` results to PTY stdout but did not append those responses to either file. No corresponding PTY stdout file was found in the workspace or accessible temporary directory; the earlier process is no longer running. Thus these files alone cannot establish complete per-character shots, misses, or moves without a shot. No absent output has been synthesized.
