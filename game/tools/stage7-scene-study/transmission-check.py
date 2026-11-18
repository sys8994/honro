from pathlib import Path
import sys,json,numpy as np
from PIL import Image
P=Path(sys.argv[1]);old=Path(sys.argv[2])if len(sys.argv)>2 else Path('stage7-joined-chrome');prior=json.loads((old/'closure-source-over.json').read_text());rows=[]
for row in prior['rows']:
 view=row['view'];points=[('opaque',p)for p in row['opaqueFirst']]+[('outsideFootprint',p)for p in row['outsideFirst']]
 if not points:continue
 imgs={k:np.array(Image.open(P/f'closure-{view}-{k}Effective-mask.png').convert('RGBA')).astype(int)for k in ['sourceBlack','sourceWhite','closureOnBlack','closureOnWhite']}
 for kind,p in points:
  x,y=p['pixel'];values={k:v[y,x].tolist()for k,v in imgs.items()};valid=all(v[3]==255 for v in values.values());sd=(imgs['sourceWhite'][y,x,:3]-imgs['sourceBlack'][y,x,:3]).tolist();cd=(imgs['closureOnWhite'][y,x,:3]-imgs['closureOnBlack'][y,x,:3]).tolist()
  rows.append({'view':view,'pixel':[x,y],'priorFailure':kind,'rgba':values,'opaqueProbeBackground':valid,'sourceBlackWhiteTransmission':sd,'closureBlackWhiteTransmission':cd,'sourceTransmissionObserved':valid and any(v!=0 for v in sd),'closureCoverageObserved':valid and any(v!=255 for v in cd),'interpretation':'Positive endpoint transmission disproves true opacity. A zero endpoint difference does NOT prove opacity below quantization; no failure waived. Geometry/filter support and exact independent expected remain mandatory.'})
report={'scope':'Targeted black/white opaque-background probes through observed tile and production screen cache; no numeric tolerance or acceptance changes','rows':rows,'accepted':False};(P/'transmission-targets.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
