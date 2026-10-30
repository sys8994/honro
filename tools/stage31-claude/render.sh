#!/bin/sh
# usage: render.sh x y w h pxwidth out.png [svg]
SVG=${7:-_local/reports/stage31-claude/preview.svg}
SP=/tmp/claude-0/-home-user/ce99f28e-d0a2-5521-9bd0-ca7baa6be50e/scratchpad
sed -E "s#viewBox=\"[^\"]*\"#viewBox=\"$1 $2 $3 $4\"#; s#width=\"10400\" height=\"5000\"#width=\"$3\" height=\"$4\"#; s#href=\"file://[^\"]*\"#href=\"file://$SP/far.png\"#" "$SVG" > $SP/_r.svg
inkscape $SP/_r.svg --export-type=png --export-width=$5 --export-filename=$6 2>/dev/null
