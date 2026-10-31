#!/usr/bin/env python3
"""Review sheet: reference | engine whole (top row), play views (bottom row)."""
import sys
from PIL import Image
n, ref, views = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
R = '_local/reports/act4-claude/stage%s/' % n
A = Image.open(ref).convert('RGBA'); bg = Image.new('RGB', A.size, (60, 70, 90)); bg.paste(A, mask=A.split()[-1])
top = [bg, Image.open(R + 'v1/whole.png').convert('RGB')]
bot = [Image.open(R + 'v1/%s.png' % v).convert('RGB') for v in views]
h, bh = 700, 400
top = [i.resize((int(i.width * h / i.height), h)) for i in top]; bot = [i.resize((int(i.width * bh / i.height), bh)) for i in bot]
W = max(sum(i.width for i in top) + 30, sum(i.width for i in bot) + 10 * (len(bot) + 1))
S = Image.new('RGB', (W, h + bh + 30), (15, 20, 30)); x = 10
for i in top: S.paste(i, (x, 10)); x += i.width + 10
x = 10
for i in bot: S.paste(i, (x, h + 20)); x += i.width + 10
S.save(R + 'review-v2.png'); print(R + 'review-v2.png')
