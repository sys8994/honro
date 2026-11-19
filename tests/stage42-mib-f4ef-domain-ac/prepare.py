from pathlib import Path
from copy import deepcopy
import sys,os,json,subprocess,hashlib
p=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve(strict=True); arm=sys.argv[2];assert arm in ('A','C')
temp=Path(os.environ['RUNNER_TEMP']).resolve(strict=True)
assert root==temp/('stage42-domain-'+arm)
assert root!=Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
baseline=(p/'official-qa-stage.json').read_bytes()
rawA=(p/'old-packet.json').read_bytes();rawC=(p/'new-packet.json').read_bytes()
assert sha(baseline)=='f4ef8f67dd560bffe675b3536c3ece1904b4a354d1fb555145732e2000ab4afe'
assert sha(rawA)=='19abad97ea6c554d1cb7530def1a70c6fe1a432a2ea45e08d6ef162372eb1d8f'
assert sha(rawC)=='94e6d16ae01c9cebf7a18a3208ced881ee16cde277e4a6e491a2a0c9aea51b62'
A,C=(json.loads(b) for b in (rawA,rawC))
accepted=json.loads(baseline)
assert {**A['stage'],'elements':[]}==accepted and not accepted['elements']
assert C['stage']['terrainBounds']=={'left':-4000,'top':-9450,'right':10500,'bottom':10720}
assert {**C['stage'],'elements':A['stage']['elements'],'terrainBounds':A['stage']['terrainBounds']}==A['stage']
a,c=A['stage']['elements'],C['stage']['elements'];assert len(a)==len(c)==3
assert a[1:]==c[1:] and {**c[0],'assetId':a[0]['assetId']}==a[0]
assert len(A['assets'])==len(C['assets'])==3 and A['assets'][1:]==C['assets'][1:]
assert A['assets'][0]['id']==a[0]['assetId'] and C['assets'][0]['id']==c[0]['assetId']
assert all(len(x['collision'])==0 and not x.get('interactionType') for q in (A,C) for x in q['assets'])
q=A if arm=='A' else C
m=json.loads((p/'manifest.json').read_bytes())
def git(*a):return subprocess.check_output(['git','-C',str(root),*a],text=True).strip()
assert git('rev-parse','HEAD')==m['pin'] and git('rev-parse','--show-toplevel')==str(root)
assert subprocess.run(['git','-C',str(root),'symbolic-ref','-q','HEAD'],capture_output=True).returncode==1
assert not git('status','--porcelain','--untracked-files=all')
for k,v in m['stockSha256'].items():assert sha((root/k).read_bytes())==v,k
owned=root/'shared/act5-world.mjs'
packed=root/'shared/data/act5/stage42-domain.qa.json';assert not packed.exists()
src=owned.read_text()
before=' return {name,library,stages,content};'
after=""" const QA42=JSON.parse(await readFile(new URL('./data/act5/stage42-domain.qa.json',import.meta.url),'utf8'));
 const qi=stages.findIndex(s=>s.metadata.stageId===42);
 if(qi<0||QA42.stage.id!==stages[qi].id||QA42.stage.width!==stages[qi].width||QA42.stage.metadata.stageId!==42)throw Error('Isolated Stage 42 domain source seam');
 if(QA42.assets.some(a=>!a.vector||a.collision.length||library.some(l=>l.id===a.id))||QA42.stage.elements.some(e=>!QA42.assets.some(a=>a.id===e.assetId)))throw Error('Invalid QA asset');
 stages[qi]=QA42.stage;
 const ci=content.findIndex(s=>s.id===42);if(ci<0)throw Error('Missing official Stage 42 catalog entry');
 content[ci]={...content[ci],h:QA42.stage.height};
 return {name,library:[...library,...QA42.assets],stages,content};"""
assert src.count(before)==1
owned.write_text(src.replace(before,after));packed.write_text(json.dumps(q,separators=(',',':'))+'\n')
assert git('diff','--name-only')=='shared/act5-world.mjs'
assert git('ls-files','--others','--exclude-standard')=='shared/data/act5/stage42-domain.qa.json'
