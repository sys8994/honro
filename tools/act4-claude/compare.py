#!/usr/bin/env python3
"""Side-by-side review sheet: user reference play layer | our art at the same framing."""
import sys, subprocess
from pathlib import Path
from PIL import Image
n, ref = sys.argv[1], sys.argv[2]
ROOT = Path(__file__).resolve().parents[2]
import json
L = json.load(open(ROOT / f'tools/act4-pilot/layouts/stage{n}-claude.json'))
out = ROOT / f'_local/reports/act4-claude/stage{n}/compare.png'
ours = ROOT / f'_local/reports/act4-claude/stage{n}/whole-art.png'
b = L['activePlayBounds']
x, y, w, h = b['left'] - 300, b['top'] - 500, b['right'] - b['left'] + 600, b['bottom'] - b['top'] + 800
subprocess.run([sys.executable, str(ROOT / 'tools/act4-claude/render.py'), n, str(x), str(y), str(w), str(h), '1000', str(ours)], check=True)
A = Image.open(ref).convert('RGBA'); bg = Image.new('RGB', A.size, (60, 70, 90)); bg.paste(A, mask=A.split()[-1]); A = bg
B = Image.open(ours).convert('RGB')
hgt = 900
A = A.resize((int(A.width * hgt / A.height), hgt)); B = B.resize((int(B.width * hgt / B.height), hgt))
S = Image.new('RGB', (A.width + B.width + 30, hgt + 20), (15, 20, 30)); S.paste(A, (10, 10)); S.paste(B, (A.width + 20, 10)); S.save(out)
print(out)
