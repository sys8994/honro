"""Pin launch files to current public Pages before camera-only observation."""
import hashlib,json,os,re,subprocess
from pathlib import Path
from urllib.request import build_opener,HTTPRedirectHandler,Request
HERE=Path(__file__).resolve().parent
OUT=Path(os.environ['STAGE38_PUBLIC'])
P=json.loads((HERE/'PINS.json').read_bytes())
BASE='https://sys8994.github.io/honro/'
LIVE=P['live']['release']
FILES={'.github/workflows/stage38-compact-native.yml',*(f'tools/stage38-compact-native/{n}' for n in ('source.py','capture.py','compare.py','PINS.json'))}
def git(*a):return subprocess.check_output(['git',*a])
def sha(b):return hashlib.sha256(b).hexdigest()
def measured(b):return {'bytes':len(b),'sha256':sha(b)}
def save(n,d):(OUT/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def show(rel):return git('show',LIVE+':'+rel)
def check_body(rel,b,want):
    assert measured(b)==want,(rel,measured(b),want)
    return b
def scope():
    assert git('rev-list','--parents','-n1','HEAD').decode().split()==[os.environ['GITHUB_SHA'],LIVE]
    assert git('rev-parse',LIVE+'^{tree}').decode().strip()==P['live']['tree']
    rows=git('diff','--name-status','--no-renames','-z',LIVE,'HEAD').split(b'\0')
    assert rows.pop()==b'' and len(rows)==2*len(FILES)
    assert set(zip(rows[::2],rows[1::2]))=={(b'A',path.encode()) for path in FILES}
    assert git('status','--porcelain=v1','-z')==b''
    assert git('rev-parse',LIVE+':web/manifest.json').decode().strip()==P['live']['retainedManifestGitBlob']
class DirectOnly(HTTPRedirectHandler):
    def redirect_request(self,*a,**kw): raise RuntimeError('Unexpected redirect from previously pinned Pages pathname')
def source():
    scope()
    shell=check_body('HONRO.html',show('HONRO.html'),P['html'])
    manifest=check_body('web/manifest.json',show('web/manifest.json'),P['manifest'])
    url=BASE+'web/manifest.json'
    with build_opener(DirectOnly).open(Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=30) as r:
        assert (r.status,r.geturl())==(200,url)
        live=check_body('actual Pages manifest',r.read(P['manifest']['bytes']+1),P['manifest'])
    m=json.loads(live);active={f['path']:{'bytes':f['bytes'],'sha256':f['sha256']}for f in m['files']}
    roles=P['roles'];rt=P['runtime'];paths=P['needed']
    assert m['gameEntry']==roles['entry'] and m['project']==roles['campaign']
    assert all(active[rel]==v for rel,v in paths.items())
    data={rel:check_body(rel,show(rel),v) for rel,v in paths.items()}
    entry=data[roles['entry']]
    assert roles['entry'].encode() in shell and roles['campaign'].encode() in entry and roles['campaign'].encode() in data[roles['loader']]
    assert all(('../runtime/'+rt[n].split('/')[-1]).encode() in entry for n in rt if n!='monsterData')
    assert rt['monsterData'].encode() in data[rt['monsterDataLoader']]
    assert b'drawBody' in data[rt['monsterVector']] and b'unitBody' in data[rt['baseRenderer']]
    assert b'HonroAct4TerrainPreview' in data[rt['act4Runtime']] and b'HonroAct4PilotArt' in data[rt['act4Presentation']]
    c=json.loads(data[roles['campaign']]);assert c['stages'][37]==roles['stageMap'] and c['stageLibraries'][37]==roles['descriptor']
    m=json.loads(data[roles['stageMap']]);assert m['metadata']['stageId']==38
    assert all(any(a['id']==r['id'] and a['kind']==r['kind'] and abs(a['x']-r['sourceX'])<1e-6 and abs(a['y']-r['sourceY'])<1e-6 for a in m['units'])
               for r in P['coverage']['actors'].values())
    aggregate(data)
    prepare(data[rt['monsterVector']])
    save('public-source.json',{'release':P['live'],'scope':'Verified anonymous current manifest and exact source closure. Browser HTTP bytes checked separately.','manifestHTTP':{'path':'web/manifest.json','status':200,**P['manifest']},'roles':roles,'runtime':rt})
def aggregate(data):
    d=json.loads(data[P['roles']['descriptor']]); assert d['$honroJsonParts']==1 and len(d['parts'])==2
    assert {p['path']for p in d['parts']}=={r for r in P['needed'] if 'chapter-38-assets-part-' in r}
    b=[]
    for r in d['parts']:b.append(check_body(r['path'],data[r['path']],{k:r[k]for k in ('bytes','sha256')}))
    want={k:d[k] for k in ('bytes','sha256')};check_body('ordered chapter38 aggregate',b''.join(b),want)
    return want

OWNER=P['runtime']['monsterVector']
ORIGINAL_GIT='254a8ea0ccfe60ce49e431959b144cc6217231e0'
PREFIX=b'S.render=function(engine,...args){this.actorEngine=engine;return render.call(this,engine,...args)};'
SLOT=b'visual.draw(c,id,{time:this.time||0,state:actor?state(u,this.actorEngine):visual.state(u),pixels:pixels});'
def prepare(owner):
    check_body(OWNER,owner,P['needed'][OWNER])
    assert hashlib.sha1(f'blob {len(owner)}\0'.encode()+owner).hexdigest()==ORIGINAL_GIT
    assert owner.count(PREFIX)==owner.count(SLOT)==1 and owner.count(b'__qaStage38CompactPaint')==0
    lo=owner.index(PREFIX)+len(PREFIX)
    assert owner[lo:].startswith(b'S.unitBody=function(c,u,charge=0){')
    hi=owner.index(SLOT,lo)
    assert 0<hi-lo<800
    cfg=P['probe']['localApproved']
    assert sha((json.dumps(cfg['paths'],indent=2)+'\n').encode())==cfg['rawSHA256']
    edit=json.dumps(cfg['paths'],separators=(',',':'),ensure_ascii=True)
    schema=json.dumps({'baseHeight':cfg['originalBaseHeight'],'parts':cfg['originalParts'],'palette':cfg['originalPalette']},separators=(',',':'),ensure_ascii=True)
    preload=('const stage38CompactPaths='+edit+',stage38StockRig='+schema+';').encode()+b"""const stage38Private=new WeakMap;
const stage38Paper=(scene,c,u,actor,id,a,opts)=>{
 if(actor||id!=='pursuer'||u.id!=='a4-38-e-1'||u.facing!==-1)return false;
 const e=scene.actorEngine,b=e?.b;
 if(!b||!b.honroCanonical||b.honroCustom!==false||b.honroStage!==38||b.phase!=='aim'||b.round!==1)return false;
 const real=e.unit(u.id);
 if(!real||real.dead||real.hp<=0||real.side!==1||real.honroType!=='warden'||
    real.honroEncounterSupport!=='approved38-upper'||real.honroAct4WaterTrait!=='ground'||
    real.x!==4530||Math.abs(real.y-1751.4)>1e-8||u.x!==real.x||u.y!==real.y||
    real.airborne||real.honroFlying||real.flying||real.jumping||Math.abs(real.vx||0)>1e-8||Math.abs(real.vy||0)>1e-8||
    Math.abs(real.moving||0)>1e-8||real.eaterCapturedBy||real.honroMonsterState?.attachedTo||
    opts.state.move||opts.state.attack!==undefined||opts.state.hit!==undefined||opts.state.jump!==undefined)return false;
 const hit=e.contactSurface(real.x,real.y-8,real.y+10);
 if(hit?.t?.id!=='approved38-upper'||!Number.isFinite(hit.y)||Math.abs(hit.y-real.y)>1e-8)return false;
 let revised=stage38Private.get(a);
 if(!revised){
  const req=(a,b)=>{if(!Object.is(a,b))throw Error('Stage38 compact stock rig parity');};
  req(a.baseHeight,stage38StockRig.baseHeight);
  for(const k of Object.keys(stage38StockRig.palette))req(a.palette[k],stage38StockRig.palette[k]);
  req(Object.keys(a.palette).length,Object.keys(stage38StockRig.palette).length);
  req(a.parts.length,stage38StockRig.parts.length);
  const parts=a.parts.map((p,i)=>{
   const old=stage38StockRig.parts[i],news=stage38CompactPaths[p.id];
   req(p.id,old.id);req(p.parent??null,old.parent??null);
   req(JSON.stringify(p.pivot),JSON.stringify(old.pivot));req(p.paths.length,old.paths.length);
   const paths=p.paths.map((v,n)=>{
    const prev=old.paths[n],proposed=news?.[n];
    for(const k of ['d','fill','stroke','width','lod'])req(v[k],prev[k]);
    if(!proposed)return v;
    for(const k of ['fill','stroke','width','lod'])req(v[k],proposed[k]);
    return {...v,d:proposed.d};
   });
   if(news)req(paths.length,news.length);
   return news?{...p,paths}:p;
  });
  revised=G.HonroVectorParts.create({pursuer:{...a,parts}});
  stage38Private.set(a,revised);
 }
 revised.draw(c,'pursuer',opts);
 const m=c.getTransform();
 const q=G.__qaStage38CompactPaint??=( {count:0,last:null} );
 q.count++;q.last={id:real.id,x:real.x,y:real.y,support:hit.t.id,phase:b.phase,round:b.round,
   worldHeight:real.h,drawHeight:u.h,baseHeight:a.baseHeight,pixels:opts.pixels,transform:[m.a,m.b,m.c,m.d,m.e,m.f]};
 return true;
};"""
    replacement=b'{const options={time:this.time||0,state:actor?state(u,this.actorEngine):visual.state(u),pixels:pixels};if(!stage38Paper(this,c,u,actor,id,a,options))visual.draw(c,id,options);}'
    assert owner.count(preload)==0 and owner.count(replacement)==0
    patched=owner[:lo]+preload+owner[lo:hi]+replacement+owner[hi+len(SLOT):]
    assert patched.count(preload)==patched.count(replacement)==1
    assert patched.replace(preload,b'',1).replace(replacement,SLOT,1)==owner
    (OUT/'stage38-candidate.js').write_bytes(patched)
    save('owner-receipt.json',{'originalGit':ORIGINAL_GIT,'original':measured(owner),'injected':measured(patched),
      'singleOwnerBOnly':True,'inverseExact':True,'existingNativePainter':True,'sourceSlot':'actor-vector unitBody call after transform'})
    return patched
if __name__=='__main__':source()
