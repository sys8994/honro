import json,sys
from pathlib import Path
r=Path(sys.argv[1]);a=json.loads((r/'baseline-left-tile-abba-0.json').read_text());b=json.loads((r/'candidate-left-tile-abba-1.json').read_text());checks={}
for k in ['physicsSHA','stage32SourceClipSHA','stage32PathCount']:checks['contract.'+k]=a.get('contract',{}).get(k)==b.get('contract',{}).get(k)
for k in ['physicsSHA','unitsSHA']:checks['initialized.'+k]=a.get('initialization',{}).get(k)==b.get('initialization',{}).get(k)
diff=[]
def walk(x,y,p='battle'):
 if x==y:return
 if isinstance(x,dict)and isinstance(y,dict):
  for k in x.keys()|y.keys():walk(x.get(k),y.get(k),p+'.'+k)
 else:diff.append({'path':p,'before':x,'after':y})
walk(a.get('initialization',{}).get('gameplayPayload'),b.get('initialization',{}).get('gameplayPayload'))
checks['camera']=a.get('camera')==b.get('camera');out={'passed':bool(a.get('ok')and b.get('ok')and all(checks.values())),'checks':checks,'gameplayDiff':diff,'baseline':{'contract':a.get('contract'),'initialization':a.get('initialization')},'candidate':{'contract':b.get('contract'),'initialization':b.get('initialization')},'scope':'First2of16 reused as compiled same-map gate; disagreement stops remaining14 rather than normalizing battle'};(r/'early-battle-preflight.json').write_text(json.dumps(out,indent=2));assert out['passed'],'Compiled32 mismatch: stop before remaining14, inspect payload/provenance'
