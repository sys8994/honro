#!/usr/bin/env python3
"""Stage 39 v2 roster — role clusters at places; the wreck boss is kept (fixed,
in the basin). Spec: auxiliaries vary close pressure / line-of-fire watch and
never hold the recover banks, the rescue high ground or every bypass entry.

a  A lookout: two bows on the lookout rock (shoot down into the basin)
r  ramp ambush on the carved switchback (middle ramp)
w  wreck crew in the basin around the wreck scaffold (close pressure)
m  middle rock post over the bypass: guard and warden, bow on the knob
n  net holders on the lane by the net (midboss 그물봉쇄체 with guard/close)
g  net gallery shooters over the lane
x  exit watch on the exit ledge by the crane
Recover banks, rescue high ground B and the rope bridge stay clear."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
D = '_local/reports/act4-pilot/stage39/claude'
cells = {
    'a': [('a-crag', 830, 'bow', 0), ('a-crag', 930, 'bow', 0)],
    'r': [('ramp-2', 1650, 'close', 0), ('ramp-2', 1800, 'hound', 0), ('ramp-2', 1950, 'guard', 0)],
    'w': [('basin', 2420, 'hound', 0), ('basin', 2560, 'close', 0), ('basin', 3250, 'guard', 1), ('basin-rock-2', 3400, 'close', 0), ('basin', 3620, 'bind', 0)],
    'm': [('mid-rock', 2400, 'guard', 0), ('mid-rock', 2520, 'bind', 0), ('mid-knob', 2740, 'bow', 0), ('mid-rock', 3150, 'arc', 1), ('mid-rock', 3300, 'bow', 0)],
    'n': [('lane', 5550, 'guard', 1), ('lane', 5680, 'midboss', 0), ('lane', 5820, 'close', 0), ('lane', 5470, 'bind', 0)],
    'g': [('net-gallery', 4780, 'bow', 0), ('net-gallery', 4920, 'bow', 0), ('net-gallery', 5300, 'arc', 0)],
    'x': [('exit-ledge', 8000, 'guard', 1), ('ledge-rock', 8170, 'bow', 0), ('exit-ledge', 8340, 'lantern', 0), ('exit-ledge', 8480, 'bow', 0)],
}
stage = place(39, D, cells, active_limit=6, relocation=(6000, 'lane'))
world = json.loads(Path('shared/data/act4/world.json').read_text())
wreck = next(u for u in next(s for s in world['stages'] if s['metadata']['stageId'] == 39)['units'] if u['id'] == 'a4-wreck')
bp = json.loads(Path(D + '/blueprint.json').read_text())
top = next(s for s in bp['surfaces'] if s['id'] == 'basin')['top']
x = 2750
y = next(y0 + (y1 - y0) * (x - x0) / (x1 - x0) for (x0, y0), (x1, y1) in zip(top, top[1:]) if x0 <= x <= x1)
wreck = dict(wreck, x=x, y=round(y, 2))
stage['units'].append(wreck)
stage['design']['vectorWreckAssetId'] = 's39c:korean-wreck'
Path(D + '/roster/stage.json').write_text(json.dumps(stage))
print('wreck', wreck['x'], wreck['y'])
