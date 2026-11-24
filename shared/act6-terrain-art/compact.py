#!/usr/bin/env python3
"""Emit the renderer's compact deterministic data; editor source is author.py."""
import json,sys
from pathlib import Path
src,dest=map(Path,sys.argv[1:])
art=json.loads(src.read_bytes())
rows={}
for stage,group in art.items():
 v={}
 for name,(count,shapes) in group['authored'].items():
  p=sorted(set(a['fill'] for a in shapes));idx={c:i for i,c in enumerate(p)}
  v[name]=[count,p,[[idx[s['fill']],*[j for point in s['points'] for j in (round(point['x']*10),round(point['y']*10))]] for s in shapes]]
 rows[stage]=json.dumps(v,separators=(',',':'))
dest.write_text('const act6TerrainArtRows='+json.dumps(rows,ensure_ascii=True,separators=(',',':'))+';\n')
