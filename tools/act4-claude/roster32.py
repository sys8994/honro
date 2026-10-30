#!/usr/bin/env python3
"""Stage 32 roster: outer-lane fight only; the shelter yard (4300-5300) stays quiet."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(32, '_local/reports/act4-pilot/stage32/claude', {
    'a': [('shore', 1300, 'hound', 0), ('shore', 1650, 'guard', 1), ('back-alley', 1800, 'bow', 0), ('back-alley', 2100, 'bow', 0), ('shore', 2600, 'close', 0), ('shore', 2900, 'guard', 0)],
    'b': [('net-loft', 3700, 'bow', 0), ('shore', 3950, 'guard', 0), ('shore', 4120, 'close', 0)],
    'c': [('shore', 5600, 'guard', 0), ('shore', 5750, 'bow', 0), ('exit-bluff', 6450, 'bow', 1), ('exit-bluff', 6560, 'lantern', 0)]}, active_limit=4)
