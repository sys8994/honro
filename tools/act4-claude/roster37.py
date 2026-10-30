#!/usr/bin/env python3
"""Stage 37 v2 roster — role clusters at the places the hauling road is held,
with empty stretches between them (no even spacing along the road).

a  first-switchback picket: holds the tower foot and the hoist base on R1
b  breach holders: both lips of the collapsed R2 wall, crossfire over the planks;
   an archer behind the R2 crate covers the tower arrival
c  gate vanguard (midboss) behind the knee rock at the R3 east end, warden
   and bows commanding the third tower; a forward guard in front of the rock
d  hoist-head archers on R3W shooting down the second scaffold
e  last-switchback guard post on R4 west end below the pass
f  crate nest on R4 (archers behind the crate, facing the tower arrival)
g  crest spotters behind the pass rock
h  signal outpost by the exit: lantern keeper with guard, bows, hound
Long R1 approach, R2W west, R3 middle and the pass west are left empty."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(37, '_local/reports/act4-pilot/stage37/claude', {
    'a': [('road-1', 3900, 'hound', 0), ('road-1', 4060, 'guard', 0), ('road-1', 4210, 'close', 0)],
    'b': [('road-2', 4100, 'bow', 0), ('road-2', 3800, 'bind', 0), ('road-2w', 2920, 'guard', 1), ('road-2w', 2760, 'close', 0), ('road-2w', 2590, 'bow', 0)],
    'c': [('road-3', 3950, 'close', 0), ('road-3', 4090, 'guard', 0), ('road-3', 4420, 'midboss', 0), ('road-3', 4600, 'arc', 1),
          ('road-3', 4740, 'bow', 0), ('road-3', 4875, 'bow', 0)],
    'd': [('road-3w', 2040, 'bow', 0), ('road-3w', 2180, 'bow', 0)],
    'e': [('road-4', 1000, 'guard', 1), ('road-4', 1150, 'close', 0), ('road-4', 1310, 'bind', 0), ('road-4', 1470, 'bow', 0)],
    'f': [('road-4', 3180, 'bow', 0), ('road-4', 3040, 'bow', 0)],
    'g': [('pass', 3760, 'bow', 0), ('pass', 3910, 'bind', 0)],
    'h': [('pass', 4850, 'hound', 0), ('pass', 5000, 'close', 0), ('pass', 5150, 'guard', 1), ('pass', 5300, 'lantern', 0),
          ('pass', 5450, 'bow', 0), ('pass', 5600, 'bow', 0)],
}, active_limit=6)
