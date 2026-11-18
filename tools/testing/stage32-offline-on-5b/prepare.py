from pathlib import Path
import json,hashlib,shutil
P=Path('stage32-offline-on-5b');base=P/'base';out=P/'production';patches=json.load(open('stage32-integration-9f78-candidate/patch-contract.json'))['changes'];changes=[]
changes.append({'path':'shared/build.mjs','old':"'act4-campaign','act4-pilot-art'",'new':"'act4-campaign','stage32-foundation-art','act4-pilot-art'",'label':'Register only Stage32 helper before consumer'})
changes.append(patches[1]);changes.append({'path':'shared/runtime/act4-pilot-art.js','old':'   if(G.HonroVectorArt?.draw(raw,l.asset,l))return;','new':'   if(b?.honroStage===32&&G.HonroStage32FoundationArt?.draw(raw,l,b,false,{sceneScale:this.scale,nativeLive:this.scale>1.05}))return;\n   if(G.HonroVectorArt?.draw(raw,l.asset,l))return;','label':'Explicit stage32-only dispatch; no3/7/33/34/37/38 hooks'})
changes+=patches[3:]
files={r['path'] for r in changes};proof={}
for f in files:
 s=(base/f).read_text();t=s
 for r in changes:
  if r['path']!=f:continue
  assert t.count(r['old'])==1,(f,r['label']);t=t.replace(r['old'],r['new'])
 inverse=t
 for r in reversed(changes):
  if r['path']==f:assert inverse.count(r['new'])==1;inverse=inverse.replace(r['new'],r['old'])
 assert inverse==s;dest=out/f;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(t);proof[f]={'baseSHA256':hashlib.sha256(s.encode()).hexdigest(),'candidateSHA256':hashlib.sha256(t.encode()).hexdigest(),'inverseExact':True}
for f in ['shared/data/act4/handoff-art/32-foundation.json','shared/data/act4/handoff-art/32-material-protection.json']:
 d=out/f;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(Path('stage32-integration-9f78-candidate/production')/f,d)
d=out/'shared/runtime/stage32-foundation-art.js';shutil.copyfile('stage32-offline-apron-chrome/candidate.js',d);assert hashlib.sha256(d.read_bytes()).hexdigest()=='6823eda0e8d3c5250396c857f09f96ee3eba8fbfba124af540d080a5a76d03c7'
(P/'scope-proof.json').write_text(json.dumps({'base':'5b2edf0b868a6f4ab656574b036586304eb12808','patches':changes,'proof':proof,'rendererUnchangedSHA256':hashlib.sha256((base/'shared/runtime/renderer.js').read_bytes()).hexdigest(),'scope':'Only32 dependencies. Common renderer untouched. Explicit pilot stage guard. Latest5b monster and3/7 original files untouched. Actual build/runtime untested.'},indent=2))
rows=[]
for f in out.rglob('*'):
 if f.is_file():rows.append({'local':str(f),'path':str(f.relative_to(out)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(P/'product-manifest.json').write_text(json.dumps({'parent':'5b2edf0b868a6f4ab656574b036586304eb12808','ready':False,'sourceOnly':True,'productAccepted':False,'files':rows},indent=2));print(len(rows))
