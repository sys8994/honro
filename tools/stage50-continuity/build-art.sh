#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f /tmp/honro-inkscape-headless-init.so ]]; then
  g++ -shared -fPIC tools/stage47-continuity/headless-init.cpp -ldl -o /tmp/honro-inkscape-headless-init.so
fi
mkdir -p _local/stage50
node tools/stage50-continuity/source-reference.mjs
# Original PNG and raw files are preserved separately; this validates hashes when present.
python tools/stage50-continuity/trace.py art/stage50-continuity/source/concept-v3.png art/stage50-continuity/source/trace-v3
if [[ ! -f art/stage50-continuity/source/trace-v3/color-opt.svg ]]; then
 LD_PRELOAD=/tmp/honro-inkscape-headless-init.so python tools/terrain-node-optimizer/optimize_svg.py art/stage50-continuity/source/trace-v3/color-raw.svg art/stage50-continuity/source/trace-v3/color-opt.svg --epsilon .35 --render-widths 768,1536
fi
python tools/stage50-continuity/protection.py
python tools/stage50-continuity/compile.py
node tools/stage50-continuity/check.mjs
node tests/stage50-composite.mjs
