from pathlib import Path
import hashlib,json,difflib,subprocess
P=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest();files=['shared/build.mjs','shared/map/compiler.js','shared/engine/src/monsterPatterns.ts','shared/runtime/monster-scale.js','shared/runtime/monster-scale-art.js'];report=[]
for name in files:
 master=(P/'master'/name).read_bytes();original=(P/'B'/name).read_bytes() if (P/'B'/name).exists() else None
 if name=='shared/build.mjs':
  base=(P/'base'/name).read_text();b=original.decode();m=master.decode();s=b
  substitutions=[("'monster-diversity');","'monster-diversity','monster-scale');"),("'monster-vector','actor-vector'","'monster-vector','monster-scale-art','actor-vector'")]
  for old,new in substitutions:
   assert base.count(old)==b.count(old)==1 and m.count(new)==1;s=s.replace(old,new,1)
  restored=s
  for old,new in reversed(substitutions):restored=restored.replace(new,old,1)
  assert restored.encode()==original
  masterInverse=m
  for old,new in reversed(substitutions):masterInverse=masterInverse.replace(new,old,1)
  assert masterInverse==base,'Master diff includes unaccounted edit'
  merged=s.encode();(P/'build-on-B.patch').write_text(''.join(difflib.unified_diff(b.splitlines(True),s.splitlines(True),fromfile='a/'+name,tofile='b/'+name)))
  detail='Two token insertions only. Same modelFiles line intersects B early-encounter-placement; retain that entry, append monster-scale after monster-diversity. Preserve B Naru/stage32 registrations. Exact inverse==B and master inverse==7d.'
 elif original is not None:
  assert original==(P/'base'/name).read_bytes();merged=master;detail='B==7d; exact latest master source copied, no conflict.'
 else:merged=master;detail='New file copied byte-exact from latest master; inverse is deletion.'
 out=P/'merged'/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(merged)
 report.append({'path':name,'baseB_SHA256':sha(original) if original else None,'master_SHA256':sha(master),'merged_SHA256':sha(merged),'inverseExact':True,'detail':detail})
(P/'scope-proof.json').write_text(json.dumps({'base':'7d238d20663c3ceffe430eb0304e01516ae625cf','B':'fdac97818c09536f5d0057181d04fbd60d48df18','master':'5b2edf0b868a6f4ab656574b036586304eb12808','productionFiles':report,'generatedFilesIncluded':False},indent=2))
manifest=[]
for name in files:
 f=P/'merged'/name;b=f.read_bytes();manifest.append({'local':str(f),'path':name,'bytes':len(b),'sha256':sha(b)})
(P/'product-manifest.json').write_text(json.dumps({'ready':False,'base':'fdac97818c09536f5d0057181d04fbd60d48df18','preserveLatestMaster':'5b2edf0b868a6f4ab656574b036586304eb12808','files':manifest},indent=2));print(json.dumps(report,indent=2))
