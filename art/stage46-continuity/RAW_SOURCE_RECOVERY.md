# Native v6 source preservation

The native Inkscape color trace is preserved separately in the owner's ChatGPT Library as `color-native-raw.svg` (17,419,521 bytes), saved 2026-11-17. SHA-256:

`a01596d3ed727ddee64336c892bb98a0ed063799771f5723161dfdafe31e768f`

The identical file was formerly duplicated at:
- `v6/color-native-raw.svg`
- `v6-split/color-native-raw.svg`
- `v6-grid/color-native-raw.svg`

The supported GitHub connection rejected the oversized source request. It was not split or recoded to bypass that limit. The new work branch omits those duplicate payloads; their source bytes remain in Library and the original local checkpoint `0135b7134e780e86663fc8f53f6e392070500a15`. The previous work branch was not rewritten.

To recover, download the preserved Library source using the supported Library workflow, verify the byte length and SHA-256 above, and place a local copy at the input path required by the chosen native build script. The v6 concept, trace settings and registration records remain in this directory. The selected v6-grid/tree-wide route is an integration candidate, not release approval. The build's source and runtime vector budgets remain unchanged.
