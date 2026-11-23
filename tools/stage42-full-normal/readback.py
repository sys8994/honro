"""Normal native Stage42 build and cold title Continue, no deployment."""
import json,sys,base64,hashlib,io,traceback
import contextlib,functools,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
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
NEG='text=>{'+COMMON+r"""
 const saved=JSON.parse(text).honroBattle;
 const test=f=>{const b=structuredClone(saved);f(b);const t=JSON.stringify(b);
  return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===t};
 return {wrongStage:test(b=>b.honroStage=43),wrongMode:test(b=>b.mode='practice'),
  workshop:test(b=>b.honroMapOrigin='workshop'),custom:test(b=>b.honroCustom=true),
  nonCanonical:test(b=>b.honroCanonical=false),wrongMapRevision:test(b=>b.honroCampaignMapRevision=2),
  wrongOfficial:test(b=>b.honroAct5=0),wrongPlacement:test(b=>placements(b)[0].x=1),
  wrongCollision:test(b=>placements(b)[0].collisionIds=['test-not-real']),
  unknownSignature:test(b=>placements(b)[0].asset.signature='4:deadc0de'),
  malformedLastAtomic:test(b=>placements(b).at(-1).asset.honroStaticAssetRef=2)};
}"""
KEY='honro-first-act-profile-1'
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'"
AIM="""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}"""
TAP='()=>{'+COMMON+r"""
 const a=HonroApp,l=a.launch,m=a.mount,c={launches:0,mounts:0},d={};
 window.__honroContinueTap=c;window.__honroContinueCheckpoints=d;
 // An observation error cannot change App.continue() or its mount path.
 const snap=(name,b)=>{try{d[name]=valid(b)?JSON.parse(JSON.stringify(state(b))):null;}catch(_){d[name]=null;}};
 snap('titleProfile',a.profile.honroBattle);
 a.launch=function(){++c.launches;return Reflect.apply(l,this,arguments)};
 a.mount=function(b){
  if(++c.mounts!==1)return Reflect.apply(m,this,arguments);
  snap('profileAtMount',a.profile.honroBattle);
  snap('preMount',b); // true App.continue() argument after restoreBattleArt(), before mount
  const result=Reflect.apply(m,this,arguments);
  snap('mountedAtReturn',this.engine?.b); // synchronous snapshot before AIM ticking
  return result;
 };
}"""
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

def uploadfact(s):return fact(s.encode())
def signaturefiles(root,arm):
 if arm=='PREA':
  h=P['history342'];actual=h;c=h['campaign']
  sh={'HONRO.html':h['shellSHA'],c:h['campaignSHA'],h['map']:h['mapSHA'],h['packet']:h['packetSHA']}
  ensure(json.loads((root/'web/manifest.json').read_bytes())['project']==c,'wrong historical campaign address')
  identity=dict(campaign=c,map=h['map'],provider=h['packet'])
 else:
  actual=P['arms'][{'A6':'A','BF6':'BF6','CURRENT':'B'}[arm]];sh=actual['files'];identity={k:actual[k] for k in ('campaign','map','provider')}
 ensure(git(root,'rev-parse','HEAD')==actual['head'] and git(root,'rev-parse','HEAD^{tree}')==actual['tree'] and not git(root,'status','--porcelain'),'wrong clean historical tree '+arm)
 for k,v in sh.items():ensure(sha((root/k).read_bytes())==v,'invalid historical authority '+k)
 c=json.loads((root/identity['campaign']).read_bytes())
 ensure(c['stages'][41]==identity['map'] and c['stageLibraries'][41]==identity['provider'],'wrong exact historic Stage42 map/packet aliases')
 return {k:v for k,v in sh.items() if k!='web/manifest.json'}
