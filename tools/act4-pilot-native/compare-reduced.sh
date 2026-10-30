#!/bin/bash
set -u
for d in art/act4-pilot-common-v1/objects/*; do
 python tools/vector-production/compare-svg.py "$d/raw.svg" "$d/reduced.svg" --config "$d/use-scale-config.json" --output-dir "$d/qa-reduced"
 python tools/vector-production/import-svg.py "$d/reduced.svg" --config "$d/asset-config.json" --output "$d/reduced-asset.json"
 node tools/vector-production/render-asset.mjs "$d/reduced-asset.json" "$d/qa-reduced/runtime.png" 600
done
