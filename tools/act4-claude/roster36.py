#!/usr/bin/env python3
"""Stage 36 v2 roster — spec G36-A/B: a few possessed things at the entrance
and the empty workshop's outskirts, a short defence on the outskirts path.
The quiet event yard is never a battlefield; not every villager becomes a
monster.

a  G36-A low threat at the workshop terrace edge (possessed frames and a guard)
g  G36-A on the broken gallery: two shooters watching the yard edge
b  G36-B short defence on the outskirts climb and the exit ledge"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from roster import place
place(36, '_local/reports/act4-pilot/stage36/claude', {
    'a': [('workshop', 1950, 'guard', 0), ('workshop', 2100, 'close', 0), ('workshop', 2230, 'bind', 0)],
    'g': [('gallery-e', 4150, 'bow', 0), ('gallery-e', 4300, 'bow', 0)],
    'b': [('exit-ledge', 6430, 'guard', 1), ('exit-ledge', 6620, 'bow', 0), ('east', 5950, 'close', 0), ('exit-ledge', 6740, 'lantern', 0)],
}, active_limit=4)
