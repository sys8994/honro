"""Actual cold Continue, native return-title save, and a second cold Continue on public 0b9."""
import hashlib,json,sys,urllib.request
from urllib.parse import urlsplit
from pathlib import Path
from playwright.sync_api import sync_playwright
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());O=json.loads((D/'observer.json').read_bytes())
R=P['release'];pub=P['public']['root']; KEY='honro-first-act-profile-1';w=Path(sys.argv[1]);out=w/'out';out.mkdir(exist_ok=True)
q={'status':'HOLD','source':'official pinned 72dd and 733 native historical HTML and public 0b9; isolated test saves; prior Stage32 exact retired providers appended invisibly for fixture only','paths':{}}
def save():(out/'NATIVE-PUBLIC-SAVE.json').write_text(json.dumps(q,indent=2)+'\n')
def n(x,e):
 if not x:raise RuntimeError(e)
def f(x):return {'bytes':len(x),'sha256':hashlib.sha256(x).hexdigest()}
CORE=r"""
 const own=(b)=>[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]];
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
 const valid=(b,n)=>b&&b.honroStage===n&&!b.honroCustom&&b.honroCanonical&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&(n===32?b.honroAct4Official===1:b.honroAct5===1);
 const collect=(b,ids,compacted)=>Object.fromEntries(ids.map(id=>{
   const a=own(b).filter(v=>v.asset?.id===id).map(v=>v.asset);
   if(!a.length||a.some(v=>compacted?(v.honroStaticAssetRef!==1||!v.signature):!v.vector))throw Error('actual saved/restored owner missing or wrong type '+id);
   const x=[...new Set(a.map(v=>compacted?v.signature:sig(v)))];if(x.length!==1)throw Error('mixed ref identity '+id);return [id,x[0]];
 }));
 const state=b=>({terrain:JSON.stringify(b.terrain),units:JSON.stringify(b.units),objective:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),phase:b.phase,round:b.round,revision:b.honroCampaignMapRevision??null});
"""
SHOWN_SAVE='arg=>{'+CORE+r"""
 const a=HonroApp,e=a.engine,b=e?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked||a.training||a.done||a.screen!=='battle'||typeof a.showTitle!=='function')throw Error('native active battle required');
 const before=b.honroLandmarks;
 if(arg.inject.length){
  if(arg.stage!==32)throw Error('out-of-scope diagnostic assets');
  const from=before.find(v=>v.id==='approved32-body'&&v.asset.id==='act4-handoff:32:body-joined');
  if(!from)throw Error('missing exact historical stage32 native placement');
  const ids=new Set(arg.inject),assets=HONRO_PROJECT.library.filter(v=>ids.has(v.id));
  if(assets.length!==ids.size||assets.some(v=>!v.vector||v.collision?.length||v.interactionType))throw Error('not exact nonphysical historical providers');
  b.honroLandmarks=[...before,...assets.map(asset=>({...from,id:'qa-public-st32-old:'+asset.id,opacity:0,asset}))];
 }
 const initial=state(b);
 try{
  a.showTitle();
  if(a.engine||a.scene||a.screen!=='title'||a.profileStore.locked)throw Error('actual title save boundary not reached');
  const text=localStorage.getItem(arg.key),saved=JSON.parse(text).honroBattle;
  if(!valid(saved,arg.stage)||HonroCampaignMapRevision.obsolete(saved)||JSON.stringify(state(saved))!==JSON.stringify(initial))throw Error('native saved snapshot differs from live physical battle');
  return {text,refs:collect(saved,arg.ids,true),state:initial};
 }finally{b.honroLandmarks=before;}
}"""
CHECK='arg=>{'+CORE+r"""
 const a=HonroApp,b=a.engine?.b;
 if(!valid(b,arg.stage)||a.profileStore.locked||a.screen!=='battle')throw Error('not canonical resumed actual stage');
 return {refs:collect(b,arg.ids,false),state:state(b),historic32:own(b).filter(x=>String(x.id).startsWith('qa-public-st32-old:')).length,
    namespaced32:HONRO_PROJECT.library.some(x=>String(x.id).startsWith('act4compat32:v1:'))};
}"""
NEG=r"""arg=>{
 const s=JSON.parse(arg.text).honroBattle, allowed=arg.relevant;
 const own=b=>[...b.honroLandmarks||[],...b.honroElements||[],...b.honroEnvironment?.placements||[]].find(z=>allowed.includes(z.asset?.id));
 const checks={stage:b=>b.honroStage=arg.stage===32?33:41,workshop:b=>b.honroMapOrigin='workshop',custom:b=>b.honroCustom=true,unofficial:b=>b[arg.stage===32?'honroAct4Official':'honroAct5']=0,unknown:b=>own(b).asset.signature+='0'};
 return Object.fromEntries(Object.entries(checks).map(([k,fn])=>{const b=structuredClone(s);fn(b);const before=JSON.stringify(b);return [k,!HonroProfileStore.restoreBattleArt(b)&&before===JSON.stringify(b)];}));
}"""
def stage_store_guard(base,profile):
 target=urlsplit(base+'HONRO.html')
 n(target.scheme=='https' and target.netloc=='sys8994.github.io' and target.path=='/honro/HONRO.html','refuse fixture writes outside exact anonymous QA document')
 return 'if (window === window.top && location.origin === '+json.dumps(target.scheme+'://'+target.netloc)+' && location.pathname === '+json.dumps(target.path)+') { localStorage.setItem('+json.dumps(KEY)+','+json.dumps(profile)+'); }'
