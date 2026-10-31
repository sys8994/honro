#!/usr/bin/env python3
"""Stage 33 · 물 빠진 갯길 — v2 (design card: 6900x5200, aspect 1.33).

Plan (spec v0.2 33): the entry rock forks into the short low route across the
exposed flats (curving channels, a rock island beside them, low rocks for
cover; tide-affected) and the high bypass over the sea arches (a plank across
the broken arch; connected in every tide state). Both rejoin at the exit on the
east cliff. Fishermen's timber stair on the west cliff, carved stone stair on
the east cliff. Channels flood at high tide (recover water), flats stay dry.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 33, 6900, 5200
p = Painter(N, W, H, seed=33)
p.crag = True
LOW, HIGH = 4700, 4540

# ---- tidal flat (full width under the arches) with two curving channels
p.solid('flats', [(0, 4420), (700, 4410), (1100, 4430), (1500, 4470), (1750, 4560), (2000, 4630), (2300, 4640), (2550, 4560), (2800, 4450),
                  (3600, 4440), (3900, 4520), (4150, 4620), (4400, 4650), (4700, 4600), (4950, 4480), (5300, 4420), (6200, 4400), (6900, 4410)],
        [(W, H, 'c'), (0, H, 'c')], kind='earth', amp=0, role='exposed tidal flat with two channels',
        extend=[[(-1600, 4430), (40, 4420), (40, H + 1500), (-1600, H + 1500)], [(W - 40, 4410), (W + 1600, 4400), (W + 1600, H + 1500), (W - 40, H + 1500)],
                [(0, H - 40), (W, H - 40), (W, H + 1500), (0, H + 1500)]])
p.solids['flats']['sand'] = True
p.solid('island', [(2620, 4535), (2850, 4285), (2980, 4170), (3200, 4140), (3420, 4170), (3700, 4473)], [(3710, 4600, 'c'), (2590, 4600, 'c')],
        role='rock island beside the channels', amp=0.4)
p.solid('rock-w', [(980, 4432), (1050, 4300), (1250, 4290), (1320, 4440)], [(1330, 4500, 'c'), (970, 4500, 'c')], role='low rock: ranged pressure', amp=0.3)
p.solid('rock-e', [(5180, 4424), (5260, 4265), (5470, 4255), (5560, 4414)], [(5570, 4480, 'c'), (5170, 4480, 'c')], role='low rock by the east channel', amp=0.3)
# ---- high bypass over the sea arches (all tides)
p.shelf('arch-w', [(700, 2650), (1300, 2640), (1900, 2700), (2600, 2620), (3200, 2560), (3600, 2600)], [420, 380, 450, 380, 420, 360], kind='rock',
        role='entry rock and the west arches (high bypass)')
p.deck('arch-gap', [(3600, 2600), (4000, 2620)], role='planks over the broken arch')
p.shelf('arch-e', [(4000, 2620), (4600, 2700), (5200, 2640), (5700, 2560), (6200, 2500)], [380, 440, 400, 420, 380], kind='rock',
        role='east arches up to the exit')
p.solid('west-rock', [(0, 2500), (60, 2510), (110, 2560)], [(120, 3300, 'c'), (90, 3900), (115, 4420, 'c'), (0, 4420, 'c')], role='west cliff edge', amp=0)
p.solid('east-rock', [(6790, 2420), (6850, 2400), (6900, 2400)], [(6900, 4410, 'c'), (6800, 4410, 'c'), (6820, 3800), (6790, 3100, 'c')], role='east cliff edge', amp=0)
WT = p.stair_tower('wtower', 110, 700, 4410, 2650, start='east', end='east', role="fishermen's timber stair on the west cliff")
ET = p.stair_tower('etower', 6200, 6790, 4400, 2500, start='west', end='west', role='carved stone stair on the east cliff', kind='stonestair', pitch=0.6)
for k in ('arch-w', 'arch-e'):
    p.solids[k]['path'] = True
for k in ('island', 'rock-w', 'rock-e'):
    p.solids[k]['moss'] = False

# ---- arches, cut faces (behind actors)
p.sea_arches('arch-w', 'flats', [(900, 1640, 3140), (1880, 2660, 3190), (2900, 3500, 3040)], seed=331, tide=(LOW, HIGH))
p.sea_arches('arch-e', 'flats', [(4230, 5000, 3170), (5260, 5980, 3060)], seed=332, tide=(LOW, HIGH))
# loose rocks and weed across the flat (art only), larger ones in front at the edge
import random as _r
_g = _r.Random(33)
def fy(x):
    from painter import interp
    return interp(p.solids['flats']['walk'], x)
back = [(x, fy(x) - 6, _g.uniform(90, 220), _g.uniform(60, 170)) for x in (850, 1430, 2350, 3050, 3550, 4300, 4800, 5650, 6150, 6600)]
p.boulders('STRUCT', back, seed=333)
front = [(x, fy(x) + 60, _g.uniform(160, 300), _g.uniform(90, 160)) for x in (1250, 2900, 4700, 6400)]
p.boulders('FORE', front, seed=334)
p.art_features += ['sea-arches', 'tide-line']
# fishermen's hut on stilts at the top of the west stair
p.add('STRUCT', 'M160 2500 L160 2380 L330 2300 L500 2380 L500 2500 Z', '#4a4740')
p.add('STRUCT', 'M140 2392 L330 2286 L520 2392 L520 2370 L330 2262 L140 2370 Z', '#2d2c33')
p.add('STRUCT', 'M300 2500 L300 2420 L360 2420 L360 2500 Z', '#1c1d24')

for c in [('arch-boulder', 2250, 2655, 100, 120), ('arch-crate', 4700, 2690, 90, 100, 'crate'), ('flat-boulder', 6000, 4402, 120, 110)]:
    p.cover(*c)
for x in (3150, 5500):
    p.pine(x, 190)
for x in (1400, 3600, 5000, 5800):
    p.reeds(x, 5, 70, layer='REAR')

base = {'version': 2, 'stage': N, 'intent': 'Tidal passage: entry rock forks into the short low route across flats/channels/island (tide) and the high bypass over sea arches; both rejoin at the east exit.',
        'activePlayBounds': {'left': 180, 'top': 2200, 'right': 6700, 'bottom': 4700}, 'spawn': {'x': 420, 'y': 4415}, 'spawnSupport': 'flats',
        'envGroupY': {'a4-coast-33-rear': 4600},
        'act4': {'exit': {'x': 6050, 'y': 2515},
                 'tide': {'warningRound': 2, 'highRound': 5, 'lowRound': 7, 'low': LOW, 'high': HIGH},
                 'waterPolicies': [{'id': '33-west', 'kind': 'recover', 'x1': 1450, 'x2': 2650, 'surface': HIGH, 'entryLeft': [700, 950], 'entryRight': [2900, 3500]},
                                   {'id': '33-east', 'kind': 'recover', 'x1': 3750, 'x2': 4980, 'surface': HIGH, 'entryLeft': [3350, 3700], 'entryRight': [5600, 6100]}],
                 'coords': {'waterMarkX': 2100, 'upperMarkX': 3000, 'upperMarkY': 2560}},
        'routes': [{'id': 'flats', 'supports': ['flats', 'rock-w', 'flats', 'island', 'flats', 'rock-e', 'flats'] + ET + ['arch-e']},
                   {'id': 'arches', 'supports': ['flats'] + WT + ['arch-w', 'arch-gap', 'arch-e']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage33', ROOT / 'tools/act4-pilot/layouts/stage33-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
