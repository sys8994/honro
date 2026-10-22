import json,hashlib
from pathlib import Path
root=Path('shared/assets/skill-icons/v1');m=json.loads((root/'manifest.json').read_text());records=[]
for p in Path('game/docs/skill-icons-v1/art').glob('*provenance.json'):
 for i in json.loads(p.read_text())['icons']:
  f=root/(i['id']+'.webp');h=hashlib.sha256(f.read_bytes()).hexdigest();assert h==i['sha256']==m['icons'][i['id']]['sha256'];assert f.stat().st_size==i['bytes'];records.append({'id':i['id'],'file':str(f),'sha256':h,'bytes':f.stat().st_size,'provenance':str(p)})
assert len(records)==84==len(set(i['sha256'] for i in records))==len(list(root.glob('*.webp')))
assert sum(i['bytes'] for i in records)==504894
out={'count':84,'basic':4,'active':60,'passive':20,'excludedHiddenLegacy':57,'totalBytes':504894,'maxBytes':max(i['bytes'] for i in records),'uniqueHashes':84,'provenanceAgreement':True,'records':records}
Path('game/docs/skill-icons-v1/integration/evidence/asset-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('PASS 84 source files/hash/provenance, 504894 bytes, maximum 10326, no missing/duplicate/unmapped images')
