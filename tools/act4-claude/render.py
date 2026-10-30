#!/usr/bin/env python3
"""render.py N x y w h pxwidth out.png  -- crop of the review preview via Inkscape."""
import sys, re, subprocess
from pathlib import Path
n, x, y, w, h, px, out = sys.argv[1:8]
src = Path('_local/reports/act4-claude/stage%s/preview.svg' % n).read_text()
src = re.sub(r'<svg ([^>]*?)width="\d+" height="\d+" viewBox="[^"]*"', r'<svg \1width="%s" height="%s" viewBox="%s %s %s %s"' % (w, h, x, y, w, h), src, count=1)
tmp = Path('/tmp/claude-0/-home-user/ce99f28e-d0a2-5521-9bd0-ca7baa6be50e/scratchpad/_render_%s.svg' % n)
tmp.write_text(src)
subprocess.run(['inkscape', str(tmp), '--export-type=png', '--export-width=%s' % px, '--export-filename=%s' % out], stderr=subprocess.DEVNULL, check=True)
