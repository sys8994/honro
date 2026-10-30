#!/usr/bin/env python3
"""Korean flat-bottomed fishing hull (한선) wreck for the Stage 39 wreck boss.
Local frame of the boss unit: foot at (0,0), hull within x -620..620, y -390..80.
No cannon, no keel, no western stern castle (handoff rule: no western pirate ship)."""
from pathlib import Path
import json, subprocess, sys
ROOT = Path(__file__).resolve().parents[2]
D, M, L, PL, ROPE, NET = '#2f2b2e', '#4a4440', '#6b625a', '#857a6c', '#a89c84', '#8d927e'
P = []
def poly(pts, fill): P.append('<path d="M%s Z" fill="%s"/>' % (' L'.join('%d %d' % p for p in pts), fill))
# Hull, listing slightly to the left: flat bottom sunk into the seabed, straight
# sides, blunt square bow (left), raised stern (right).
hull = [(-600, -150), (-560, -210), (380, -230), (520, -300), (600, -310), (590, -180), (540, 60), (-540, 70), (-610, -40)]
poly(hull, M)
poly([(-560, -210), (380, -230), (520, -300), (600, -310), (596, -282), (520, -272), (380, -204), (-556, -186)], PL)  # gunwale
for k, y in enumerate([-170, -120, -70, -20, 30]):  # thick horizontal strakes
    poly([(-596 + k * 4, y), (560 - k * 6, y - 6), (556 - k * 6, y + 6), (-594 + k * 4, y + 12)], D)
for x in (-430, -230, -30, 170, 350):  # crossbeams (가룡) through the sides
    poly([(x - 14, -214), (x + 14, -216), (x + 16, -150), (x - 12, -148)], L)
    poly([(x - 10, -150), (x + 10, -150), (x + 10, -136), (x - 10, -136)], D)
for pts in ([(-260, -140), (-140, -150), (-170, -40), (-250, -10), (-300, -70)], [(120, -110), (230, -120), (210, -20), (130, 0)], [(400, -170), (470, -200), (480, -90), (420, -60)]):
    poly(pts, '#1b1d26')  # broken-out planking showing the dark hold
poly([(560, -300), (600, -310), (604, -400), (588, -404), (572, -330)], D)  # stern post
# Broken mast with a torn bamboo-batten mat sail and stays.
poly([(-40, -228), (-12, -230), (-4, -560), (-30, -620), (-34, -560)], L)
poly([(-30, -620), (-4, -560), (8, -590)], D)
sail = [(-16, -540), (210, -500), (240, -420), (190, -380), (230, -330), (120, -300), (-12, -330)]
poly(sail, '#5c5a52')
for y in (-500, -455, -410, -365):
    poly([(-12, y), (200 + (y + 500) * .2, y + 30), (196 + (y + 500) * .2, y + 36), (-12, y + 8)], D)
poly([(-30, -560), (-500, -214), (-492, -210), (-26, -548)], ROPE)
poly([(-6, -560), (500, -296), (494, -290), (-8, -548)], ROPE)
# Fishing net draped over the bow side.
net = [(-580, -210), (-420, -220), (-380, -120), (-430, -20), (-560, 0), (-610, -90)]
poly(net, NET)
for i in range(6):
    poly([(-590 + i * 34, -212), (-586 + i * 34, -212), (-560 + i * 30, 0), (-564 + i * 30, 0)], '#5e6457')
out = ROOT / 'art/act4-claude/stage39/extra/korean-wreck.svg'
out.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="1100" viewBox="-650 -640 1300 740">%s</svg>' % ''.join(P))
cfg = {'id': 's39c:korean-wreck', 'name': 'Stage39 Korean wreck', 'semanticLayer': 'REAR', 'category': 'prop',
       'bounds': {'x': -650, 'y': -640, 'w': 1300, 'h': 740}, 'anchor': {'x': 0, 'y': 0}, 'foot': {'x': 0, 'y': 0},
       'params': {'artRevision': 1, 'author': 'claude-direct-vector'}}
mod = ROOT / '_local/reports/act4-claude/stage39/modules'
(mod / 'korean-wreck.config.json').write_text(json.dumps(cfg))
subprocess.run([sys.executable, str(ROOT / 'tools/vector-production/import-svg.py'), str(out), '--config', str(mod / 'korean-wreck.config.json'), '--output', str(mod / 'korean-wreck.asset.json')], check=True)
idx = json.loads((mod / 'index.json').read_text())
idx = [r for r in idx if r.get('assetId') != 's39c:korean-wreck'] + [{'name': 'korean-wreck', 'layer': 'LIBRARY', 'asset': str((mod / 'korean-wreck.asset.json').relative_to(ROOT)), 'assetId': 's39c:korean-wreck', 'libraryOnly': True}]
(mod / 'index.json').write_text(json.dumps(idx, indent=1))
