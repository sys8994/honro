"""Disabled, source-bound, anonymous normal Pages PC/M Stage33 inspection."""
import base64,datetime as dt,hashlib,io,json,os,re,subprocess,sys,time,zipfile
from pathlib import Path
from urllib.request import HTTPRedirectHandler,Request,build_opener
H=Path(__file__).resolve().parent
def obj(b):
 def distinct(x):
  o=dict(x);assert len(o)==len(x),'duplicate JSON key';return o
 return json.loads(b,object_pairs_hook=distinct)
P=obj((H/'PINS.json').read_bytes()); R=P['release']; BASE=P['base']; ORIGIN=P['origin']; TOP=P['repo']; REF='refs/heads/'+P['branch']
MF='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
LO='act4-sideview:33:coastal-v2:lowland'; DE='act4-sideview:33:coastal-v2:lowland-deep-strata'
FILES={'.github/workflows/stage33-r3-2c4-public.yml',*(f'tools/stage33-r3-2c4-public/{k}'for k in ('PINS.json','proof.py','park.js'))}
PHYSICS='9cd682370b682d68ae2c8dc3ec586bb911088770c581b6ecb93a510535bc9279'
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[0-9a-f-]{36}')
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
OUT=None
PROOF={'status':'INIT','scope':'Current real anonymous Pages Stage33 parked camera smoke; no new gameplay/phase test, no deployment','visits':[],'frames':{}}
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def sha(b):return fact(b)['sha256']
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def hx(x,n):return isinstance(x,str)and bool(re.fullmatch(f'[0-9a-f]{{{n}}}',x)) and bool(int(x,16))
def wants(x):return {k:x[k] for k in ('bytes','sha256')}
def canon(o):return json.dumps(o,sort_keys=True,separators=(',',':')).encode()
def save(p,v):(OUT/p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
def emit():save('PUBLIC-BROWSER.json',PROOF)
def git(*v):return subprocess.check_output(['git',*v],timeout=45)
def tg(*v):return git(*v).decode().strip()
def read(c,k):return git('show',c+':'+k)
def api(path):return obj(subprocess.check_output(['gh','api','repos/'+TOP+'/'+path],timeout=40))
def inv(rows):
 v={}
 for f in rows:
  k=f['path'];q=wants(f)
  assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)and (k not in v or v[k]==q)
  v[k]=q
 return v
def allr(m):return inv([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*[x for g in m['publishedGenerations']for x in g['files']]])
def normalize(b):
 for a,c in P['aliases'].items():b=b.replace(c.encode(),a.encode()).replace(Path(c).name.encode(),Path(a).name.encode())
 return b
