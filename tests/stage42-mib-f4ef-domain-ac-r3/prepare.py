from pathlib import Path
from copy import deepcopy
import sys,os,json,subprocess,hashlib
def scope_edge(src):
    anchor='const readability=S.terrainReadability;'
    assert src.count(anchor)==1
    helper='''const stage42LowerClosures=Object.freeze([
 [[8300,934],[8300,1900]],[[8300,1900],[-1800,1900]],[[-1800,1900],[-1800,1565]]
]);
function stage42OwnedBuriedLowerClosure(b){
 if(b.honroStage!==42||b.honroCustom||!b.honroCanonical||!G.HonroTerrainDomain.active(b))return false;
 const d=b.honroTerrainBounds;
 if(d.left!==-4000||d.top!==-9450||d.right!==10500||d.bottom!==10720)return false;
 const found=(b.honroLandmarks||[]).filter(l=>l.id==='qa-stage42-diagnostic-0'&&l.asset?.id==='qa-stage42-f4ef-continuous-base-v2');
 if(found.length!==1)return false;
 const l=found[0],m=l.asset.params?.stage42BuriedLowerClosure;
 if(l.kind!=='canonical-element'||l.layer!=='mid'||l.x!==0||l.y!==0||l.scale!==1||l.rotation!==0||l.collisionIds?.length||l.asset.collision?.length||!l.asset.vector||
    m?.version!==1||m.terrainId!=='LOWER_ROOT')return false;
 const owner=G.HonroTerrainDomain.render(b).find(t=>t.id==='LOWER_ROOT'&&!t.broken&&!t.oneWay);
 const vertices=owner?.vertices;if(!vertices)return false;
 const equals=(p,q)=>Math.abs(p.x-q[0])<1e-6&&Math.abs(p.y-q[1])<1e-6;
 return stage42LowerClosures.every(([p,q])=>vertices.some((a,i)=>{
   const z=vertices[(i+1)%vertices.length];return equals(a,p)&&equals(z,q)||equals(z,p)&&equals(a,q);
 }));
}
function stage42OntoLowerClosure(p,z){
 return stage42LowerClosures.some(([a,h])=>{
  const constant=a[0]===h[0],d=constant?'x':'y',v=constant?'y':'x',i=constant?0:1,k=1-i,
   min=Math.min(a[k],h[k])-1e-6,max=Math.max(a[k],h[k])+1e-6;
  return Math.abs(p[d]-a[i])<1e-6&&Math.abs(z[d]-a[i])<1e-6&&
   p[v]>=min&&p[v]<=max&&z[v]>=min&&z[v]<=max;
 });
}
'''
    src=src.replace(anchor,helper+anchor)
    declaration=' const q=G.HonroTerrainReadability.prepare(b),saved=[],removed=[],keptWalkable=[];'
    assert src.count(declaration)==1
    src=src.replace(declaration,declaration+'\n const ownsLower=stage42OwnedBuriedLowerClosure(b);')
    guard="close=!v.walkable&&((b.honroStage===46"
    assert src.count(guard)==1
    return src.replace(guard,"close=!v.walkable&&((ownsLower&&group.id==='LOWER_ROOT'&&stage42OntoLowerClosure(p,z))||(b.honroStage===46")
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
assert sha(rawC)=='82d0e146f08276d8d63397290ad55756202079db6d23d5c9e29d22a6134d5392'
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
edge=root/'shared/runtime/act5-edge-art.js'
edge_source=edge.read_bytes()
assert sha(edge_source)=='17aaa240c184a2787057c1bf516fa3f0fdbd1f445e4d0a160979e8deec2abb87'
edge.write_text(scope_edge(edge_source.decode()))
assert sha(edge.read_bytes())=='21ac6c066755de24c9f965bb4c0a2f5828f25a3dfc5bdab798f93d89db0069d3'
assert git('diff','--name-only').splitlines()==['shared/act5-world.mjs','shared/runtime/act5-edge-art.js']
assert git('ls-files','--others','--exclude-standard')=='shared/data/act5/stage42-domain.qa.json'
