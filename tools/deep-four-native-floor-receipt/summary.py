import json,sys
from pathlib import Path
from dag import sha
p=Path(sys.argv[1]); R=Path(sys.argv[2]); d=Path(__file__).parent
E=json.loads((d/'expected.json').read_text())
es={(q['stage'],q['width'],q['view']):q for q in E['rows']}
o={};issues=[]
for s,n in [(10,21),(4,24),(6,21),(5,18)]:
 source=p/f'deep-four-pictures-{s}';f=source/'actual-paired-receipt.json'
 if not f.is_file():issues.append(f'{s}: no receipt');continue
 q=json.loads(f.read_text())
 if len(q)!=n:issues.append(f'{s}: {len(q)} of {n} poses')
 for a in q:
  k=(a['stage'],a['requestedViewport'][0],a['view'])
  if k in o or k not in es or es[k]['shard']!=s:issues.append(f'{s}: duplicate/wrong pose {k}');continue
  issues.extend(f'{s}: gate not passed {k} {a.get("error","")}'for _ in [0]if not a.get('pass'))
  for root in ('stock','target'):
   for tag in ('raw','dom'):
    fn=source/f'{root}-s{k[0]:02}-{k[1]}-{k[2]}-{tag}.png'
    if not fn.is_file() or sha(fn.read_bytes())!=a.get(root,{}).get('png',{}).get(tag):issues.append(f'{s}: missing/unverifiable {fn.name}')
  o[k]=a
if len(o)!=84:issues.append(f'actual keys: {len(o)}/84')
result={'rows':len(o),'verifiedPositive':sum(bool(es[k]['extra'])and a.get('pass',False) for k,a in o.items()),
 'verifiedRetained':sum('retainedApproved'in es[k] and a.get('pass',False) for k,a in o.items()),
 'verifiedStrictNoChange':sum(not es[k]['extra'] and 'retainedApproved'not in es[k] and a.get('pass',False)for k,a in o.items()),
 'Stage05ActualClosed':sum(k[0]==5 and a.get('pass',False) and a.get('target',{}).get('waterCalls',0)>0 for k,a in o.items()),
 'Stage05GameplayOpened':'not included; no synthetic state counts', 'issues':issues}
assert result['rows']<=84
R.write_text(json.dumps(result,indent=2)+'\n')
assert not issues and (result['verifiedPositive'],result['verifiedRetained'],result['verifiedStrictNoChange'],result['Stage05ActualClosed'])==(12,12,60,18),result
