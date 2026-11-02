"""Run unchanged strict metric on existing full-resolution images, one scale/process.
Use flock /tmp/honro-heavy-art.lock. This avoids retained review-sheet memory.
"""
import sys,json,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[2];spec=importlib.util.spec_from_file_location('opt',root/'tools/vector-production/optimize-svg.py');o=importlib.util.module_from_spec(spec);spec.loader.exec_module(o)
p=Path(sys.argv[1]);scale=int(sys.argv[2]);cfg=json.load(open(p/'pixel-config.json'));cfg['sourcePalette']=[[41,58,53],[57,73,66],[75,89,80],[86,97,39],[103,114,100],[114,123,51],[125,132,119]]
r=o.compare(p/f'qa-final/raw-{scale}x.png',p/f'qa-final/candidate-{scale}x.png',scale,cfg);(p/f'qa-final/scale-{scale}.json').write_text(json.dumps(r,indent=2));print(json.dumps(r));raise SystemExit(0 if r['pass'] else 2)