def opened(br,n0,device,arm,profile=None):
 v=P['history'][str(n0)] if arm=='old' else P['public']
 base=f"http://127.0.0.1:{v['port']}/" if arm=='old'else pub
 checks=v['routes'] if arm=='old'else v['routes'][str(n0)]
 width,height=(1440,900) if device=='PC'else(390,844)
 c=br.new_context(viewport={'width':width,'height':height},device_scale_factor=1,service_workers='block')
 n(c.storage_state()=={'cookies':[],'origins':[]},'not genuinely isolated storage')
 c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 if profile is not None:c.add_init_script(stage_store_guard(base,profile))
 p=c.new_page();rs={};req=[];err=[]
 p.on('response',lambda r:rs.setdefault(r.url.split('?',1)[0],r) if r.url.split('?',1)[0] in {base+k for k in {*checks,P['legacy']['path']}}else None)
 p.on('request',lambda r:req.append(r.url.split('?',1)[0]))
 p.on('pageerror',lambda e:err.append(str(e)))
 try:
  nav=p.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  n(nav and nav.status==200 and nav.url==base+'HONRO.html' and not nav.from_service_worker and f(nav.body())==v['shell'],'real historical or live native shell wrong')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  return c,p,(base,checks,rs,req,err)
 except Exception:c.close();raise
def http(v,needcount):
 base,checks,rs,req,e=v
 n(not e,'native page error: '+repr(e))
 a=P['legacy']['path'];count=req.count(base+a)
 n(count==needcount,'Stage32 archive actual fetch expected '+str(needcount)+' got '+str(count))
 if count:checks={**checks,a:P['legacy']['fact']}
 proof={}
 for k,x in checks.items():
  r=rs.get(base+k)
  n(r and r.status==200 and not r.from_service_worker and f(r.body())==x,f'actual browser authority {k}')
  proof[k]=x
 return {'archiveGETs':count,'requiredHTTP':proof}
def native_source(br,n0,dev,arm,inject,expect):
 c,p,v=opened(br,n0,dev,arm)
 try:
  p.evaluate(O['LAUNCH'],n0)
  row=p.evaluate(SHOWN_SAVE,{'stage':n0,'inject':inject,'ids':list(expect),'key':KEY})
  n(row['refs']==expect,'actual source title save provider mismatch')
  return row,{'digest':f(row['text'].encode()),'refs':row['refs'],'phase':row['state']['phase'],'round':row['state']['round'],'HTTP':http(v,0),'boundary':'native showTitle -> stopBattle -> localStorage'}
 finally:c.close()
