#!/usr/bin/env python3
"""Stage 32 v2 roster — role clusters (spec G32-A/B). Enemies hold the alleys
only; the common yard (reunion space) and the shelter door stay clear.

a  G32-A line of fire down the exposed upper alley: bows at the far end of the
   terrace, a guard by the house porch
b  G32-B close harassment along the walled lane: hounds and a guard behind the
   low walls, a binder in the undercroft arch
c  stair head: a small group at the top of the steps down into the yard
d  exit watch past the last house (lantern keeper)
Entrance landing, the yard and the shelter front are left empty."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(32, '_local/reports/act4-pilot/stage32/claude', {
    'a': [('upper-alley', 2300, 'guard', 1), ('upper-alley', 3050, 'bow', 0), ('upper-alley', 3180, 'bow', 0)],
    'b': [('lane-yard', 2050, 'hound', 0), ('lane-yard', 2180, 'hound', 0), ('lane-yard', 2550, 'guard', 0), ('lane-yard', 3000, 'bind', 0)],
    'c': [('upper-alley', 3380, 'close', 0), ('upper-alley', 3460, 'bow', 0)],
    'd': [('lane-yard', 5950, 'guard', 1), ('exit-rock', 6370, 'bow', 0), ('lane-yard', 6550, 'lantern', 0)],
}, active_limit=4)
