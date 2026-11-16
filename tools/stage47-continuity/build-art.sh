#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -f /tmp/honro-inkscape-headless-init.so ]]; then
  g++ -shared -fPIC tools/stage47-continuity/headless-init.cpp -ldl -o /tmp/honro-inkscape-headless-init.so
fi
python tools/stage47-continuity/trace.py art/stage47-continuity/source/concept.png art/stage47-continuity/source/trace
python tools/stage47-continuity/register.py
python tools/stage47-continuity/register-neck.py
python tools/stage47-continuity/partition.py
python tools/stage47-continuity/protect.py
python tools/vector-production/import-native-clip.py art/stage47-continuity/source/color-protected.svg art/stage47-continuity/source/protected-alpha.svg --config art/stage47-continuity/source/config.json --output shared/assets/environment/act5/stage47-continuous-rock.json
mkdir -p _local/stage47
node tools/stage47-continuity/check.mjs
python tools/stage47-continuity/check-mask.py
