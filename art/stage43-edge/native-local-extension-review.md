# Stage 43 native local extension experiment

Status: isolated experiment, NOT approved, NOT integrated or deployed.

After full-support replacement and original-rock stretching were rejected, a small east-bottom strip was authored from the original terminal palette boundaries. The entire original SVG child tree is retained unchanged. The new 39 native paths extend only nonwalking rock below source y=700, with individually designed linked planes and fractures. No generated-image bytes, repeated stamps, palette changes or gameplay changes are used.

Reproduce with `python tools/stage43-edge/design-native-local-extension.py OUTPUT_DIR` using installed Inkscape and the existing headless initializer. Outputs include editable SVG and same-view original/edited PNGs.

Verification: original SHA256 `d024022a56991bc56e6d507698a6683c11d47915984dfcf2ca02b936c1d927b4`; original child XML byte equality true; 454072 protected pixels above the join have exactly zero composited-channel difference in Inkscape renders.

Visual limits: material is still simpler than the original. This is only a small bounded patch; its straight left/right test boundaries are not proposed final terrain edges. Whole-stage side/bottom coverage, runtime asset budget, Scene/browser checks and public deployment remain undone. Earlier single-rock and two-rock stretched trials are rejected, not substitutes for this design.

The production working tree contains earlier rejected generated builds and must not be staged wholesale. Preserve all unrelated changes and rebase any eventually accepted narrow integration on latest master.

## v6 local follow-up

v5 was not approved: repeated diagonal planes and diamond-like cracks. v6 uses 51 individually authored paths with short/blocky and longer/vertical faces and branching cracks. It remains NOT APPROVED; the new shapes still look simpler and more polygonal than the original.

`capture-native-local-design.mjs` is a diagnostic-only Scene harness: it places the patch in the existing eastGeologyJoin layer to cover only the terminal nonwalking strip rather than leaving the older y710 foundation clip as a false horizontal seam. Its east camera is lower at H*.8 and zoom .45. This is not a runtime production change. Native Scene gameplay hash remains `5010609ff55f6623fa522911bf5e37970b9ef10ff1d683f56507eef784dba538`. Browser play and full camera/exterior coverage are not claimed.
