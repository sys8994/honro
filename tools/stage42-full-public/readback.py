"""Anonymous live Pages + cold title Continue from exact disposable 2c4 saves."""
import json,sys,base64,hashlib,io,traceback
import contextlib,functools,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); O=json.loads((D/'observer.json').read_bytes())
def ensure(x,msg):
 if not x: raise RuntimeError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def matches(raw,pin):return sha(raw)==pin['sha256']
def save():(proofdir/'READBACK.json').write_text(json.dumps(q,indent=2)+'\n')
class HTTP(SimpleHTTPRequestHandler):
 def send_head(self):
  u=urlsplit(self.path)
  if u.query or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%')):
   self.send_error(404);return None
  self.path='/'+u.path.removeprefix('/honro/')
  f=Path(self.translate_path(self.path))
  if not f.is_file() or not f.resolve().is_relative_to(Path(self.directory).resolve()):
   self.send_error(404);return None
  return super().send_head()
 def log_message(self,*_):pass
@contextlib.contextmanager
def server(root):
 h=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(HTTP,directory=str(root)))
 t=threading.Thread(target=h.serve_forever,daemon=True);t.start()
 try:yield f'http://127.0.0.1:{h.server_port}/honro/'
 finally:h.shutdown();h.server_close();t.join()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=40).strip()
COMMON=r"""
 const k='act5:near:42';
 const lists=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements];
 const placements=b=>lists(b).flatMap(xs=>(xs||[]).filter(x=>x.assetId===k));
 const valid=b=>Boolean(b&&b.mode==='campaign'&&b.honroStage===42&&b.stage===42&&
  b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.honroAct5===1&&
  b.honroAuthoredId==='stage-42'&&b.honroCampaignMapRevision===1&&b.honroRevision===20&&b.honroMapRevision===20);
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const state=b=>({terrain:JSON.stringify([b.terrain,b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds]),
  units:JSON.stringify(b.units),objectives:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),
  phase:b.phase,round:b.round,revision:b.honroCampaignMapRevision,
  placements:placements(b).map(({asset,...x})=>x)});
"""
PERSIST='key=>{'+COMMON+r"""
 const a=HonroApp;if(!valid(a.engine?.b)||a.profileStore.locked||a.persist()!==true)throw Error('legitimate game save refused');
 const text=localStorage.getItem(key),p=JSON.parse(text),b=p.honroBattle;
 if(!valid(b)||HonroCampaignMapRevision.obsolete(b))throw Error('genuine persisted battle has unexpected identity');
 const rows=placements(b);
 if(rows.length!==2||rows.some(x=>x.asset.honroStaticAssetRef!==1||x.asset.id!==k))throw Error('expected two exact target static refs');
 return {text,refs:rows.map(x=>x.asset.signature),state:state(b),liveAtPersist:state(a.engine.b)};
}"""
RESTORED='()=>{'+COMMON+r"""
 const a=HonroApp,b=a.engine?.b;if(!valid(b)||a.profileStore.locked)throw Error('did not mount a real canonical resumed checkpoint');
 const rows=placements(b),active=HONRO_PROJECT.library.filter(x=>x.id===k);
 if(active.length!==1||rows.length!==2)throw Error('expected exactly one current provider and two compiled slots');
 return {state:state(b),active:sig(active[0]),mounted:rows.map(x=>sig(x.asset))};
}"""
KEY='honro-first-act-profile-1'
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'"
AIM="""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}"""
def tap_script(projection):
 return '()=>{'+projection+r"""
 const a=HonroApp,l=a.launch,m=a.mount,c={launches:0,mounts:0},d={};
 window.__honroContinueTap=c;window.__honroContinueCheckpoints=d;
 const snap=(name,b)=>{try{d[name]=valid(b)?JSON.parse(JSON.stringify(state(b))):null;}catch(_){d[name]=null;}};
 snap('titleProfile',a.profile.honroBattle);
 a.launch=function(){++c.launches;return Reflect.apply(l,this,arguments)};
 a.mount=function(b){
  if(++c.mounts!==1)return Reflect.apply(m,this,arguments);
  snap('profileAtMount',a.profile.honroBattle);
  snap('preMount',b);
  const result=Reflect.apply(m,this,arguments);
  snap('mountedAtReturn',this.engine?.b);
  return result;
 };
}"""
TAP=tap_script(COMMON)
JSON_STATE_FIELDS={'terrain','units','objectives'}
def compare_state(left,right):
 # Never write profile bytes, raw state values, arbitrary exception payloads or
 # attacker-controlled property keys. Only path shapes, types, counts & field-hashes.
 if not isinstance(left,dict) or not isinstance(right,dict):return {'available':False,'exact':False}
 fixed={'state','phase','round','revision','terrain','units','objectives','placements','id','x','y','vx','vy','angle','grounded','onGround','ground','hp','maxHp','sp','maxSp','st','maxSt','dead','turn','dir','side','name','class','cls','w','h','assetId','scale','rotation','kind','collisionIds','target','alive','movement','move','status','solid','type','z','visualRole','layer','depthLayer','width','height','points','bounds','maxX','minX','left','right','top','bottom','heights','flags','turnOrder','current','last','max','index','active','pending','done','number','counter','stunned','cooldowns','capture','stage','time','objective','recovery','unit'}
 def part(k):
  return k if k in fixed else '@'+sha(k.encode('utf-8'))[:12]
 def enc(v):
  return json.dumps(v,ensure_ascii=True,separators=(',',':'),allow_nan=False).encode()
 def desc(x):
  return 'absent' if x is missing else type(x).__name__
 missing=object(); fields={}; diffs=set(left)|set(right)
 for k in sorted(diffs):
  a,b=left.get(k,missing),right.get(k,missing)
  if type(a) is type(b) and a==b:continue
  r={'exact':False,'orderOnly':False,'diffCount':0,'examples':[],
     'beforeSHA256':None if a is missing else sha(enc(a)),
     'afterSHA256':None if b is missing else sha(enc(b))}
  def diff(path,x,y):
   if type(x) is type(y) and x==y:return
   if type(x) is dict and type(y) is dict:
    for c in sorted(set(x)|set(y)):diff(path+'.'+part(c),x.get(c,missing),y.get(c,missing))
   elif type(x) is list and type(y) is list:
    for i in range(max(len(x),len(y))):diff(f'{path}[{i}]',x[i] if i<len(x) else missing,y[i] if i<len(y) else missing)
   else:
    r['diffCount']+=1
    if len(r['examples'])<40:r['examples'].append([path,desc(x),desc(y)])
  if k in JSON_STATE_FIELDS and isinstance(a,str) and isinstance(b,str):a,b=json.loads(a),json.loads(b)
  diff('$.'+part(k),a,b)
  r['orderOnly']=r['diffCount']==0
  fields[part(k)]=r
 return {'available':True,'exact':left==right,'orderOnly':bool(fields) and all(x['orderOnly'] for x in fields.values()),'differentFields':fields}

