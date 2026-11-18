# K official release artifact preparation (no publication)

Input K a6f2935935eed559c3ecd27207d8d8a78a1ed22d is direct child of current 5eb0381269868e501a1cd187d963ddb716cd2dc6. Exactly four approved Stage3 source files. Source, latest supply reward, default release flags and current remote master are asserted. If master advances, stop rather than overwrite.

Research workflow checkout is separate from the exact candidate checkout. Contents permission is read-only; there is no remote write, commit, ref update, Pages deployment or replay of old denied generated output. Local temporary-index write-tree describes a possible reviewed release tree only.

The official release guard calls for last seven days plus minimum two actual published graphs. published-history.json records observed successful dynamic Pages runs, conservatively at UTC day precision, ordered chronologically within each day. No candidate or research build is recorded as published. Read-only filtered fetch provides historical commit/blob evidence for the official retain-published-web CLI. Its fail-closed hash validation is not bypassed.

One root `npm run build` uses the documented shared Game/Workshop/Playtest release graph. No HONRO environment overrides or hand-edited HTML. Existing tracked generated files pruned by the official build are restored byte-for-byte from K to conservatively preserve them; existing immutable web paths may not be altered. The current active and retained graph records are all hash/size checked. Only official generated paths are collected. Final release tree may contain K's four source files and generated output, never these research files.

Required scoped aggregate checks are `tests/web-split.mjs` and `tests/web-build-retention.mjs`. Existing completed K actual 50-battle/Scene/App/save/performance suites are not repeated here; a green build is not independent visual or gameplay acceptance. No full verify or unrelated traversal is added.

Output release-delta.zip contains changed/new generated files only, no deletions. release-summary.json supplies exact paths, byte counts, SHA256, Git blob hashes and local prospective release tree. CHECKS_PASSED.txt plus successful exact CI is required before parent review. Publication and live Pages verification are separate, not claimed by this package.