def bound():
 assert P['enabled'] is True,'DISABLED: require exact product and completed Pages pins'
 assert all(hx(R[k],40)for k in ('commit','tree','producerHead'))
 assert hx(R['manifest']['git'],40)and hx(R['manifest']['sha256'],64)and 0<R['manifest']['bytes']<(12<<20)
 assert hx(R['producerReceiptSHA256'],64)
 z=R['producerArtifact'];assert hx(z['sha256'],64)and all(type(v)is int and v>0 for v in (z['id'],z['bytes'],R['pagesRun'],R['pagesJob'],R['producerRun'],R['producerJob']))
 assert dt.datetime.fromisoformat(R['publishedAt']).tzinfo is not None
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push',REF)
def established():
 bound(); l=R['commit'];q=os.environ['GITHUB_SHA']
 assert tg('rev-parse','HEAD')==q and not git('status','--porcelain','-z')
 assert tg('rev-list','--parents','-1',q).split()==[q,l]
 assert tg('rev-list','--parents','-1',l).split()==[l,BASE]
 assert tg('rev-parse',BASE+'^{tree}')==P['baseTree'] and tg('rev-parse',l+'^{tree}')==R['tree']
 assert set(tg('diff','--name-status','--no-renames',l,q).splitlines())=={'A\t'+k for k in FILES}
 paths=P['aliases'];src=P['source'];mods=SHELL|{MF,src['path']}
 assert set(tg('diff','--name-status','--no-renames',BASE,l).splitlines())=={'M\t'+k for k in mods}|{'A\t'+k for k in paths.values()}
 assert all(git('ls-tree',l,'--',k).split()[:2]==[b'100644',b'blob']for k in mods|set(paths.values()))
 raw,old=[read(c,MF)for c in (l,BASE)]
 assert fact(raw)==wants(R['manifest']) and blob(raw)==R['manifest']['git'] and fact(old)==P['normalManifestA']
 a,b=map(obj,(old,raw));i,j=inv(a['files']),inv(b['files']);oa,ob=allr(a),allr(b)
 assert len(i)==len(j)==810 and len(oa)==1329 and len(ob)==1336 and all(ob[k]==v for k,v in oa.items())
 assert set(ob)-set(oa)==set(j)-set(i)==set(paths.values()) and set(i)-set(j)==set(paths)
 assert sha(canon(j))==P['originalActiveCommonFactsDigest']and all(i[k]==j[k]for k in i.keys()&j.keys())
 y=read(l,src['path']);assert blob(y)==src['new'] and fact(y)==wants(src)
 assert blob(read(BASE,src['path']))==src['old']
 for k,v in P['aliasFacts'].items():assert fact(read(l,k))==j[k]==v
 for k,v in {**P['oldGETs'],**P['protectedPeerHTTP']}.items():assert fact(read(l,k))==fact(read(BASE,k))==v
 sh={k:fact(read(l,k))for k in SHELL};assert sh['HONRO.html']==sh['index.html']==P['normalShellB']
 assert all(normalize(read(l,k))==read(BASE,k)for k in SHELL)
 hist=[x for x in b['publishedGenerations']if x['sourceSha']==BASE]
 assert len(hist)==1 and hist[0]['files']==a['files'] and hist[0]['publishedAt']==P['pages']['at']
 assert hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{P['pages']['run']}"
 return {**j,**sh,MF:wants(R['manifest'])}
def authority():
 established(); l=R['commit']; assert api('git/ref/heads/master')['object']['sha']==l
 run=api(f"actions/runs/{R['pagesRun']}")
 assert (run['id'],run['head_sha'],run['head_branch'],run['name'],run['status'],run['conclusion'])==(R['pagesRun'],l,'master','pages build and deployment','completed','success')
 assert run['repository']['full_name']==run['head_repository']['full_name']==TOP
 job=next(x for x in api(f"actions/runs/{R['pagesRun']}/jobs")['jobs']if x['id']==R['pagesJob'])
 assert job['name']=='deploy' and job['conclusion']=='success' and job['head_sha']==l
 s=next(x for x in job['steps'] if x['name']=='Deploy to GitHub Pages')
 assert s['conclusion']=='success'
 stamp=dt.datetime.fromisoformat(R['publishedAt'])
 assert dt.datetime.fromisoformat(s['started_at'])<=stamp<=dt.datetime.fromisoformat(job['completed_at'])+dt.timedelta(seconds=1)
 n=api(f"actions/runs/{R['producerRun']}")
 assert (n['head_sha'],n['head_branch'],n['path'],n['conclusion'])==(R['producerHead'],'qa/stage33-r3-2c4-release-payload','.github/workflows/stage33-r3-2c4-release-payload.yml','success')
 j=next(x for x in api(f"actions/runs/{R['producerRun']}/jobs")['jobs']if x['id']==R['producerJob'])
 assert j['name']=='read-only-producer' and j['conclusion']=='success'
 k=R['producerArtifact'];o=next(x for x in api(f"actions/runs/{R['producerRun']}/artifacts")['artifacts']if x['id']==k['id'])
 assert (o['name'],o['size_in_bytes'],o['digest'],o['expired'])==('honro-stage33-r3-exact-retained-payload-review-only',k['bytes'],'sha256:'+k['sha256'],False)
 assert o['workflow_run']['head_sha']==R['producerHead'] and o['workflow_run']['id']==R['producerRun']
 payload=subprocess.check_output(['gh','api',f"repos/{TOP}/actions/artifacts/{k['id']}/zip"],timeout=100)
 assert fact(payload)==wants(k)
 with zipfile.ZipFile(io.BytesIO(payload))as z:
  assert len(set(z.namelist()))==len(z.namelist()) and sum(f.file_size for f in z.infolist())<(30<<20)and z.testzip() is None
  rb=z.read('RETAINED-DELTA-RECEIPT.json')
 assert sha(rb)==R['producerReceiptSHA256']
 rec=obj(rb)
 assert rec['tree']==R['tree'] and rec['base']==BASE and rec['published'] is False and rec['authority']==P['normalArtifact']
 assert wants(rec['files'][MF])==wants(R['manifest']) and rec['files'][MF]['git']==R['manifest']['git']
 assert len(rec['files'])==12 and rec['retainedPhysical']==1336
 save('PAGES-AUTHORITY.json',{'status':'EXACT_MASTER_PAGES','release':R,'anonymousBrowserNext':True})
class BlockRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('unexpected public redirect')
def get(p,expected):
 u=ORIGIN+p;q=Request(u,headers={'Accept-Encoding':'identity'})
 with build_opener(BlockRedirect).open(q,timeout=25)as r:
  assert r.status==200 and r.geturl()==u
  b=r.read(expected['bytes']+1);assert fact(b)==expected,(p,fact(b),expected)
  return b
def http(pins):
 e=obj((OUT/'PAGES-AUTHORITY.json').read_bytes())
 assert e=={'status':'EXACT_MASTER_PAGES','release':R,'anonymousBrowserNext':True}
 known={MF:pins[MF],**{k:pins[k]for k in SHELL},**P['aliasFacts'],**P['oldGETs'],**P['protectedPeerHTTP']}
 raw={};seen={}
 for k,v in known.items():
  raw[k]=get(k,v);seen[k]=fact(raw[k])
 home=get('',pins['index.html']);seen['root/']=fact(home)
 c=obj(raw[P['aliases']['web/data/campaign.7140da5d3649e4ab.json']])
 w=P['wire'];mp,ap=c['stages'][32],c['stageLibraries'][32]
 assert len(c['stages'])==len(c['stageLibraries'])==50 and fact(raw[mp])==w['maps'][1] and fact(raw[ap])==w['packets'][1]
 assert obj(raw[mp])['metadata']['stageId']==33 and w['onlyExtraMapElement']in obj(raw[mp])['elements']
 assert len(obj(raw[ap]))==16 and sum(x['id']==DE for x in obj(raw[ap]))==1
 save('PUBLIC-HTTP.json',{'status':'EXACT_ACTIVE_AND_RETAINED_STAGE33','verified':seen,'currentStage33':[mp,ap]})