# Source engine.ts::stepUnits; warriorMechanics.ts::tickWarrior. These are not
# a broad ignored-property list: only an absent own field becoming numeric zero
# is allowed. Existing values, additions of nonzero/default false, deletion,
# and all other changes fail. Full game-ready state must ALSO exactly match
# the independently executed stock self-Continue arm.
ZERO_INITIALIZED=('eaterSwallow','impactCooldown','landing','moving','salheunFlash')
SHA_STATE_TRANSITIONS=('persisted_vs_title','title_vs_profileAtMount','profileAtMount_vs_preMount','preMount_vs_syncMounted')
def state_projection(before,after):
 result={'unchangedAfterExactZeroInitialization':False,'materializedZeroCounts':{}}
 if not isinstance(before,dict) or not isinstance(after,dict) or list(before)!=list(after):return result
 if any(before[k]!=after[k] for k in before if k!='units'):return result
 try:a,b=(json.loads(x['units']) for x in (before,after))
 except (TypeError,ValueError,KeyError):return result
 if not isinstance(a,list) or not isinstance(b,list) or len(a)!=len(b):return result
 def form(v):return json.dumps(v,ensure_ascii=True,separators=(',',':'),allow_nan=False)
 for old,new in zip(a,b):
  if type(old) is not dict or type(new) is not dict:return result
  for k in ZERO_INITIALIZED:
   if k not in old and k in new and type(new[k]) in (int,float) and new[k]==0 and form(new[k]) in ('0','0.0'):
    del new[k];result['materializedZeroCounts'][k]=result['materializedZeroCounts'].get(k,0)+1
  if form(old)!=form(new):return result
 result['unchangedAfterExactZeroInitialization']=True
 return result
