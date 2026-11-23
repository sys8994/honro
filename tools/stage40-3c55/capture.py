from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from urllib.parse import urlsplit
import base64,hashlib,json,os,statistics,sys,threading
from playwright.sync_api import sync_playwright
from guard import P,need,fact,request,save
D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes())
KEY='honro-first-act-profile-1'
S=P['savePins']
ARG={'key':KEY,'stage':40,'ids':list(S['old']),'rows33':{}}
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
COMMON=r"""
 const collections=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements];
 const own=(b,arg)=>collections(b).flatMap(q=>(q||[]).filter(x=>arg.ids.includes(x.asset?.id)));
 const valid=(b,n)=>Boolean(b&&b.honroStage===n&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.mode==='campaign'&&(n===40?b.honroAct4Official===1:b.honroAct5===1));
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const content=b=>({terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),objective:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),phase:b.phase,round:b.round,
   revision:b.honroCampaignMapRevision??null,handled:collections(b).map(a=>(a||[]).filter(x=>x.asset?.id).map(({asset,...keep})=>[asset.id,keep]))});
"""
PERSIST='arg=>{'+COMMON+r"""
 const a=HonroApp;let b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('no legitimate exact native battle');
 if(a.persist()!==true)throw Error('normal save refused');
 const source=localStorage.getItem(arg.key),saved=JSON.parse(source),s=saved.honroBattle;
 if(!valid(s,arg.stage)||HonroCampaignMapRevision.obsolete(s))throw Error('actual persisted battle not saved/campaign obsolete');
 const list=own(s,arg);const rows={};for(const v of list){
   const a=v.asset;if(a.honroStaticAssetRef!==1)throw Error('target live owner did not compact into approved provider ref');
   if(rows[a.id]&&rows[a.id]!==a.signature)throw Error('one asset resolved multiple signatures');rows[a.id]=a.signature;
 }
 if(arg.ids.some(k=>!rows[k]))throw Error('missing actual old provider refs');
 return {text:source,refs:rows,state:content(s),placementOwners:list.length};
}"""
CHECK='arg=>{'+COMMON+r"""
 const a=HonroApp,b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked)throw Error('actual app did not mount a canonical saved battle');
 const rows={};for(const k of arg.ids){const source=HONRO_PROJECT.library.filter(r=>r.id===k);if(source.length!==1)throw Error('nonunique live provider');
   const l=own(b,arg).filter(i=>i.asset.id===k);
   if(!l.length)throw Error('absent restored live provider');rows[k]={current:sig(source[0]),rendered:l.map(i=>sig(i.asset))};
 }
 const r33=Object.fromEntries(Object.keys(arg.rows33).map(k=>[k,HONRO_PREVIOUS_TERRAIN_ART[k]]));
 return {state:content(b),rows,r33};
}"""
# App.continue() restores a clone to the live engine, not to the loaded profile.
# App.showTitle() calls normal stopBattle() which snapshots that live battle and saves it.
TITLE_SAVE='arg=>{'+COMMON+r"""
 const a=HonroApp;const b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked||a.screen!=='battle'||a.training||a.done)throw Error('stock title save unavailable in this state');
 const before=localStorage.getItem(arg.key);a.showTitle();
 const source=localStorage.getItem(arg.key),after=JSON.parse(source),s=after.honroBattle;
 const refs={};let entries=0;for(const v of own(s,arg)){
  if(v.asset.honroStaticAssetRef!==1)continue;
  entries++;if(refs[v.asset.id]&&refs[v.asset.id]!==v.asset.signature)throw Error('conflicting re-saved provider references');
  refs[v.asset.id]=v.asset.signature;
 }
 return {text:source,refs,state:content(s),placed:entries,path:{screen:a.screen,noMountedEngine:a.engine===null,storageChanged:source!==before,canonicalPersisted:valid(s,arg.stage),storeReady:a.profileStore.state.kind==='ready'&&!a.profileStore.state.lastWriteError}};
}"""
READ_SAVE=PERSIST.replace(" if(a.persist()!==true)throw Error('normal save refused');","")
TIMING=r"""()=>{
 const a=HonroApp,L=HonroCampaignLoader,proto=HonroScene.prototype,P=HonroAct4TerrainPreview;
 if(a.screen!=='title'||a.engine||a.profile.honroBattle||L.has(40))throw Error('not cold native title');
 for(let n=1;n<40;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(40).entryLevel);
 a.audio?.configure?.(a.profile.settings);
 const rec={snapshots:[],profileWrites:[],ensures:[],first:null,followingRAF:null};
 const nativePersist=a.persist, cleanup=[];
 function tap(o,k,f){
   const original=o[k],d=Object.getOwnPropertyDescriptor(o,k);
   if(typeof original!=='function')throw Error('missing native boundary '+k);
   const w=function(...args){return f(original,this,args);};
   o[k]=w;if(o[k]!==w)throw Error('cannot observe '+k);
   cleanup.push(()=>{if(o[k]!==w)throw Error('observer replaced '+k);if(d)Object.defineProperty(o,k,d);else delete o[k];});
 }
 function sync(rows,args,fn,t,fields={}) {
   const row={...fields,start:performance.now()};
   try{const result=Reflect.apply(fn,t,args);if(typeof result==='boolean')row.returned=result;return result;}
   finally{row.end=performance.now();rows.push(row);}
 }
 tap(P,'snapshot',(fn,t,args)=>sync(rec.snapshots,args,fn,t,{compactArt:args[1]?.compactArt===true}));
 tap(a.profileStore,'save',(fn,t,args)=>sync(rec.profileWrites,args,fn,t));
 tap(L,'ensureStage',(fn,t,args)=>{
   if(args[0]!==40)return Reflect.apply(fn,t,args);
   const row={start:performance.now(),before:t.has(40)};rec.ensures.push(row);
   const v=Reflect.apply(fn,t,args);Promise.resolve(v).then(()=>{row.end=performance.now();},()=>{row.failed=true;});return v;
 });
 tap(proto,'render',(fn,t,args)=>{
   const b=args[0]?.b;
   if(rec.first||b?.honroStage!==40||t.canvas?.id!=='battlecanvas')return Reflect.apply(fn,t,args);
   const start=performance.now(),v=Reflect.apply(fn,t,args),end=performance.now();
   rec.first={start,end,round:b.round,phase:b.phase,mode:b.mode,
      canonical:b.honroCanonical===true&&b.honroCustom===false&&b.honroAct4Official===1,
      canvas:[t.canvas.width,t.canvas.height],camera:[t.x,t.y,t.scale]};
   requestAnimationFrame(()=>{rec.followingRAF=performance.now();for(const f of cleanup.reverse())f();});
   return v;
 });
 if(a.persist!==nativePersist)throw Error('native persist identity changed');
 Object.defineProperty(window,'__stage40ExactCold',{value:rec});
 rec.launch=performance.now();a.launch(40);rec.launchCallReturn=performance.now();
}"""
def main(w):
 need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'credential in public browser')
 out=w/'out';signed=json.loads((w/'SIGNED.json').read_bytes())
 result={'publicStatus':'HOLD','timingStatus':'HOLD','timingScope':'a6 and 3c same-runner detached normal bundles, fresh browser contexts; no CDP throttle, no prefetch/early ensure, no dialogue skip or camera hooks; small synchronous instrumentation adds overhead and does not measure total CPU or GPU','public':{},'timing':[]}
 def flush():save(out/'STAGE40.json',result)
 flush()
 def attempt(k,fn):
  try:fn()
  except Exception as e:
   # Do not leak evaluated values, individual profiles, or third-party URLs.
   result[k+'Failure']={'type':type(e).__name__,'diagnostic':str(e).splitlines()[0][:250]}
   flush()
 with ExitStack()as es,sync_playwright()as pw:
  ports={'A':18964,'B':18965,'H':18963}
  for k,port in ports.items():
   handler=partial(SimpleHTTPRequestHandler,directory=str(w/k))
   srv=es.enter_context(ThreadingHTTPServer(('127.0.0.1',port),handler));srv.daemon_threads=True
   threading.Thread(target=srv.serve_forever,daemon=True).start();es.callback(srv.shutdown)
  url={k:f'http://127.0.0.1:{port}/'for k,port in ports.items()};url['P']=P['public']
  browser=pw.chromium.launch(headless=True);es.callback(browser.close)
  result['browser']=browser.version;result['sampleProfiles']={'PC':[1440,900,1],'M':[390,844,1]}
  need(browser.version=='151.0.7922.34','browser version drift')
  def context(k,wh,parked=False,snap=None):
   c=browser.new_context(viewport={'width':wh[0],'height':wh[1]},device_scale_factor=1,service_workers='block')
   p=None;rows={};errors=[]
   try:
    need(c.storage_state()=={'cookies':[],'origins':[]},'fresh context not empty')
    c.add_init_script(O['INIT_SEED'])
    if parked:c.add_init_script('('+O['INIT']+')()')
    if snap is not None:
     need(k=='P','save seed only allowed on live release')
     origin=urlsplit(url[k]);prefix=origin.path
     c.add_init_script('if(location.origin==='+json.dumps(origin.scheme+'://'+origin.netloc)+'&&location.pathname==='+json.dumps(prefix+'HONRO.html')+')localStorage.setItem('+json.dumps(KEY)+','+json.dumps(snap)+');')
    p=c.new_page()
    p.on('pageerror',lambda e:errors.append(type(e).__name__))
    p.on('response',lambda r:rows.setdefault(r.url,r))
    nav=p.goto(url[k]+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.status==200 and nav.url==url[k]+'HONRO.html'and not nav.from_service_worker,'invalid navigation '+k)
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    if parked:p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
    elif snap is None:p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;}")
    return c,p,rows,errors,nav
   except BaseException:
    c.close();raise
  def closure(k,rows,nav):
   an=signed['B' if k=='P' else k];need(fact(nav.body())==an['shell'],'wrong actual shell '+k)
   for path,f in an['routes'].items():
    x=rows.get(url[k]+path)
    need(x and x.status==200 and not x.from_service_worker and fact(x.body())==f,'actual route not exact '+k+' '+path)
   return sorted(an['routes'])
  def wait(p):p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===40&&!HonroApp.profileStore.locked",timeout=45000)
  def state(s):return {k:sha(s[k])for k in ('terrain','units','objective')}
  def screenshot(p,tag,label):
   meta=p.evaluate(O['FROZEN'],{'id':40,'mapId':'stage-40','name':'ordinary','dx':0,'dy':0,'ordinary':[1510,2120,.55 if tag=='PC' else .42],'readback':False,'fixedNow':O['PHASE']})['meta']
   meta['physics']=sha(meta.pop('signature'));p.evaluate(O['DECODE'])
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);path=tag+'-'+label+'.png';(out/path).write_bytes(raw)
   return {'file':path,'fact':fact(raw),'pose':meta}
  devices={'PC':(1440,900),'M':(390,844)}
  def continuation():
   request(url['P']+'web/manifest.json',signed['B']['manifest'])
   for tag,wh in devices.items():
    row=result['public'][tag]={};fixture={}
    for arm,label in [('H','old733'),('P','current3c55')]:
     c,p,rows,errors,nav=context(arm,wh,True)
     try:
      p.evaluate(O['LAUNCH'],40);wait(p)
      # Historical fixture uses approved native persist. Current case reads what launch itself wrote.
      v=p.evaluate(PERSIST if arm=='H' else READ_SAVE,ARG);expected=S['old' if arm=='H'else'new']
      need(v['refs']==expected and state(v['state'])==S['stateShas'] and not errors,'failed genuine native save '+tag+' '+label)
      fixture[label]=v;row[label]={'save':fact(v['text'].encode()),'refs':v['refs'],'state':state(v['state']),'routes':closure(arm,rows,nav)}
      flush()
     finally:c.close()
    for label in ('old733','current3c55','resaved-current'):
     src=fixture[label]
     c,p,rows,errors,nav=context('P',wh,True,src['text'])
     try:
      need(p.evaluate("(key)=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)&&localStorage.getItem(key)!==null",KEY),'authentic stored cold seed absent')
      need(sha(p.evaluate("(key)=>localStorage.getItem(key)",KEY))==sha(src['text']),'cold stored fixture differs')
      p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}");wait(p)
      rs=p.evaluate(CHECK,ARG)
      need(rs['state']==src['state'] and state(rs['state'])==S['stateShas']and not errors,'public Continue changed canonical state '+tag+' '+label)
      need(all(rs['rows'][k]['current']==v and rs['rows'][k]['rendered']and all(q==v for q in rs['rows'][k]['rendered'])for k,v in S['new'].items()),'public Continue wrong provider')
      raw=screenshot(p,tag,label)
      row[label+'Continue']={'state':state(rs['state']),'refs':rs['rows'],'raw':raw,'routes':closure('P',rows,nav)}
      if label=='old733':
       z=p.evaluate(TITLE_SAVE,ARG)
       need(z['path']=={'screen':'title','noMountedEngine':True,'storageChanged':True,'canonicalPersisted':True,'storeReady':True}and z['refs']==S['new']and z['state']==src['state'],'normal title save failed')
       fixture['resaved-current']=z;row['nativeTitleResave']={'digest':fact(z['text'].encode()),'refs':z['refs'],'state':state(z['state']),'path':z['path']}
      flush()
     finally:c.close()
    shots=[row[k+'Continue']['raw']for k in ('old733','current3c55','resaved-current')]
    need(all(x['pose']==shots[0]['pose']for x in shots),'same parked scene not preserved')
    row['parkedSamePNG']=all(x['fact']==shots[0]['fact']for x in shots)
   result['publicStatus']='PASS_REAL_PUBLIC_733_AND_CURRENT_COLD_AND_NATIVE_TITLE_RESAVE_PC_M';flush()
  def timing():
   for tag,wh in devices.items():
    for i in range(3):
     for arm in ('AB' if i%2==(0 if tag=='PC'else 1) else 'BA'):
      c,p,rows,errors,nav=context(arm,wh)
      try:
       p.evaluate(TIMING)
       p.wait_for_function("()=>window.__stage40ExactCold?.followingRAF!==null&&Boolean(window.__stage40ExactCold?.ensures[0]?.end)",timeout=60000)
       t=p.evaluate("()=>window.__stage40ExactCold")
       f=t['first'];en=t['ensures'];sn=t['snapshots'];wr=t['profileWrites']
       need(f['canonical']and f['mode']=='campaign'and f['round']==1 and not errors and all(x>0 for x in f['canvas']),'invalid real first battle frame')
       need(len(en)==1 and en[0]['before']is False and len(sn)==len(wr)==2 and all(x['compactArt']==(arm=='B')for x in sn) and all(x['returned']is True for x in wr),'launch boundary did not match two native saves')
       need(t['launch']<=en[0]['start']<en[0]['end']<=sn[0]['start']<sn[0]['end']<=wr[0]['start']<wr[0]['end']<=sn[1]['start']<sn[1]['end']<=wr[1]['start']<wr[1]['end']<=f['start']<f['end']<=t['followingRAF'],'native sequence/timestamp order')
       samples={'launchToFirstRenderEnd':f['end']-t['launch'],'launchToNextRAF':t['followingRAF']-t['launch'],'firstRenderSync':f['end']-f['start'],'ensureWall':en[0]['end']-en[0]['start'],'afterEnsureToFirstRenderEnd':f['end']-en[0]['end']}
       for a in range(2):
        samples['snapshot'+str(a+1)]=sn[a]['end']-sn[a]['start']
        samples['profileSave'+str(a+1)]=wr[a]['end']-wr[a]['start']
        samples['snapshotThroughSave'+str(a+1)]=wr[a]['end']-sn[a]['start']
       result['timing'].append({'arm':arm,'device':tag,'pair':i+1,'raw':t,'ms':samples,'actualSignedRoutes':closure(arm,rows,nav)})
       flush()
      finally:c.close()
   need(len(result['timing'])==12,'unpaired samples')
   for tag in devices:
    for i in range(1,4):
     pair=[x for x in result['timing']if x['device']==tag and x['pair']==i]
     need(len(pair)==2 and {x['arm']for x in pair}=={'A','B'},'invalid balanced pair')
     a,b=[x['raw']['first']for x in pair];need(all(a[k]==b[k]for k in ('canonical','mode','round','phase','canvas')),'paired launch frame mismatch')
     need(all(abs(x-y)<=(.05 if j<2 else 1e-5)for j,(x,y)in enumerate(zip(a['camera'],b['camera']))),'first native camera not matched')
   groups={}
   for tag in devices:
    groups[tag]={}
    for k in ('A','B'):
     rows=[r['ms']for r in result['timing']if r['arm']==k and r['device']==tag]
     groups[tag][k]={field:[statistics.median(q[field]for q in rows),min(q[field]for q in rows),max(q[field]for q in rows)]for field in rows[0]}
   result['timingStatus']='PASS_THREE_PAIRED_COLD_RUNS_EACH_PC_M_NO_PERF_THRESHOLD';result['timingMsMedianMinMax']=groups;flush()
  attempt('public',continuation)
  attempt('timing',timing)
 need(result['publicStatus'].startswith('PASS_')and result['timingStatus'].startswith('PASS_'),'Stage40 QA HOLD; see separate section receipts')
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
