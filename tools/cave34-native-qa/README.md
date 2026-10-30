# Cave34 proper Native gameplay closure

Frozen project `_local/reports/cave-decor-coherence-v4/stage34-candidate-v1.json`, SHA43edff3b1b6fda17a02a93784dba488d5c3d175be269b7fcabc4eea4e6c61cf0. Actual runtime9278a691f97be21437b58fe67cdffa6a7e031da6666b2b34faa2e6f6829e0544.

Existing tape diagnostic uses unchanged `tools/stage34-production/verify-app-observations.mjs` and actual Native App adapter, NOT the prior renderer-free harness. Command/hashes and exact incomplete result are in `art/cave34-native-qa/existing-tape-diagnostic.json`; full report/log/screenshots stay `_local/reports/cave34-native-qa/`.

Result: wrong-exit sequence completes, actual stopBattle/Continue exact-state check passes at frame4847, all4 party alive. The old timed tape ends at17747 with3 foes remaining; several later fire inputs reject due stale actor/phase. This is not completion, not a geometry failure declaration, and not art/release approval. Fresh adaptive ordinary inputs and independent replay are next; no shared adapter/assertion relaxation.