def source_routes(arm,allfiles):
 if arm=='PREA':head=P['history342']; c,m,p=head['campaign'],head['map'],head['packet']
 elif arm=='NEW':
  g=json.loads((proofdir/'NORMAL-GRAPH.json').read_bytes())
  cs=[k for k in allfiles if k.startswith('web/data/campaign.')]
  ensure(len(cs)==1,'ambiguous normal campaign')
  c,m,p=cs[0],g['map'],g['packet']
 else:
  head=P['arms'][{'A6':'A','BF6':'BF6','CURRENT':'B'}[arm]];c,m,p=head['campaign'],head['map'],head['provider']
 keys=['HONRO.html',c,m,p]
 # Current/historical a6/bf6 bootstrap aliases are deterministically known.
 if arm!='PREA':
  ids=[k for k in allfiles if k.startswith('web/entries/game.') and k.endswith('.js')]
  ensure(len(ids)==1,'ambiguous source game entry')
  keys+=ids
 ensure(len(set(keys))==len(keys),'duplicate source route address')
 return {k:allfiles[k] for k in keys}
def source_far_receipt(host,allfiles,seen):
 k=P['stageFar']['path']
 if k not in allfiles:return {'status':'NOT_PINNED_AT_PRESAVE_AUTHORITY'}
 if host+k not in seen:return {'status':'NO_RESPONSE_AT_SOURCE_SAVE_CHECKPOINT'}
 return {'status':'OBSERVED_EXACT_AT_SOURCE_CHECKPOINT','sha256':wire_one(host,k,allfiles[k],seen)}
def visit_init(br,host,device,files,saved=None):
 ctx=br.new_context(viewport=dict(zip(('width','height'),P['devices'][device]['size'])),device_scale_factor=1,service_workers='block')
 ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(host) or route.request.url.startswith(('data:','blob:','about:')) else route.abort())
 page=ctx.new_page(); seen={}; errors=[]
 page.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(host) else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 if saved is not None:
  loc=urlsplit(host);ensure(loc.hostname=='127.0.0.1' and loc.scheme=='http' and loc.path=='/honro/','cold profile authority')
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
def obs(p,device,name):
 dev=P['devices'][device];want=dev['views'][name];m=P['cameraModes'][name]
 args={'id':42,'mapId':'stage-42','name':m['mode'],'ordinary':want if m['mode']=='ordinary' else [],'dx':m['dx'],'dy':m['dy'],'readback':False,'fixedNow':O['PHASE']}
 def short(v):
  v['meta']['physics']=sha(v['meta'].pop('signature').encode());return v
 v=short(p.evaluate(O['FROZEN'],args));neg=p.evaluate(O['DECODE'])
 ensure(not neg['failed'] and v==short(p.evaluate(O['FROZEN'],{**args,'readback':True})),'draw/decode drift')
 s=v['meta'];ensure(s['actual']==dict(zip(('x','y','scale'),want)) and s['physics']==P['physics'] and s['actorCount']==34 and s['backing']==dev['backing'] and s['sceneTime']==2 and s['phase']=='aim' and s['round']==1,'camera, map, or actor mismatch')
 return v
def pictures(p,device,view,label):
 meta=obs(p,device,view)
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
def author(br,hosts,graphs,stamps,dev,arm,saves):
 host=hosts[arm];files=graphs[arm];label=dev+'-'+arm; core=source_routes(arm,files)
 c,p,seen,errors=visit_init(br,host,dev,core)
 try:
  p.evaluate(O['LAUNCH'],42);wait_aim(p);r=p.evaluate(RESTORED);exact_state(r,stamps[arm])
  s=p.evaluate(PERSIST,KEY);ensure(s['refs']==[stamps[arm],stamps[arm]],'normal write did not write both refs')
  proof=q['visits'][label]={'generated':uploadfact(s['text']),'refs':s['refs'],'mounted':r['mounted'],'scope':'source-save-only' if arm!='NEW' else 'candidate with real photos'};save()
  proof['wires']=wire(host,core,seen,errors);saves[arm]=s;save()
  if arm!='NEW':
   proof['far']=source_far_receipt(host,files,seen);save();return
  for name,ref in P['visualFixture']['pairs'][dev].items():
   wl=dev+'-'+name
   try:
    frame=pictures(p,dev,name,'normal-full');v=q['visualComparison'][wl]={'normal':frame};save()
    qualified_far(p,host,files,seen,frame)
    diff={k:frame['images'][k]['rgba']==val['rgba'] for k,val in ref.items()}
    v['priorFixtureDecodedRGBAExact']=diff
    ensure(all(diff.values()),'candidate fresh frame differs from qualified visual fixture '+wl)
   except Exception:mark_failed('visual-'+wl)
  proof['visualWires']=wire(host,files,seen,errors);save()
 finally:c.close()
