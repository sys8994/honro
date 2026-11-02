"""Same strict geometry/color limits as stage20 production; contacts protected."""
import importlib.util,json,gzip
from pathlib import Path
H=Path(__file__).resolve().parent;root=H.parents[1];base=root/'_local/reports/stage20-contact-precision'
s=importlib.util.spec_from_file_location('opt',root/'tools/vector-production/optimize-svg.py');o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
stage=json.loads(gzip.decompress((root/'art/act2-near-vector-candidates/stage20-exit-v1/source/effective-stage.json.gz').read_bytes()));floor=next(t for t in stage['terrains'] if t['id']=='act2-floor');ps=floor['points'];rows=[]
for v in json.loads((base/'views.json').read_text()):
 def pt(p):return [(p['x']-v['x'])*v['scale']+720,(p['y']-v['y'])*v['scale']+450]
 lines=[{'points':[pt(ps[i]),pt(ps[i+1])],'width':12} for i in floor['properties']['honroWalkEdges']]
 cfg={'limits':{'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedPolylines':lines,'protectedRgbQuantizationTolerance255':1,'sourcePalette':[[40,59,70],[48,70,79],[58,80,89],[72,94,102],[82,107,114],[60,83,92],[83,110,117],[120,139,137]]}
 error=o.compare(base/(v['name']+'-raw.png'),base/(v['name']+'-final.png'),1,cfg);rows.append({'view':v,**error});print(v['name'],error,flush=True)
(base/'comparison.json').write_text(o.safe_json({'scope':'High-precision authoring reference vs unchanged-budget validated production draw; actual clip and contact protected. Not source-concept fidelity, browser or gameplay approval.','qualityPass':all(r['pass'] for r in rows),'vectorHashes':json.loads((base/'vector-sha256.json').read_text()),'rows':rows},indent=2))
raise SystemExit(0 if all(r['pass'] for r in rows) else 2)
