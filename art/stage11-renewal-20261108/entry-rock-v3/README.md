# Entry granite v3 tracing experiment, not production art

The original worktree and v2 source remain unchanged. The recovery worktree integrates baseline b6e0f476e and master 9efec1056 (only Stage8 campaign data changed). The integrated tree is preserved remotely at 8da6d70aecc8db0b9d2a9c0b6cc023932cd038f1.

Built-in image generation edited v2/source.png to remove edge guide colors and flatten existing stone planes without changing the four shelf contacts. The generated result still has small edge remnants and slight tonal variation. It is an experimental trace input, not an approved style master. Exact prompt is in prompt.txt.

Native Inkscape 1.4 object-trace used 16 colors, smoothing, zero speckle removal. Ordinary headless execution crashed on missing GdkPixbuf/Gtk/Pango wrappers. The repository's inspected init-wrappers.cpp was compiled and loaded using the documented workaround; the native tracer itself was not replaced. Raw vector has 17 paths, 5329 parsed segments, 332 subpaths, zero images, 229927 bytes. The bounded simplified candidate has 3053 segments (42.71% reduction); final precision output is 98094 bytes. Source-to-raw RGB MAE is 1.2897/255 and alpha silhouette deviation is 1 source pixel. Optimization measurements are in metrics.json and are not source-fidelity or art approval.

Direct full-frame inspection of source and optimized render found unwanted small interior islands in shaded faces. The four shelves and large face arrangement remain readable, but this candidate is NOT selected for runtime. Next: reduce source tonal variation or edit meaningful native vector faces, protect all shelf/contact corners, and compare full frame, actual walking scale and 200% contact ROIs before integrating. Do not loosen optimizer limits to hide source defects.

No runtime/terrain/collision/save fields changed. No normal gameplay, browser validation, master integration or Pages deployment is claimed. Existing baseline harness failures remain separately recorded in the original worktree.
