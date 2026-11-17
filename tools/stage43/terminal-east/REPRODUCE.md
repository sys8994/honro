# Stage43 east terminal clip-only reproduction

Inputs are the preserved pre-terminal integration deep/contact JSON files. Do not feed an already clipped candidate back into the command.

```sh
python edit-east-terminal.py \
  --deep path/to/original-stage43-continuity-deep.json \
  --contact path/to/original-stage43-continuity-contact.json \
  --out path/to/new-output
```

Requires Python+lxml and Inkscape. Existing headless preload is `/tmp/honro-inkscape-headless-init.so`. Only output directory is written. All paths can be relative to the working directory. Outputs: `deep.json`, `contact.json`, `mask-input.svg`, actual Inkscape `mask.svg`, `boolean.log`, `preservation.json`.

The fixed source-coordinate trim is based on original alpha ending around x2158.85 at y709.9 and new deep beginning at x2169.86 at y710.03, returning to x2156.96 around y740. It changes only new-art coverage in y710..740, not original source or existing paint commands.

Each output adds one world-coordinate root clip wrapper and one shared clip definition. Existing paint root, transforms, integer serialization and path strings are byte-for-byte retained as JSON string values. `preservation.json` strips those two additions and asserts full structural equality with the input. This is not simplification or a size-limit workaround. Original deep paint segments remain64,414; the mask is additional clip geometry, not paint geometry.

Recorded input hashes and byte counts are in `preservation.json`. Actual default1.65 Native Scene comparison: `native-deep-only` versus `native-both`. Both clips are needed: deep-only leaves52 changed pixels in the contact layer, maximum channel difference45. No original SVG, runtime, shared assets or deployment is modified by this script.

The preserved headless initialization source is `../honro-inkscape-headless-init.cpp`. On the same Inkscape1.4 environment it can be rebuilt with `g++ -shared -fPIC ../honro-inkscape-headless-init.cpp -ldl -o /tmp/honro-inkscape-headless-init.so`. This initializes the CLI object wrappers; it does not alter tracing or vector geometry.