def cold(br,hosts,graphs,stamps,dev,arm,saves):
 host=hosts['NEW'];files=graphs['NEW'];label=dev+'-'+('MIGRATED-RESAVE' if arm=='MIGRATED' else arm+'-to-NEW')
 ensure(arm in saves,'missing independently validated source-save for '+label);s=saves[arm]
 c,p,seen,errors=visit_init(br,host,dev,files,s['text'])
 try:
  ensure(p.evaluate('(k)=>localStorage.getItem(k)',KEY)==s['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'snapshot missing or auto-mounted')
  p.evaluate(TAP);btn=p.locator('.title-actions button[data-action="continue"]').first
  btn.wait_for(state='visible',timeout=12000);btn.click();wait_aim(p)
  r=p.evaluate(RESTORED);exact_state(r,stamps['NEW'])
  counts=p.evaluate("()=>window.__honroContinueTap"); d=p.evaluate("()=>window.__honroContinueCheckpoints")
  ensure(counts=={'launches':0,'mounts':1},'not actual one cold Continue mount '+label)
  record=q['coldContinue'][label]={'inputSave':uploadfact(s['text']),'mounted':r['mounted'],'sameState':r['state']==s['state'],'actualTitleContinue':True,
    'stateDiff':{
      'persisted_vs_authorMounted':compare_state(s['state'],s['liveAtPersist']),
      'persisted_vs_title':compare_state(s['state'],d.get('titleProfile')),
      'title_vs_profileAtMount':compare_state(d.get('titleProfile'),d.get('profileAtMount')),
      'profileAtMount_vs_preMount':compare_state(d.get('profileAtMount'),d.get('preMount')),
      'preMount_vs_syncMounted':compare_state(d.get('preMount'),d.get('mountedAtReturn')),
      'syncMounted_vs_afterAim':compare_state(d.get('mountedAtReturn'),r['state']),
      'persisted_vs_afterAim':compare_state(s['state'],r['state']),
    }};save()
  ensure(all(x['available'] for x in record['stateDiff'].values()),'read-only checkpoint witness incomplete '+label)
  ensure(r['state']==s['state'],'Continue changed gameplay state '+label)
  # All successful Continue arms have the same genuine, fixed visual replay,
  # including the previously non-photographed post-migration cold re-save.
  record['frame']=pictures(p,dev,'low-east',arm+'-to-NEW');save()
  qualified_far(p,host,files,seen,record['frame'])
  record['wires']=wire(host,files,seen,errors);save()
  if arm=='CURRENT':
   record['invalidCases']=p.evaluate(NEG,s['text']);save()
   ensure(all(record['invalidCases'].values()),'bad legacy accepted')
   resave=p.evaluate(PERSIST,KEY);ensure(resave['refs']==[stamps['NEW'],stamps['NEW']],'migrated resave did not pin new refs')
   saves['MIGRATED']=resave;record['migratedResave']=uploadfact(resave['text']);save()
 finally:c.close()
STAGE40=r"""({key,registry,mode})=>{
 const a=HonroApp;
 const ids=Object.keys(registry);
 const b=a.engine?.b;
 const groups=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements].flatMap(xs=>xs||[]);
 const valid=b=>b?.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroStage===40&&b.honroAct4Official===1&&b.honroCanonical===true&&b.honroCustom===false;
 const picks=(b,id)=>groups(b).filter(x=>(x.asset?.id??x.assetId)===id);
 const sig=v=>{const s=JSON.stringify(v);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const need=(v,s)=>{if(!v)throw Error(s)};
 need(valid(b)&&!a.profileStore.locked,'not actual canonical Stage40');
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const state=b=>({terrain:[b.terrain,b.honroWorldTerrain,b.honroTerrainBounds,b.honroPlayBounds],units:b.units,
  objectives:[b.objectives,b.honroObjectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState],phase:b.phase,round:b.round,
  revision:[b.stage,b.honroRevision,b.honroCampaignMapRevision,b.honroMapRevision],placements:groups(b).map(({asset,...r})=>[asset?.id??null,r])});
 const have={};
 for(const id of ids){
  const row=registry[id],db=HONRO_PREVIOUS_TERRAIN_ART[id];
  need(same(db,row),'changed Stage40 compatible signature registry '+id);
  const list=HONRO_PROJECT.library.filter(x=>x.id===id);
  need(list.length===1&&sig(list[0])===row.current,'missing/changed Stage40 authoritative provider '+id);
  const mounted=picks(b,id);
  need(mounted.length>0&&mounted.every(v=>sig(v.asset)===row.current),'wrong Stage40 mounted provider '+id);
  have[id]=mounted.length;
 }
 if(mode==='author')need(a.persist()===true,'Stage40 normal persist failed');
 const text=localStorage.getItem(key),s=JSON.parse(text).honroBattle;
 need(valid(s)&&!HonroCampaignMapRevision.obsolete(s),'saved Stage40 check failed');
 for(const id of ids){
  const mounted=picks(s,id);
  need(mounted.length===have[id]&&mounted.every(v=>v.asset.honroStaticAssetRef===1&&v.asset.id===id&&v.asset.signature===registry[id].current),'wrong Stage40 compact reference '+id);
 }
 if(mode==='author')return {text,state:state(s),have};
 need(same(state(s),state(b)),'restored Stage40 runtime state differs from snapshot');
 // Registry aliases on copies of this known good save are diagnostics, not sourced historical saves.
 const diagnostic={};
 for(const id of ids){
  const r=registry[id];
  diagnostic[id]=[r.previous,...r.previousOptimized].map(old=>{
   const d=structuredClone(s);for(const v of picks(d,id))v.asset.signature=old;
   return [old,HonroProfileStore.restoreBattleArt(d)&&picks(d,id).every(v=>sig(v.asset)===r.current)];
  });
  const bad=structuredClone(s);picks(bad,id)[0].asset.signature='4:deadc0de';const before=JSON.stringify(bad);
  diagnostic[id].push(['unknown-rejected-atomically',!HonroProfileStore.restoreBattleArt(bad)&&JSON.stringify(bad)===before]);
  need(diagnostic[id].every(([,ok])=>ok),'Stage40 exact previous signature gate regressed '+id);
 }
 return {sameState:true,have,diagnostic};
}"""
def stage40_cross(br,hosts,graphs,dev,current):
 m=json.loads((proofdir/'NORMAL-GRAPH.json').read_bytes());w=m['stage40ProtectedSHA256'];old=P['beforeCommon5']['path']
 source={**source_routes('CURRENT',graphs['CURRENT']),**w,old:sha((current/old).read_bytes())}
 source.pop(P['arms']['B']['map']);source.pop(P['arms']['B']['provider'])
 target={**source_routes('NEW',graphs['NEW']),**w,**{k:v for k,v in m['bootstrapStage40'].items() if k.startswith('web/')}}
 target.pop(P['arms']['B']['map']);target.pop(m['packet'])
 args={'key':KEY,'registry':P['stage40']['registry']}
 host=hosts['CURRENT'];c,p,seen,errors=visit_init(br,host,dev,source)
 try:
  p.evaluate(O['LAUNCH'],40);wait_aim(p);s=p.evaluate(STAGE40,{**args,'mode':'author'})
  record=q['stage40Continue'][dev]={'inputSave':uploadfact(s['text']),'sources':wire(host,source,seen,errors)};save()
 finally:c.close()
 host=hosts['NEW'];c,p,seen,errors=visit_init(br,host,dev,target,s['text'])
 try:
  ensure(p.evaluate('(k)=>localStorage.getItem(k)',KEY)==s['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'Stage40 not pre-Continue')
  p.evaluate(TAP);btn=p.locator('.title-actions button[data-action="continue"]').first
  btn.wait_for(state='visible',timeout=12000);btn.click();wait_aim(p)
  r=p.evaluate(STAGE40,{**args,'mode':'verify'})
  ensure(p.evaluate("()=>window.__honroContinueTap")=={'launches':0,'mounts':1},'Stage40 not a true cold Continue')
  record.update(r);record['wires']=wire(host,target,seen,errors);save()
 finally:c.close()
if __name__=='__main__':
 ensure(P['enabled'] is True,'disabled: no browser requests')
 ensure(sha((D/'observer.json').read_bytes())==P['observerSHA256'],'unreviewed deterministic observer')
 from playwright.sync_api import sync_playwright
 from PIL import Image
 pre,a6,bf,current,n,proofdir=map(lambda s:Path(s).resolve(),sys.argv[1:])
 graphs={'PREA':signaturefiles(pre,'PREA'),'A6':signaturefiles(a6,'A6'),'BF6':signaturefiles(bf,'BF6'),'CURRENT':signaturefiles(current,'CURRENT'),'NEW':json.loads((proofdir/'NORMAL-GRAPH.json').read_bytes())['routeSHA256']}
 stamps={'PREA':P['history342']['signature'],'A6':P['arms']['A']['owner'],'BF6':P['arms']['BF6']['owner'],'CURRENT':P['arms']['B']['owner'],'NEW':P['full']['signature']}
 q={'status':'HOLD','scope':'Ordinary native build and genuine cold title Continue of disposable same-stage profiles. Saves only in memory/browser contexts, no deployment, no rollback guarantee.','visits':{},'visualComparison':{},'coldContinue':{},'stage40Continue':{},'errors':{}}
 save()
 try:
  with contextlib.ExitStack() as stack:
   hosts={k:stack.enter_context(server(root))for k,root in {'PREA':pre,'A6':a6,'BF6':bf,'CURRENT':current,'NEW':n}.items()}
   playwright=stack.enter_context(sync_playwright());br=playwright.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    ensure(br.version==P['chrome'],'wrong actual browser')
    for dev in ('PC','M'):
     saves={}
     for arm in ('PREA','A6','BF6','CURRENT','NEW'):
      try:author(br,hosts,graphs,stamps,dev,arm,saves)
      except Exception:mark_failed('author-'+dev+'-'+arm)
     for arm in ('PREA','A6','BF6','CURRENT','NEW','MIGRATED'):
      try:cold(br,hosts,graphs,stamps,dev,arm,saves)
      except Exception:mark_failed('continue-'+dev+'-'+arm)
     try:stage40_cross(br,hosts,graphs,dev,current)
     except Exception:mark_failed('continue-stage40-'+dev)
   finally:br.close()
  ensure(not q['errors'],'one or more lanes failed (partial native evidence retained)')
  ensure(len(q['visits'])==10 and all('wires' in x for x in q['visits'].values()),'source save authority missing')
  ensure(len(q['coldContinue'])==12 and all('wires' in x for x in q['coldContinue'].values()),'saved lineage missing')
  ensure(len(q['visualComparison'])==8 and all(all(i['priorFixtureDecodedRGBAExact'].values()) for i in q['visualComparison'].values()),'normal build differs from reviewed fixture native frames (all stored)')
  ensure(len(q['stage40Continue'])==2 and all(x.get('sameState') and x.get('wires') for x in q['stage40Continue'].values()),'Stage40 protected save cross-check missing')
  q['status']='PASS_NORMAL_FULL_CURRENT_AND_PRIOR_ACTUAL_CONTINUE_NO_DEPLOY_ROLLBACK_PENDING'
 except Exception:
  q.setdefault('firstFailure',traceback.format_exc(limit=8));raise
 finally:save()