def state_fact(state):
 ensure(isinstance(state,dict),'missing game-ready state')
 return sha(json.dumps(state,ensure_ascii=True,separators=(',',':'),allow_nan=False).encode())
FRESH_RAF="()=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('real RAF timeout')),3000);requestAnimationFrame(()=>{clearTimeout(t);resolve()})})"
def stable_ready(page,expr,arg=None,extract=lambda r:r['state']):
 # No inputs, renderer/engine changes, timer forcing, sleeps or simulated turns.
 # Prove a game-ready comparison does not depend on one scheduled frame.
 run=lambda:page.evaluate(expr) if arg is None else page.evaluate(expr,arg)
 r=run();page.evaluate(FRESH_RAF);after=run()
 return after, {'stableAcrossNaturalRAF':extract(r)==extract(after),'before':state_fact(extract(r)),'after':state_fact(extract(after))}
def observe_cold(saved,live,d):
 proof={
  'persisted_vs_title':compare_state(saved,d.get('titleProfile')),
  'title_vs_profileAtMount':compare_state(d.get('titleProfile'),d.get('profileAtMount')),
  'profileAtMount_vs_preMount':compare_state(d.get('profileAtMount'),d.get('preMount')),
  'preMount_vs_syncMounted':compare_state(d.get('preMount'),d.get('mountedAtReturn')),
  'syncMounted_vs_afterAim':compare_state(d.get('mountedAtReturn'),live),
  'persisted_vs_afterAim':compare_state(saved,live)}
 return proof,state_projection(saved,live)
def require_ready(record, baseline, state):
 ensure(all(record['stateDiff'][k].get('exact') for k in SHA_STATE_TRANSITIONS),'persisted restore through synchronous mount changed')
 ensure(record['stability']['stableAcrossNaturalRAF'],'no stable no-input game-ready frame')
 ensure(record['explicitInvariant']['unchangedAfterExactZeroInitialization'],'game-ready invariant changes beyond exact absent → zero')
 if baseline is not None:ensure(state==baseline,'full ready state mismatches stock→stock')

def uploadfact(s):return fact(s.encode())
def visit_init(br,host,device,files,saved=None):
 ctx=br.new_context(viewport=dict(zip(('width','height'),P['devices'][device]['size'])),device_scale_factor=1,service_workers='block')
 page=ctx.new_page(); seen={}; errors=[]
 ensure(not ctx.cookies(),'test started with inherited cookies')
 page.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(host) else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 if saved is not None:
  loc=urlsplit(host);ensure(host==P['publicRoot'] or (loc.hostname=='127.0.0.1' and loc.scheme=='http' and loc.path=='/honro/'),'cold profile authority')
  args=json.dumps({'origin':loc.scheme+'://'+loc.netloc,'text':saved,'key':KEY},ensure_ascii=True)
  page.add_init_script('(()=>{const p='+args+';if(location.origin===p.origin&&location.pathname==="/honro/HONRO.html"&&localStorage.getItem(p.key)===null)localStorage.setItem(p.key,p.text)})();')
 try:
  r=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  ensure(r and r.status==200 and r.url==host+'HONRO.html' and sha(r.body())==files['HONRO.html'],'wrong watched HTML')
  page.wait_for_function(READY,timeout=90000)
  page.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  return (ctx,page,seen,errors)
 except Exception:
  ctx.close();raise
def wait_aim(p):
 p.locator('#battlecanvas').wait_for(state='visible',timeout=50000)
 p.wait_for_function(AIM,timeout=16000)
def wire(host,files,seen,errors):
 ensure(not errors,'actual page error '+repr(errors));return {k:wire_one(host,k,v,seen) for k,v in files.items()}
def wire_one(host,k,v,seen):
 a=seen.get(host+k);ensure(a and a.status==200 and not a.from_service_worker and sha(a.body())==v,'missing/mismatched actual immutable route '+k)
 return v
