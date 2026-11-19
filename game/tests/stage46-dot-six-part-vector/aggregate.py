from pathlib import Path
import json,hashlib
P=Path(__file__).parent
proofs=[json.load(open(P/f'proof-{i}.json')) for i in range(6)]
checks={'six_parts':len(proofs)==6,'all_seam_locks':all(all(q['seam_locks'].values()) for q in proofs),'all_clip_exact':all(q['clip_exact'] for q in proofs),'all_physics_exact':all(q['physics_exact'] for q in proofs)}
for q in proofs:
 src=json.load(open(P/'original'/q['name']));dst=json.load(open(P/'candidate'/q['name']));assert src['params']==dst['params']
r={'master':'1e043b09d4ce107e1d2dcf70fe2274dff7098476','scope':'six exterior components, not all deployed chapter assets','checks':checks,'before':{k:sum(q['before'][k] for q in proofs) for k in proofs[0]['before']},'after':{k:sum(q['after'][k] for q in proofs) for k in proofs[0]['after']},'protected_unchanged_source_sha256':{f:hashlib.sha256((P/'original'/f).read_bytes()).hexdigest() for f in ['stage46-protected-clips.json','stage46-tree-completion.json']},'parts':proofs,'accepted':False}
(P/'aggregate-proof.json').write_text(json.dumps(r,indent=2));print(json.dumps({k:v for k,v in r.items() if k!='parts'},indent=2))
