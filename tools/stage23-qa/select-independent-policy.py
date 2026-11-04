"""Choose a declared legal controller policy, before any product probe runs."""
import json
from pathlib import Path
root=Path('_local/reports/stage23-independent-probes')
rows=[]
for name,flag in [('original',0),('muzzle-20',1)]:
    p=root/name/'result.json'
    r=json.loads(p.read_text()) if p.exists() else {}
    f=json.loads((p.parent/'final.json').read_text()) if (p.parent/'final.json').exists() else {}
    aa=f.get('actions',[]);shots=sum(a['op']=='fire' for a in aa);defends=sum(a['op']=='defend' for a in aa)
    rows.append({'variant':name,'muzzleAdvance':flag,'phase':r.get('phase'),'round':r.get('round'),'shots':shots,'defends':defends,'policy':r.get('provenance',{}).get('muzzleAdvance'),'scoring':r.get('provenance',{}).get('s04Scoring')})
won=[r for r in rows if r['phase']=='won']
assert won,'Neither fair original-product policy won; do not weaken product to fit a broken controller'
selected=min(won,key=lambda r:(r['round'],r['shots'],r['defends'],r['muzzleAdvance']))
out={'selected':selected,'originalProductPolicies':rows,'rule':'Before product results: choose a winning original-product policy by fewer rounds, then fewer shots, then fewer defends, finally no extra movement. Both use the predeclared independent estimate and original production S04 scoring. This selects a legal tactical policy, not a seed or product candidate.'}
(root/'policy-selection.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
(root/'selected-muzzle.txt').write_text(str(selected['muzzleAdvance'])+'\n')
print(json.dumps(out,ensure_ascii=False))