def exact_state(r,stamp):
 ensure(r['active']==stamp and r['mounted']==[stamp,stamp],'wrong actual active/mounted provider')
PHYSICS_WITH_PERSISTED_DEFAULTS_ONLY="""({sig,before,names})=>{
 const doc=JSON.parse(sig), orig=JSON.parse(before);
 if(!Array.isArray(doc.units)||doc.units.length!==orig.length)throw Error('ready screenshot actor list changed');
 doc.units.forEach((v,i)=>{
  const old=orig[i];
  if(v.id!==old.id)throw Error('ready screenshot actor identity changed');
  for(const name of names)if(!Object.hasOwn(old,name)&&Object.hasOwn(v,name)&&Object.is(v[name],0))delete v[name];
 });
 if(JSON.stringify(doc.units)!==before)throw Error('ready screenshot actor data changed since checkpoint');
 return JSON.stringify(doc);
}"""
def obs(p,device,name,persisted=None):
 dev=P['devices'][device];want=dev['views'][name];m=P['cameraModes'][name]
 args={'id':42,'mapId':'stage-42','name':m['mode'],'ordinary':want if m['mode']=='ordinary' else [],'dx':m['dx'],'dy':m['dy'],'readback':False,'fixedNow':O['PHASE']}
 def short(v):
  raw=v['meta'].pop('signature')
  if persisted is not None:
   v['meta']['unprojectedPhysics']=sha(raw.encode())
   raw=p.evaluate(PHYSICS_WITH_PERSISTED_DEFAULTS_ONLY,{'sig':raw,'before':persisted['units'],'names':ZERO_INITIALIZED})
  v['meta']['physics']=sha(raw.encode());return v
 v=short(p.evaluate(O['FROZEN'],args));neg=p.evaluate(O['DECODE'])
 ensure(not neg['failed'] and v==short(p.evaluate(O['FROZEN'],{**args,'readback':True})),'draw/decode drift')
 s=v['meta'];ensure(s['actual']==dict(zip(('x','y','scale'),want)) and s['physics']==P['physics'] and s['actorCount']==34 and s['backing']==dev['backing'] and s['sceneTime']==2 and s['phase']=='aim' and s['round']==1,'camera, map, or actor mismatch')
 return v
def pictures(p,device,view,label,persisted=None):
 meta=obs(p,device,view,persisted)
 pics={}
 for k,raw in {'raw':base64.b64decode(p.evaluate(O['CANVAS']),validate=True),'dom':p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=25000)}.items():
  file='-'.join((device,label,view,k))+'.png';(proofdir/file).write_bytes(raw)
  with Image.open(io.BytesIO(raw)) as im:
   pics[k]={'file':file,'rgba':sha(im.convert('RGBA').tobytes()),'png':sha(raw),'size':list(im.size)}
 return {'images':pics,'pose':meta}
FAR_OBS="""()=>{const e=HonroApp.engine;const k=HonroAuthoredFarArt.keyFor(e.b.honroStage),stats=HonroApp.scene.environmentStats;
 const src=HonroAuthoredFarArt.manifest.images[k];return {key:k,url:src,painted:stats?.authoredFar??null,
 decoded:[...(window.__honroObserver?.images||[])].filter(i=>(i.currentSrc||i.src)===src).map(i=>({complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}))};}"""
def qualified_far(p,host,files,seen,record):
 f=p.evaluate(FAR_OBS);record['far']=f;save()
 far=P['stageFar'];k=far['path']
 ensure(f['key']==far['key'] and f['painted']==[far['key']] and f['url']==host+k
        and any(x['complete'] and x['width']>0 and x['height']>0 for x in f['decoded']),'candidate valleyFar was not naturally fetched/decoded/painted at known pose '+repr(f))
 record['far']['responseSHA256']=wire_one(host,k,files[k],seen);save()
def mark_failed(label):
 message=traceback.format_exc(limit=8);q['errors'][label]=message;q.setdefault('firstFailure',message);save()

