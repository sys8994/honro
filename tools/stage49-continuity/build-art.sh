#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f /tmp/honro-inkscape-headless-init.so ]]; then
  g++ -shared -fPIC tools/stage47-continuity/headless-init.cpp -ldl -o /tmp/honro-inkscape-headless-init.so
fi
mkdir -p _local/stage49
node tools/stage49-continuity/source-reference.mjs
python tools/stage49-continuity/trace.py art/stage49-continuity/source/concept-v1.png art/stage49-continuity/source/trace-v1
if [[ ! -f art/stage49-continuity/source/trace-v1/color-opt.svg ]]; then
  LD_PRELOAD=/tmp/honro-inkscape-headless-init.so python tools/terrain-node-optimizer/optimize_svg.py art/stage49-continuity/source/trace-v1/color-raw.svg art/stage49-continuity/source/trace-v1/color-opt.svg --epsilon .3 --render-widths 916,1832
fi
python tools/stage49-continuity/protection.py
python tools/stage49-continuity/compile.py
node tools/stage49-continuity/check.mjs
node tests/stage49-composite.mjs
