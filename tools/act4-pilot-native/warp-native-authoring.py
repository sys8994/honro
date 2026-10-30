#!/usr/bin/env python3
"""Unbounded *authoring-only* curve data, to be partitioned before runtime validation."""
import importlib.util,json,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('w',Path(__file__).with_name('warp-native-curves.py'));w=importlib.util.module_from_spec(s);s.loader.exec_module(w)
w.safe_chunks=lambda subs,rule:[''.join(d for d,_,_ in subs)]
a,r=w.run(json.load(open(sys.argv[1])),json.load(open(sys.argv[2])));r['status']='AUTHORING ONLY: illegal runtime path sizes possible; mandatory post-partition validator';Path(sys.argv[3]).write_text(json.dumps(a,separators=(',',':')));Path(sys.argv[3]).with_suffix('.report.json').write_text(json.dumps(r));print(json.dumps(r))