def public_wire():
 verified={}; bodies={}
 pins={**P['publicBuild'],**P['protectedPeerSHA256'],'web/manifest.json':P['release']['manifest']['sha256']}
 for k,v in pins.items():
  url=P['publicRoot']+k
  with urlopen(Request(url,headers={'Cache-Control':'no-cache','Pragma':'no-cache'}),timeout=40) as r:
   ensure(r.status==200 and r.url==url,'public immutable GET redirected/failed '+k)
   raw=r.read((12<<20)+1)
  ensure(len(raw)<=12<<20 and sha(raw)==v,'public route no longer exact '+k)
  verified[k]=fact(raw)
  if k in ('web/manifest.json',P['publicCampaign']):bodies[k]=raw
 ensure(verified['web/manifest.json']==P['release']['manifest'],'wrong public manifest size')
 m,c=map(json.loads,(bodies['web/manifest.json'],bodies[P['publicCampaign']]))
 active={r['path']:r for r in m['files']}
 ensure(m['project']==P['publicCampaign'] and m['gameEntry'] in pins and c['stages'][41]==P['publicMap'] and c['stageLibraries'][41]==P['publicProvider'],'wrong active Stage42 alias graph')
 ensure(all(k in active and active[k]['sha256']==pins[k] for k in pins if k.startswith('web/')),'public manifest does not list exact protected active wires')
 return verified

def stock_root(root):
 s=P['stock'];ensure(git(root,'rev-parse','HEAD')==s['head'] and git(root,'rev-parse','HEAD^{tree}')==s['tree'] and not git(root,'status','--porcelain'),'wrong immutable stock 2c4 worktree')
 files={k:v for k,v in s['files'].items() if k in ('HONRO.html',s['map'],s['provider'],s['campaign']) or k.startswith('web/entries/game.')}
 ensure(len(files)==5 and all(sha((root/k).read_bytes())==v for k,v in files.items()),'stock save wire pin mismatch')
 m=json.loads((root/'web/manifest.json').read_bytes());c=json.loads((root/s['campaign']).read_bytes())
 ensure(git(root,'rev-parse','HEAD:web/manifest.json')==s['manifestGit'] and m['project']==s['campaign'] and c['stageLibraries'][41]==s['provider'] and c['stages'][41]==s['map'],'wrong historical active map/provider')
 old=P['beforeCommon5'];data=(root/old['path']).read_bytes()
 ensure(hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()==old['git'],'wrong exact stock save code')
 return {**files,old['path']:sha(data)}

def source_save(br,host,files,dev):
 c,p,seen,errors=visit_init(br,host,dev,files)
 try:
  p.evaluate(O['LAUNCH'],42);wait_aim(p);r=p.evaluate(RESTORED);stamp=P['stock']['owner'];exact_state(r,stamp)
  saved=p.evaluate(PERSIST,KEY);ensure(saved['refs']==[stamp,stamp] and saved['state']==saved['liveAtPersist'],'native 2c4 save did not preserve its exact mounted state')
  rec={'sourceSave':uploadfact(saved['text']),'providerRefs':saved['refs']};q['stockSaves'][dev]=rec;save()
  rec['wires']=wire(host,files,seen,errors);save();return saved
 finally:c.close()

