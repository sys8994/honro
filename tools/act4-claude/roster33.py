#!/usr/bin/env python3
"""Stage 33 v2 roster — role clusters (spec G33-A/B) at places, not along the road.

a  G33-A ranged pressure from behind the west low rock, covering the channel
b  G33-B close block in the west channel bend (hounds, guard) at low tide
c  island post: bows and a warden on the island, the crossing's high ground
d  G33-B east channel bend: close block under the east arches
e  east rock gunners covering the east stair foot
f  arch road: a small picket at the west arches (does not seal the bypass)
g  gap holders: both ends of the plank over the broken arch
h  exit guard on the east arch end (midboss: tide-line gunner) with lantern
Spawn flat, the stairs and the long arch spans stay empty."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(33, '_local/reports/act4-pilot/stage33/claude', {
    'a': [('rock-w', 1150, 'bow', 0), ('flats', 1420, 'bow', 0), ('flats', 1560, 'guard', 0)],
    'b': [('flats', 2050, 'hound', 0), ('flats', 2180, 'hound', 0), ('flats', 2330, 'close', 0), ('flats', 2470, 'guard', 1)],
    'c': [('island', 2900, 'close', 0), ('island', 3020, 'bow', 0), ('island', 3170, 'arc', 1), ('island', 3320, 'bow', 0)],
    'd': [('flats', 4100, 'close', 0), ('flats', 4250, 'hound', 0), ('flats', 4400, 'guard', 0), ('flats', 4550, 'bind', 0)],
    'e': [('rock-e', 5330, 'bow', 0), ('rock-e', 5440, 'bow', 0), ('flats', 5750, 'guard', 1), ('flats', 5890, 'bind', 0)],
    'f': [('arch-w', 1500, 'guard', 0), ('arch-w', 1640, 'bow', 0)],
    'g': [('arch-w', 3380, 'bow', 0), ('arch-w', 3500, 'close', 0), ('arch-e', 4120, 'guard', 0), ('arch-e', 4260, 'bind', 0)],
    'h': [('arch-e', 5450, 'close', 0), ('arch-e', 5600, 'guard', 1), ('arch-e', 5760, 'midboss', 0), ('arch-e', 5900, 'lantern', 0), ('arch-e', 6080, 'bow', 0)],
}, active_limit=6)