INIT=r"""()=>{
 const images=new Set(),blobs=new Set(),p=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(p,'src');
 Object.defineProperty(p,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const old=URL.createObjectURL;URL.createObjectURL=function(...args){const u=Reflect.apply(old,this,args);blobs.add(u);return u};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async()=>{
 const a=HonroApp;
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(33);
 for(let n=1;n<33;n++)a.profile.cleared[n]=true;
 for(const u of Object.values(a.profile.heroes))u.xp=HonroProgression.xpAt(HonroProgression.plan(33).entryLevel);
 a.launch(33);
 if(a.engine?.b?.honroStage!==33)throw Error('normal entry not Stage33');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('entry dialogue');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
DECODE=r"""async()=>{
 const ims=new Set([...document.images,...__honroObserver.images].filter(i=>i.currentSrc||i.src));
 await Promise.race([Promise.all([document.fonts.ready,...Array.from(ims,i=>i.decode())]),new Promise((_,b)=>setTimeout(()=>b(Error('decode timeout')),28000))]);
 return {images:ims.size,font:document.fonts.status};
}"""
OWNERS=r"""async L=>{
 const state=HonroApp.engine.b,m=HONRO_PROJECT.stages.find(x=>x.id==='stage-33');
 const h=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),n=>n.toString(16).padStart(2,'0')).join('');
 const all=HonroTerrainDomain.materialLandmarks(state).filter(x=>x.layer==='mid'&&x.asset);
 const check=async (id,asset,vec)=>{
  const detected=all.filter(x=>x.asset.id===id),a=HONRO_PROJECT.library.filter(x=>x.id===id),m1=m.elements.filter(x=>x.assetId===id);
  if([detected,a,m1].some(x=>x.length!==1))throw Error('owner cardinality: '+id);
  const x=m1[0],v=a[0],y=detected[0];
  if(x.x!==0||x.y!==0||x.scale!==1||x.rotation!==0||x.layer!=='mid'||x.depthLayer!=='L1'||x.nativeArtLayer!=='surface'||v.collision.length||v.interactionType||y.collisionIds.length||await h(v)!==asset||await h(v.vector)!==vec||await h(y.asset.vector)!==vec)throw Error('native owner mismatch '+id);
  return {id,asset,vec};
 };
 const low=await check(L.low,L.ownerSHA,L.vectorSHA),deep=await check(L.deep,L.deepSHA,L.deepVectorSHA);
 if(all.findIndex(x=>x.asset.id===L.deep)+1!==all.findIndex(x=>x.asset.id===L.low))throw Error('order mismatch');
 return {low,deep};
}"""
CACHE=r"""drop=>{
 const s=HonroApp.scene;
 if(drop)s._releaseDomainTiles();
 return {tiles:s._domainTiles?.tiles?.size??0,builds:s._cacheStats?.domainTileBuilds??0,hits:s._cacheStats?.worldHits??0};
}"""
POSE=(H/'park.js').read_text()
def px(b):
 from PIL import Image
 with Image.open(io.BytesIO(b))as i:
  x=i.convert('RGBA');return {'size':list(x.size),'rgbaSHA256':sha(x.tobytes()),'pngSHA256':sha(b)}
def path(u):return u[len(ORIGIN):] if u.startswith(ORIGIN) and not any(c in u for c in '?#') else None
def capture(browser,pins,w,h):
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'origins':[],'cookies':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+INIT+')()')
 status={'device':[w,h],'status':'INIT','issues':[]};PROOF['visits'].append(status)
 errs=status['issues'];pending=set();responses=[];seen=set();blobs=set();pos=0
 def req(q):
  k=path(q.url)
  if k in pins:pending.add(q)
  if not (q.method=='GET' and(k in pins or k in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))):
   errs.append(['request',q.method,q.url])
 def finished(q):pending.discard(q)
 def failed(q):
  pending.discard(q)
  if not (path(q.url)in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):errs.append(['failed',q.url,q.failure])
 def got(r):
  q=r.request;k=path(r.url)
  if k in pins and r.status==200:responses.append((k,r))
  elif BLOB.fullmatch(r.url)and r.status==200:blobs.add(r.url)
  elif k in MEDIA and q.resource_type=='media' and r.status in (200,206):
   if r.status==206 and(not q.headers.get('range','').startswith('bytes=') or not re.fullmatch(r'bytes \d+-\d+/\d+',r.headers.get('content-range',''))):
    errs.append(['invalid first-party media range',k])
  elif not r.url.startswith('data:'):errs.append(['response',r.status,r.url])
 p.on('request',req);p.on('requestfinished',finished);p.on('requestfailed',failed);p.on('response',got);p.on('pageerror',lambda e:errs.append(['pageerror',str(e)]))
 need=set(P['neededHTTP'])|{'HONRO.html'}
 def drain():
  nonlocal pos
  quiet=0;end=time.monotonic()+20
  while time.monotonic()<end:
   assert not errs,errs
   while pos<len(responses) and responses[pos][1].request not in pending:
    k,r=responses[pos];assert fact(r.body())==pins[k],k;seen.add(k);pos+=1
   snap=(pos,len(blobs));p.wait_for_timeout(120)
   quiet=quiet+1 if snap==(len(responses),len(blobs))and not pending and need<=seen else 0
   if quiet>=3:
    assert not errs and blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('incomplete public HTTP',sorted(need-seen)))
 try:
  r=p.goto(ORIGIN+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert fact(r.body())==pins['HONRO.html'] and r.url==ORIGIN+'HONRO.html'
  p.wait_for_function("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader?.ensureStage&&window.HonroApp?.launch)",timeout=90000)
  p.evaluate(LAUNCH);cv=p.locator('#battlecanvas');cv.wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
   return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  p.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for n in ('ordinary','southeast','lower'):
   k=f's33-{w}x{h}-{n}'; status['attempt']=k;emit()
   expected=P['poseAuthority'][k];pose=expected['frame']; q={'stage':33,'id':'stage-33','name':n,'dx':1 if n=='southeast'else 0,'dy':1 if n=='southeast'else 0,'dpr':1,'readback':False}
   if n!='southeast':q.update(focus=pose['desired'],require=[(3456,2304)]if n=='ordinary'else[(6300,5300)])
   imgs=p.evaluate(DECODE);assert imgs['images']>0 and imgs['font']=='loaded'
   old=p.evaluate(CACHE,True);assert old['tiles']==0
   actual=p.evaluate(POSE,q); now=p.evaluate(CACHE,False)
   assert actual==pose and actual['physics']==PHYSICS and now['builds']>old['builds'] and now['tiles']>0,k
   owner=p.evaluate(OWNERS,{'low':LO,'deep':DE,**P['ownerB']})
   drain()
   row={'frame':actual,'owner':owner,'verifiedHTTP':sorted(seen),'cacheCold':now,'decode':imgs,'images':{}}
   raw=lambda:base64.b64decode(p.evaluate("()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"),validate=True)
   for phase in ('cold','steady'):
    if phase=='steady':
     assert p.evaluate(POSE,{**q,'readback':True})==actual
     steady=p.evaluate(CACHE,False);assert steady['builds']==now['builds'] and steady['hits']>now['hits']
     row['cacheSteady']=steady;drain()
    first=raw(); dom=cv.screenshot(animations='disabled',scale='css')
    assert raw()==first,'same frozen frame drift'
    for label,body in (('raw',first),('dom',dom)):
     b=phase+'_'+label;facts=px(body);ref=expected['priorPNG'][b]
     assert facts['size']==ref['size']
     name=k+'-'+phase+'-'+label+'.png';(OUT/name).write_bytes(body)
     row['images'][b]={**facts,'path':name,'matchesSamePhaseR2RGBA':facts['rgbaSHA256']==ref['rgbaSHA256']}
   PROOF['frames'][k]=row;emit()
  status['status']='CAPTURED'
 except Exception as e:
  status['status']='HOLD';errs.append([type(e).__name__,str(e)])
 finally:emit();ctx.close()
def app():
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 pins=established();http(pins)
 from playwright.sync_api import sync_playwright
 with sync_playwright()as z:
  b=z.chromium.launch();assert b.version=='151.0.7922.34'
  try:
   for w,h in ((1440,900),(390,844)):capture(b,pins,w,h)
  finally:b.close()
 assert len(PROOF['frames'])==6 and all(v['status']=='CAPTURED'for v in PROOF['visits'])
 changed=[[k,c] for k,v in PROOF['frames'].items()for c,img in v['images'].items()if not img['matchesSamePhaseR2RGBA']]
 PROOF.update(status='EXACT_PUBLIC_SCOPE_NEEDS_HUMAN_READ'if not changed else 'EXACT_PUBLIC_GRAPH_IMAGE_PHASE_MISMATCH_REVIEW',
  knownPriorReferenceDifferent=changed,reviewPNG=[v['images']['steady_dom']['path']for v in PROOF['frames'].values()],
  noGameplayClaim=True,releasePin=R)
 emit()
 assert not changed,'actual public frames saved, but comparative exact phase parity needs review'
if __name__=='__main__':
 OUT=Path(sys.argv[2]).resolve()
 assert OUT.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and OUT.is_dir()
 try:{'authority':authority,'app':app}[sys.argv[1]]()
 except Exception as e:
  PROOF.setdefault('errors',[]).append([type(e).__name__,str(e)])
  if PROOF['status']=='INIT':PROOF['status']='HOLD'
  emit();raise
