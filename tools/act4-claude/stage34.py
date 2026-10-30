#!/usr/bin/env python3
"""Stage 34 · 파도에 깎인 절벽 — sea-carved arch.

Geography: a stepped west cliff, a wave-cut sea cave open to the sea, a sea
stack inside the cave carrying the timber crossing, and the overhanging east
cliff whose roof ridge climbs to the exit. Route: shore -> carved terraces ->
cave bridge -> east ledge -> stairs under the roof -> roof tip -> ridge -> exit.
The cave floor is sea water (recover); the roof gives overhang fire both ways.
"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from painter import Painter, ROOT

N, W, H = 34, 6200, 8000
p = Painter(N, W, H, seed=34)

# Shore / seabed. The cave floor sits under recoverable sea water.
p.solid('shore', [(0, 7360), (500, 7375), (900, 7400), (1600, 7445), (2600, 7520), (3400, 7560), (4200, 7540),
                  (4800, 7430), (5300, 7385), (5700, 7365), (6000, 7380), (6200, 7400)],
        [(6200, 8300, 'c'), (0, 8300, 'c')], kind='earth', keep=[(-1, 700)], role='entry shore and cave seabed',
        extend=[[(-1600, 7340), (0, 7360), (0, 8300), (-1600, 8300)], [(6100, 7400), (7800, 7420), (7800, 8300), (6100, 8300)]])

# West cliff: carved terraces = slopes + short risers (jumpable), cave-side
# face undercut by waves.
p.solid('west-cliff',
        [(560, 7372), (700, 7300), (900, 7180), (930, 7030), (1220, 6860), (1250, 6710), (1540, 6540), (1570, 6390),
         (1860, 6220), (1890, 6070), (2180, 5900), (2210, 5750), (2500, 5580), (2600, 5562)],
        [(2650, 5590, 'c'), (2690, 5650), (2668, 5770, 'c'), (2600, 5910), (2548, 6110, 'c'), (2534, 6350),
         (2566, 6600, 'c'), (2626, 6850), (2690, 7100, 'c'), (2730, 7300), (2800, 7700, 'c'), (520, 7700, 'c'), (520, 7420)],
        role='carved terrace climb, cave-side undercut', keep=[(900, 2210)], amp=0.6)

# Sea stack inside the cave; its flat crown carries the bridge trestle and is a perch.
p.solid('cave-stack', [(3180, 5760), (3380, 5704), (3580, 5744)],
        [(3624, 5800, 'c'), (3604, 6000), (3562, 6300, 'c'), (3584, 6700), (3626, 7100, 'c'), (3664, 7720, 'c'),
         (3120, 7720, 'c'), (3150, 7100), (3192, 6700, 'c'), (3170, 6300), (3130, 6000, 'c'), (3150, 5800)],
        role='sea stack perch under the crossing', amp=0.4)

# East-cliff inner ledge where the crossing lands (separate shelf on the face).
p.solid('east-ledge', [(4050, 5542), (4300, 5522), (4560, 5530)],
        [(4640, 5560, 'c'), (4660, 5700), (4420, 5770, 'c'), (4220, 5730), (4070, 5630, 'c'), (4024, 5574)],
        role='crossing landing / stair foot', amp=0.3)

# East cliff + roof: one mass. Ridge from the roof tip up to the exit; cave
# ceiling under it; inner face down to the seabed; seaward face to the east.
p.solid('east-cliff',
        [(3170, 4330), (3320, 4250), (3500, 4140), (3900, 3910), (4300, 3712), (4700, 3520), (5000, 3330), (5500, 3040),
         (6000, 2830), (6200, 2800)],
        [(6196, 2880, 'c'), (6170, 3300), (6150, 3900, 'c'), (6188, 4600), (6160, 5400, 'c'), (6192, 6200),
         (6170, 7000, 'c'), (6198, 7720, 'c'),
         (4560, 7720, 'c'), (4600, 7200), (4560, 6700, 'c'), (4600, 6200), (4640, 5800, 'c'), (4600, 5300),
         (4540, 4900, 'c'), (4440, 4620), (4240, 4520, 'c'), (3900, 4500), (3560, 4560, 'c'), (3400, 4510),
         (3260, 4430, 'c'), (3176, 4396, 'c')],
        role='overhanging roof ridge to the exit', keep=[(5800, 6200)],
        extend=[(6150, 2810), (6600, 2900), (6900, 3400), (6780, 4300), (7100, 5200), (6950, 6300), (7250, 7600), (6150, 7600)])

# Timber: the crossing on the stack trestle, stairs under the roof.
p.deck('cave-bridge', [(2600, 5562), (3380, 5560), (4050, 5542)], role='crossing over the sea cave')
p.deck('cave-stairs', [(3030, 4486), (4420, 5524)], kind='stairs', role='stairs under the roof to the tip')

# Cover: boulders on the terraces and the ridge, crates on the ledge.
p.cover('terrace-boulder', 1640, 6503, 100, 130)
p.cover('ledge-crates', 4360, 5524, 90, 120, kind='crate')
p.cover('ridge-boulder', 4420, 3655, 110, 140)
p.cover('summit-boulder', 5340, 3135, 100, 130)

# Dressing (sparse): reeds on the entry shore, pines on the ridge.
for x in (180, 420):
    p.reeds(x, 7, 90)
p.pine(5650, 230)
p.pine(4000, 190)

base = {'version': 1, 'stage': N, 'intent': 'Sea-carved arch: carved west terraces, sea-cave crossing on a stack, stairs under an overhanging roof, ridge to the exit.',
        'activePlayBounds': {'left': 180, 'top': 2500, 'right': 6050, 'bottom': 7560},
        'spawn': {'x': 260, 'y': 7365},
        'routes': [{'id': 'arch-climb', 'supports': ['shore', 'west-cliff', 'cave-bridge', 'east-ledge', 'cave-stairs', 'east-cliff']},
                   {'id': 'stack-perch', 'supports': ['cave-bridge', 'cave-stack', 'cave-bridge']}],
        'connections': [{'fromSupport': 'cave-stairs', 'toSupport': 'east-cliff', 'mode': 'jump'}],
        'enemyAnchors': [],
        'act4': {'exit': {'x': 5950, 'y': 2840},
                 'wrongExit': {'actor': 'a4-34-g0-1', 'entrance': {'x': 3380, 'y': 5704}, 'exit': {'x': 3700, 'y': 4010}, 'optional': True},
                 'waterPolicies': [{'id': '34-cave-sea', 'kind': 'recover', 'x1': 2790, 'x2': 4560, 'surface': 7420, 'entryLeft': [2150, 2500], 'entryRight': [4100, 4500]},
                                   {'id': '34-open-sea', 'kind': 'lethal', 'x1': 6250, 'x2': 7800, 'surface': 7380}]},
        'cameraViews': [{'id': 'terraces', 'x': 1600, 'y': 6500, 'w': 3000, 'h': 2000}, {'id': 'cave', 'x': 3600, 'y': 5200, 'w': 3000, 'h': 2400}, {'id': 'ridge', 'x': 4800, 'y': 3400, 'w': 3000, 'h': 2000}],
        'status': 'Claude v1 geography; physics probe required'}
p.build(ROOT / 'art/act4-claude/stage34', ROOT / 'tools/act4-pilot/layouts/stage34-claude.json', base,
        far_preview=str(ROOT / 'shared/assets/environment/campaign-far/act4-far-coast.webp'))
