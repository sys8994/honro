#!/usr/bin/env python3
"""Stage 35 v2 roster — role clusters at places on the old road (spec G35-A/B/C).

r  ruin lookout: two behind the pillars at the west of clearing 1
a  G35-A close pressure behind the wall stub on clearing 1, by the flight foot
k  ditch ambush: hounds in the deep ditch (low detour)
b  G35-B stone-wall line of fire on clearing 2: guard at the wall, bows on the
   knoll for height, binder and warden covering the cleft foot
c  flank commander (midboss) on the crag landing over the flights
d  clearing 3 arrival guard behind the boulder
e  garrison under the ruined wall by the exit (lantern keeper)
Entry valley, entry stairs, the flights, the gully and the fallen bamboo stay empty."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(35, '_local/reports/act4-pilot/stage35/claude', {
    'r': [('clear-1', 1560, 'bow', 0), ('clear-1', 1700, 'bind', 0)],
    'a': [('clear-1', 2250, 'hound', 0), ('clear-1', 2380, 'close', 0), ('clear-1', 2520, 'guard', 1)],
    'k': [('ditch', 3500, 'hound', 0), ('ditch', 3650, 'hound', 0), ('ditch', 3800, 'close', 0)],
    'b': [('clear-2', 3150, 'guard', 1), ('clear-2', 3280, 'bow', 0), ('knoll', 3480, 'bow', 0), ('knoll', 3610, 'bow', 0),
          ('clear-2', 3850, 'bind', 0), ('clear-2', 4000, 'close', 0), ('clear-2', 4150, 'arc', 0)],
    'c': [('crag', 1980, 'guard', 0), ('crag', 2330, 'midboss', 0), ('crag', 2440, 'bow', 0)],
    'd': [('clear-3a', 3250, 'guard', 1), ('clear-3a', 3380, 'close', 0), ('clear-3a', 3510, 'bind', 0), ('clear-3a', 3820, 'bow', 0), ('clear-3a', 3910, 'bow', 0)],
    'e': [('clear-3b', 4640, 'bind', 0), ('clear-3b', 4800, 'hound', 0), ('clear-3b', 4950, 'close', 0), ('clear-3b', 5340, 'guard', 1), ('clear-3b', 5460, 'lantern', 0),
          ('clear-3b', 5580, 'bow', 0), ('clear-3b', 5700, 'bow', 0)],
}, active_limit=6)