def recover(br,n0,dev,row,expect,archive,neg=False,resave=False):
 c,p,v=opened(br,n0,dev,'public',row['text'])
 try:
  seed=p.evaluate("key=>localStorage.getItem(key)",KEY)
  n(isinstance(seed,str) and f(seed.encode())==f(row['text'].encode()),'native cold document never read exact injected test save bytes')
  n(p.evaluate("(n)=>!HonroApp.profileStore.locked&&!HonroApp.engine&&HonroApp.profile.honroBattle?.honroStage===n",n0),'candidate cold local saved stage missing')
  p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
  p.wait_for_function("(n)=>HonroApp.engine?.b?.honroStage===n&&!HonroApp.profileStore.locked",arg=n0,timeout=20000)
  data=p.evaluate(CHECK,{'stage':n0,'ids':list(expect)})
  n(data['refs']==expect and data['state']==row['state'],'actual cold resume changed terrain/units/objective/round/phase/provider')
  n(data['historic32']==(3 if archive else 0) and data['namespaced32']==bool(archive),'historical Stage32 nonce was not isolated')
  sample={'coldStoredScopeVerified':True,'coldStoredSHA256':f(seed.encode())['sha256'],'refs':data['refs'],'round':data['state']['round'],'phase':data['state']['phase'],'revision':data['state']['revision'],'physics':{k:f(data['state'][k].encode())for k in ('terrain','units','objective')}}
  if neg:
   bad=p.evaluate(NEG,{'text':row['text'],'relevant':list(P['stages']['32']['specialHistoricalFixtureIDs']) if archive else list(expect),'stage':n0})
   n(all(bad.values()),'out-of-scope prior alias accepted '+repr(bad));sample['negatives']=bad
  if resave:
   next=p.evaluate(SHOWN_SAVE,{'stage':n0,'inject':[],'ids':list(expect),'key':KEY})
   n(next['refs']==expect and next['state']==row['state'],'native return-title re-save did not write expected signatures or snapshot')
   sample['reSave']={'digest':f(next['text'].encode()),'refs':next['refs'],'nativeBoundary':True}
  else:next=None
  sample['HTTP']=http(v,archive)
  return next,sample
 finally:c.close()
save()
try:
 n(P['enabled'] and pub=='https://sys8994.github.io/honro/','public scope not bound')
 u=pub+'web/manifest.json'
 with urllib.request.urlopen(urllib.request.Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=45)as r:
  raw=r.read(R['manifest']['bytes']+1)
  n(r.status==200 and r.geturl()==u and f(raw)==R['manifest'] and hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()==P['manifestGit'],'exact live immutable manifest wrong')
  q['manifest']=f(raw)
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True);q['chromium']=b.version;n(b.version=='151.0.7922.34','wrong official browser')
  for n0 in (32,42):
   spec=P['stages'][str(n0)]
   for dev in ('PC','M'):
    dest=q['paths'][f'{n0}-{dev}']={};save()
    current=spec['activeRef'];inj=spec.get('specialHistoricalFixtureIDs',{})
    previous={**current,**inj} if n0==32 else spec['previousRef']
    for label,arm,ids,expect in [('old','old',list(inj),previous),('current','public',[],current)]:
     s0,origin=native_source(b,n0,dev,arm,ids,expect)
     dst=dest[label]={'source':origin};save()
     want={**current,**inj} if label=='old' and n0==32 else current
     arc=int(bool(ids))
     s1,first=recover(b,n0,dev,s0,want,arc,neg=label=='old',resave=True)
     dst['coldResumeAndTitleReSave']=first;save()
     _,again=recover(b,n0,dev,s1,want,arc)
     dst['reSavedSecondColdResume']=again;save()
  b.close()
 q['status']='PASS_PUBLIC_STAGE32_STAGE42_OLD_CURRENT_NATIVE_RESAVE_AND_SECOND_COLD_PC_M'
except Exception as e:q['failure']=repr(e);raise
finally:save()
