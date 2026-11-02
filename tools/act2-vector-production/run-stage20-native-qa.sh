#!/bin/bash
set -euo pipefail
base=/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage20
for part in outer-v1 west-v2 east-v2; do
 cp "$base/$part/native.json" "$base/$part/native-raw.json"
 python tools/act2-vector-production/minify-stage20-lossless.py "$base/$part/candidate-p2.svg"
 cp "$base/$part/candidate-packed.svg" "$base/$part/candidate-contact.svg"
 python tools/vector-production/import-svg.py "$base/$part/candidate-contact.svg" --config "$base/$part/config.json" --output "$base/$part/native-candidate-contact.json"
done
HONRO_STAGE20_ART_QA=1 HONRO_STAGE20_ART_FILE=native-raw.json HONRO_STAGE20_ART_OUT="$PWD/_local/reports/stage20-raw-composite-opaque" node tools/act2-vector-production/preview-stage20-art.mjs "$base"
HONRO_STAGE20_ART_QA=1 HONRO_STAGE20_ART_FILE=native-candidate-contact.json HONRO_STAGE20_ART_OUT="$PWD/_local/reports/stage20-final-composite-contact" node tools/act2-vector-production/preview-stage20-art.mjs "$base"
python tools/act2-vector-production/compare-stage20-native.py "$base"
