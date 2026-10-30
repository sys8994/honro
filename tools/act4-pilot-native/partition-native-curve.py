#!/usr/bin/env python3
"""Bounded .02-world curve flatten + winding-preserving GEOS partition fallback."""
import sys,json
from pathlib import Path
sys.path.insert(0,'/tmp/honro-pilot-python');sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'vector-production'))
from bounded_flatten import flatten
from partition_geometry import partition_linear
q=json.load(sys.stdin);r=partition_linear(flatten(q['d'],.02),q.get('fillRule','nonzero'),limit=q.get('limit',40000),coordinate_grid=.001);r['curveFlattenBoundWorld']=.02;r['coordinateGridWorld']=.001;print(json.dumps(r))