def live_cold(br,host,files,dev,saved,stock_ready=None):
 target='STOCK' if host!=P['publicRoot'] else 'PUBLIC'
 stamp=P['stock']['owner'] if target=='STOCK' else P['fullSignature']
 ensure(target=='STOCK' or stock_ready is not None,'missing actual 2c4 stock→stock oracle')
 c,p,seen,errors=visit_init(br,host,dev,files,saved['text'])
 try:
  ensure(p.evaluate('(k)=>localStorage.getItem(k)',KEY)==saved['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'fresh title did not see its exact disposable profile')
  p.evaluate(TAP); btn=p.locator('.title-actions button[data-action="continue"]').first
  btn.wait_for(state='visible',timeout=12000);btn.click();wait_aim(p)
  r,stable=stable_ready(p,RESTORED);exact_state(r,stamp)
  counts=p.evaluate("()=>window.__honroContinueTap");d=p.evaluate("()=>window.__honroContinueCheckpoints")
  diff,invariant=observe_cold(saved['state'],r['state'],d)
  rec=q['continue'][dev+'-2C4-to-'+target]={
     'stateDiff':diff,'explicitInvariant':invariant,'stability':stable,'sourceSave':uploadfact(saved['text']),
     'titleAction':counts,'mounted':r['mounted'],'readyComparedToStock':None if stock_ready is None else compare_state(stock_ready,r['state'])}
  save()
  ensure(counts=={'launches':0,'mounts':1},'did not genuine cold Continue exactly one mount')
  require_ready(rec,stock_ready,r['state']);rec['sameState']=True;save()
  if target=='PUBLIC':
   raw=p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=15000)
   name=dev+'-2C4-to-PUBLIC-actual-cold.png';(proofdir/name).write_bytes(raw)
   rec['screenshot']={'file':name,**fact(raw)}
  rec['wires']=wire(host,files,seen,errors)
  ensure(p.evaluate(RESTORED)['state']==r['state'],'actual cold capture drifted from validated ready state')
  save();return r['state']
 finally:c.close()

def live_photos(br,full,core,dev):
 host=P['publicRoot'];c,p,seen,errors=visit_init(br,host,dev,core)
 try:
  p.evaluate(O['LAUNCH'],42);wait_aim(p);exact_state(p.evaluate(RESTORED),P['fullSignature'])
  for view,pin in P['nativeOracle']['pairs'][dev].items():
   label=dev+'-'+view
   try:
    f=pictures(p,dev,view,'public');q['frames'][label]=f;save()
    qualified_far(p,host,full,seen,f)
    f['exactDecodedRGBA']={key:rec['rgba']==pin[key] for key,rec in f['images'].items()};save()
    ensure(all(f['exactDecodedRGBA'].values()),'public fresh pixels differ from official QA '+label)
   except Exception:mark_failed('frame-'+label)
  q['browserWires'][dev]=wire(host,full,seen,errors);save()
 finally:c.close()

if __name__=='__main__':
 ensure(P['enabled'] is True and all(P['release'].values()),'disabled or missing signed Pages identity: no requests')
 ensure(P['publicRoot']=='https://sys8994.github.io/honro/' and sha((D/'observer.json').read_bytes())==P['observerSHA256'],'unreviewed exact observer or public origin')
 from playwright.sync_api import sync_playwright
 from PIL import Image
 stock,proofdir=(Path(x).resolve() for x in sys.argv[1:]);proofdir.mkdir()
 graphs=stock_root(stock)
 keys={'HONRO.html',P['publicCampaign'],P['publicMap'],P['publicProvider']}|{
    k for k in P['publicBuild'] if k.startswith(('web/runtime/campaign.','web/runtime/ordered-common-5.')) or (k.startswith('web/entries/game.') and k.endswith('.js'))}
 core={k:P['publicBuild'][k] for k in keys}
 ensure(len(core)==7,'incorrect game launch wire set')
 full={**core,**{P['stageFar'][k]:P['publicBuild'][P['stageFar'][k]] for k in ('path','config')}}
 q={'status':'HOLD','release':P['release'],'scope':'Exact public Pages; anonymous ephemeral PC/M captures with no route replacement; true old disposable saves remain only in browser memory. Not a full playtest.', 'pins':{'oracle':P['nativeOracle'],'stock':P['stock']['head']},'frames':{},'stockSaves':{},'continue':{},'browserWires':{},'errors':{}}
 save()
 try:
  q['directBefore']=public_wire();save()
  with server(stock) as host, sync_playwright() as pw:
   br=pw.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    ensure(br.version==P['chrome'],'wrong actual browser')
    for dev in ('PC','M'):
     try:live_photos(br,full,core,dev)
     except Exception:mark_failed('fresh-'+dev)
     try:
      old=source_save(br,host,graphs,dev)
      same=live_cold(br,host,graphs,dev,old)
      live_cold(br,P['publicRoot'],core,dev,old,same)
     except Exception:mark_failed('cold-'+dev)
   finally:br.close()
  q['directAfter']=public_wire();save()
  ensure(q['directBefore']==q['directAfter'],'public bytes changed during test')
  ensure(not q['errors'] and len(q['frames'])==8 and len(q['continue'])==4 and len(q['browserWires'])==2,'incomplete exact real public observations')
  q['status']='PASS_PUBLIC_STAGE42_PC_M_NATIVE_AND_TRUE_2C4_TITLE_CONTINUE'
 except Exception:
  q.setdefault('firstFailure',traceback.format_exc(limit=8));raise
 finally:save()
