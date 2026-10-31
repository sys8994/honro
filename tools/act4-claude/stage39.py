#!/usr/bin/env python3
"""Stage 39 · 돌아오는 물 — v2 (design card: 8600x6000, aspect 1.43).

Plan (spec v0.2 39): entry high ground A (west) -> wreck frame and the low
combat basin (tide floods it; recover banks on both sides) -> rescue lane with
the net and the anchor -> second safe high ground B -> plank over the open sea
channel -> exit ledge. Flood-independent bypass: rope bridge from A to the
middle rock, carved stairs down to the rescue lane. Residents walk the lane and
the ramp to B without jumping. The Korean hull wreck (boss) lies in the basin
and its broken deck is the gangway up to the lane.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT, interp

N, W, H = 39, 8600, 6000
p = Painter(N, W, H, seed=39)
p.crag = True
LOW, HIGH = 5460, 5000

# ---- A: entry high ground
p.solid('high-a', [(0, 3000), (500, 2985), (900, 2990), (1300, 3000)], [(1270, 3300), (1290, 3700, 'c'), (1250, 4100), (1285, 4460, 'c'), (1300, 4912, 'c'), (1300, H, 'c'), (0, H, 'c')], role='entry high ground A', amp=0,
        extend=[(-1600, 3010), (40, 3000), (40, H + 1500), (-1600, H + 1500)])
p.solid('a-crag', [(700, 2991), (780, 2890), (880, 2872), (960, 2900), (1000, 2991)], [(1010, 3040, 'c'), (690, 3040, 'c')], role='lookout rock on A', amp=0.3)
# ---- basin (tide) with recover banks at both ends, rocks, wreck gangway
BASIN = [(1300, 4912), (1700, 4914), (2150, 4918), (2450, 5190), (2650, 5370), (2800, 5420), (3200, 5400), (3600, 5250), (3850, 5000), (4000, 4930), (4400, 4920)]
p.solid('basin', BASIN, [(4400, H, 'c'), (1300, H, 'c')], kind='rock', amp=0, role='tidal basin floor with recover banks',
        extend=[(0, H - 40), (W, H - 40), (W, H + 1500), (0, H + 1500)])
p.solids['basin']['sand'] = True
p.solids['basin']['moss'] = False
p.solid('basin-rock-1', [(2900, 5421), (2970, 5300), (3100, 5290), (3160, 5408)], [(3170, 5460, 'c'), (2890, 5470, 'c')], role='basin rock', amp=0.3)
p.solid('basin-rock-2', [(3280, 5376), (3350, 5260), (3460, 5250), (3520, 5286)], [(3530, 5420, 'c'), (3270, 5430, 'c')], role='basin rock', amp=0.3)
for k in ('basin-rock-1', 'basin-rock-2'):
    p.solids[k]['moss'] = False
p.deck('gangway', [(3900, 4962), (4440, 4458)], role="the wreck's broken deck as a gangway up to the lane")
# switchback road carved down the A cliff (three ramps, each a thin shelf)
p.shelf('ramp-1', [(1300, 3000), (2100, 3583)], [130, 130], kind='rock', role='carved ramp 1 down the A cliff')
p.shelf('ramp-2', [(1420, 4300), (2120, 3760), (2320, 3760)], [130, 130, 150], kind='rock', role='carved ramp 2 (switchback)')
p.shelf('ramp-3', [(1320, 4470), (1500, 4470), (2050, 4906)], [150, 130, 120], kind='rock', role='carved ramp 3 to the west recover bank')
for k in ('ramp-1', 'ramp-2', 'ramp-3'):
    p.solids[k]['steps'] = [(p.solids[k]['walk'][0][0] + 10, p.solids[k]['walk'][-1][0] - 10)]
    p.solids[k]['moss'] = False
T = ['ramp-1', 'ramp-2', 'ramp-3']
p.deck('wreck-scaffold', [(2480, 5180), (2760, 5178)], role='timber scaffold against the wreck')
p.solid('ledge-rock', [(8080, 4293), (8130, 4210), (8230, 4205), (8270, 4294)], [(8280, 4340, 'c'), (8070, 4340, 'c')], role='rock on the exit ledge', amp=0)
p.deck('bridge-head', [(1080, 2850), (1300, 2850)], role='timber bridge-head on A (rope anchor)')
p.solid('mid-knob', [(2600, 3194), (2680, 3100), (2800, 3095), (2860, 3184)], [(2870, 3240, 'c'), (2590, 3240, 'c')], role='rock knob on the middle rock', amp=0.2)
p.deck('crane-deck', [(8360, 4150), (8560, 4150)], role='crane platform on the exit ledge')
# ---- flood-independent bypass: rope bridge, middle rock, carved stairs
p.deck('rope-bridge', [(1300, 2850), (1800, 2990), (2300, 3195)], kind='rope', role='rope bridge from A (bypass)')
p.shelf('mid-rock', [(2300, 3200), (2900, 3180), (3600, 3210)], [520, 600, 480], kind='rock', role='middle rock over the basin')
p.deck('mid-stairs', [(3600, 3210), (4800, 4448)], kind='stonestair', role='carved stairs down to the rescue lane')
# ---- rescue lane -> ramp -> safe high ground B (residents walk, no jumps)
p.solid('lane', [(4400, 4455), (5000, 4450), (5600, 4445), (5950, 4440), (6350, 4120), (7000, 4100), (7700, 4105)],
        [(7700, H, 'c'), (4400, H, 'c')], role='rescue lane, ramp and safe high ground B', amp=0)
p.solids['lane']['path'] = True
p.solid('b-crag', [(7100, 4101), (7180, 3960), (7350, 3940), (7460, 3990), (7520, 4103)], [(7530, 4160, 'c'), (7090, 4160, 'c')], role='rock on B (height)', amp=0.3)
p.deck('net-gallery', [(4700, 4285), (5400, 4280)], role='net-drying gallery over the lane')
# ---- exit over the open channel
p.deck('exit-plank', [(7700, 4104), (7960, 4300)], role='plank over the open sea channel')
p.solid('exit-ledge', [(7960, 4300), (8300, 4290), (8600, 4295)], [(8600, H, 'c'), (7960, H, 'c')], role='exit ledge with the old crane', amp=0,
        extend=[(8560, 4295), (10200, 4280), (10200, H + 1500), (8560, H + 1500)])

# loose rocks across the basin and banks (art only), a few large ones in front
import random as _r
_g = _r.Random(39)
def by(x):
    return interp(p.solids['basin']['walk'], x)
p.boulders('STRUCT', [(x, by(x) - 4, _g.uniform(110, 260), _g.uniform(70, 190)) for x in (1450, 1900, 2380, 2620, 3300, 3700, 4150)], seed=393)
p.boulders('FORE', [(x, by(x) + 70, _g.uniform(180, 320), _g.uniform(90, 170)) for x in (1750, 2900, 4250)], seed=394)
p.boulders('STRUCT', [(x, interp(p.solids['lane']['walk'], x) - 4, _g.uniform(100, 180), _g.uniform(60, 120)) for x in (4550, 6200, 7600)], seed=395)
# ---- art: middle rock legs, sea channel cut, crane, wall faces
p.sea_arches('mid-rock', 'basin', [(2330, 2620, 3900), (3120, 3570, 3850)], seed=391, tide=(LOW, HIGH))
# the cliff spur the switchback ramps are carved into (behind actors)
from shapely.geometry import Polygon as _P
p.rock_mass('STRUCT', _P([(1260, 3000), (2100, 3590), (2330, 3770), (2300, 4100), (2210, 4500), (2150, 4912), (1300, 4914)]).buffer(0), 396, cell=300)
p.add('STRUCT', 'M7700 4140 L7720 5200 L7700 6000 L7960 6000 L7950 5000 L7960 4330 Z', '#0d1830')
for d in ('M8350 4290 L8350 3750 L8390 3750 L8390 4290 Z', 'M8360 3760 L8600 3700 L8606 3726 L8366 3790 Z', 'M8580 3720 L8586 3720 L8586 3980 L8580 3980 Z'):
    p.add('STRUCT', d, '#403e47')
p.art_features += ['open-channel', 'wreck-basin']
for c in [('mid-boulder', 3000, 3182, 110, 120), ('ledge-crate', 8525, 4294, 65, 90, 'crate')]:
    p.cover(*c)
p.pine(600, 200)
p.pine(7300, 180)

RES = [5000, 5130, 5260, 5390]
base = {'version': 2, 'stage': N, 'intent': 'Returning tide: high ground A, wreck basin (tide), rescue lane to safe high ground B, rope-bridge bypass, exit over the open channel.',
        'activePlayBounds': {'left': 180, 'top': 2500, 'right': 8500, 'bottom': 5500}, 'spawn': {'x': 260, 'y': 3000}, 'spawnSupport': 'high-a',
        'envGroupY': {'a4-coast-39-rear': 5300},
        'keepElements': ['a4-coast:net'], 'moveElements': {'a4-coast:net': {'x': 5600, 'y': 4445}},
        'npcs': [{'x': x, 'y': round(interp(p.solids['lane']['walk'], x) - 0.5, 2)} for x in RES],
        'act4': {'exit': {'x': 8300, 'y': 4290},
                 'tide': {'warningRound': 2, 'highRound': 5, 'lowRound': 7, 'low': LOW, 'high': HIGH},
                 'waterPolicies': [{'id': '39-wreck-water', 'kind': 'recover', 'x1': 2200, 'x2': 3880, 'surface': HIGH, 'entryLeft': [1300, 2150], 'entryRight': [3880, 4400]},
                                   {'id': '39-open-channel', 'kind': 'lethal', 'x1': 7720, 'x2': 7950, 'surface': 5600}],
                 'rescue': {'ids': ['a4-rescue-0', 'a4-rescue-1', 'a4-rescue-2', 'a4-rescue-3'], 'safeX': [6550, 6700, 6850, 7000], 'safeY': 4100,
                            'anchor': {'x': 5950, 'y': 4440}, 'net': {'x': 5600, 'y': 4445}, 'exit': 8300, 'bossRequired': False,
                            'safeZone': {'x1': 6400, 'x2': 7700, 'y1': 4000, 'y2': 4170}},
                 'enemyExclusion': [{'id': 'west-recovery-bank', 'x1': 1300, 'x2': 2150, 'y1': 4780, 'y2': 4960},
                                    {'id': 'east-recovery-bank', 'x1': 3880, 'x2': 4400, 'y1': 4800, 'y2': 5000},
                                    {'id': 'rescue-high-ground', 'x1': 6400, 'x2': 7700, 'y1': 3980, 'y2': 4180}],
                 'coords': {'waterMarkX': 2700, 'upperMarkX': 2900, 'upperMarkY': 3180, 'bossWakeX': 1250, 'wreckMarkX': 2750, 'wreckMarkY': 5000,
                            'handX1': 6450, 'handX2': 6650}},
        'routes': [{'id': 'basin', 'supports': ['high-a'] + T + ['basin', 'gangway', 'lane', 'exit-plank', 'exit-ledge']},
                   {'id': 'bypass', 'supports': ['high-a', 'bridge-head', 'rope-bridge', 'mid-rock', 'mid-stairs', 'lane', 'exit-plank', 'exit-ledge']}],
        'enemyAnchors': [], 'status': 'Claude v2 (plan-gated)'}
p.build(ROOT / 'art/act4-claude/stage39', ROOT / 'tools/act4-pilot/layouts/stage39-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
