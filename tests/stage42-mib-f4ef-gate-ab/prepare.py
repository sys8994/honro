from pathlib import Path
from copy import deepcopy
import sys,os,json,subprocess,hashlib
p=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve(strict=True); arm=sys.argv[2];assert arm in ('A','B')
temp=Path(os.environ['RUNNER_TEMP']).resolve(strict=True)
assert root==temp/('stage42-gate-'+arm)
assert root!=Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
baseline=(p/'official-qa-stage.json').read_bytes()
old=(p/'old-packet.json').read_bytes(); new=(p/'gate-packet.json').read_bytes(); gate=(p/'qa-f4ef-extinguished-gate.json').read_bytes()
assert sha(baseline)=='f4ef8f67dd560bffe675b3536c3ece1904b4a354d1fb555145732e2000ab4afe'
assert sha(old)=='19abad97ea6c554d1cb7530def1a70c6fe1a432a2ea45e08d6ef162372eb1d8f'
assert sha(new)=='550c4ea1f9bbdc94a6d4947fb72057b5e4bbae7ed1481a18d9b8c9a78d19abbd'
assert sha(gate)=='8038637f2efb5528c01ebd04c003d3bdac28fb2c3f76d579451d88bed7b7cfc5'
A,B,asset=(json.loads(s) for s in (old,new,gate))
assert {**A['stage'],'elements':[]}==json.loads(baseline)
assert {**B['stage'],'elements':A['stage']['elements']}==A['stage'] and B['stage']['elements'][:-1]==A['stage']['elements']
assert B['assets'][:-1]==A['assets'] and B['assets'][-1]==asset and not asset['collision'] and not asset.get('interactionType')
assert B['stage']['elements'][-1]=={'id':'qa-stage42-gate-native','assetId':asset['id'],'layer':'structural-back','x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','visualRole':'decoration'}
q=A if arm=='A' else B
m=json.loads((p/'manifest.json').read_bytes())
def git(*a):return subprocess.check_output(['git','-C',str(root),*a],text=True).strip()
assert git('rev-parse','HEAD')==m['pin'] and git('rev-parse','--show-toplevel')==str(root)
assert subprocess.run(['git','-C',str(root),'symbolic-ref','-q','HEAD'],capture_output=True).returncode==1
assert not git('status','--porcelain','--untracked-files=all')
for k,v in m['stockSha256'].items():assert sha((root/k).read_bytes())==v,k
owned=root/'shared/act5-world.mjs'
packed=root/'shared/data/act5/stage42-gate.qa.json';assert not packed.exists()
src=owned.read_text()
before=' return {name,library,stages,content};'
after=""" const QA42=JSON.parse(await readFile(new URL('./data/act5/stage42-gate.qa.json',import.meta.url),'utf8'));
 const qi=stages.findIndex(s=>s.metadata.stageId===42);
 if(qi<0||QA42.stage.id!==stages[qi].id||QA42.stage.width!==stages[qi].width||QA42.stage.metadata.stageId!==42)throw Error('Isolated Stage 42 visual source seam');
 if(QA42.assets.some(a=>!a.vector||a.collision.length||library.some(l=>l.id===a.id))||QA42.stage.elements.some(e=>!QA42.assets.some(a=>a.id===e.assetId)))throw Error('Invalid QA asset');
 stages[qi]=QA42.stage;
 const ci=content.findIndex(s=>s.id===42);if(ci<0)throw Error('Missing official Stage 42 catalog entry');
 content[ci]={...content[ci],h:QA42.stage.height};
 return {name,library:[...library,...QA42.assets],stages,content};"""
assert src.count(before)==1
owned.write_text(src.replace(before,after));packed.write_text(json.dumps(q,separators=(',',':'))+'\n')
assert git('diff','--name-only')=='shared/act5-world.mjs'
assert git('ls-files','--others','--exclude-standard')=='shared/data/act5/stage42-gate.qa.json'
