"""Native disposable PC/M diagnostic, never a release. Save bytes only in memory."""
import base64,hashlib,io,json,math,statistics,sys
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from prepare import P,T,need,pin,output
w=Path(sys.argv[1]); out=w/'out'; overlay=(w/'one-temporary-module.js').read_bytes()
O=json.loads((T/'observer.json').read_bytes());KEY='honro-first-act-profile-1'
HOST={'current':'http://127.0.0.1:18962/','historical':'http://127.0.0.1:18961/'}
q={'status':'HOLD','samples':[],'compares':{},'resumes':{},'negative':{},'rawSaveExported':False,
   'method':'Actual Chrome, pinned ordinary app and in-browser disposable localStorage; no user data, only one exact loopback response overlay. Performance is instrumented local QA, not production or GPU timing.'}
def report():output(out/'CLOSE-QA.json',q)
def digest(s):return pin(s.encode('utf-8','surrogatepass'))
def equal_bytes(a,b,msg):need(a==b,msg)
hook=r"""(p=>{
 if(location.origin!==p.origin)return;
 if(p.seed!==null)Storage.prototype.setItem.call(localStorage,p.key,p.seed);
 const original=Storage.prototype.setItem,rows=[];
 const audit={rows,fast:0,reached:0,snapshotCalls:0};
 const wrap=function(k,v){const ret=Reflect.apply(original,this,arguments);
   if(this===localStorage&&k===p.key){if(typeof v!=='string')throw Error('unexpected real persist input type');rows.push(v);}
   return ret;};
 Object.defineProperty(Storage.prototype,'setItem',{...Object.getOwnPropertyDescriptor(Storage.prototype,'setItem'),value:wrap});
 Object.defineProperty(window,'__s46CloseAudit',{value:audit,configurable:false});
})"""
# Source identified by exact chunk signature and scopes; no replacement of story/launch/persistence.
# Only the exported snapshot function gets a transparent in-browser count and return.
LAUNCH=r"""async q=>{
 const a=HonroApp,t=__s46CloseAudit,marks={},now=()=>performance.now(),mark=k=>marks[k]=now();
 if(a.screen!=='title'||a.profileStore.locked||a.engine)throw Error('not clean real title');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;__honroResetDiagnosticSeed();
 mark('helperEnter');mark('ensureEnter');await HonroCampaignLoader.ensureStage(q.stage);mark('ensureResolved');
 for(let n=1;n<q.stage;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(q.stage).entryLevel);
 mark('progressionReady');mark('appLaunchEnter');const launch=a.launch(q.stage);mark('appLaunchReturn');
 const b=a.engine?.b;
 if((launch!=null&&typeof launch.then==='function')||b?.honroStage!==q.stage||b.mode!=='campaign'||b.honroCustom!==false||!b.honroCanonical||(q.stage===46&&!a.dialogue))
   throw Error('ordinary synchronous canonical mount with entry dialogue absent');
 const start=t.rows.length;const opening=localStorage.getItem(q.key),initialDialogue=a.dialogue;
 const byCall=[];
 const helper=HonroAct5.snapshot46Opening;
 if(q.historical?helper!==undefined:typeof helper!=='function')throw Error('wrong stock snapshot helper at this authority');
 // This observer adds one counter to both arms and does not change return/inputs.
 if(helper)HonroAct5.snapshot46Opening=function(...args){t.snapshotCalls++;const v=Reflect.apply(helper,this,args);if(v!==undefined)t.fast++;return v;};
 try{
  for(let n=0;n<40&&a.dialogue;n++){
   const from=t.rows.length,priorCalls=t.snapshotCalls,target=a.dialogue===initialDialogue&&a.dialogue.after==='entry';
   const enter=now();HonroStory.finish(a);const exit=now();
   byCall.push({enter,exit,newProfileWrites:t.rows.length-from,dialogueLeft:!!a.dialogue,
     initialEntryClosed:target&&a.dialogue!==initialDialogue,snapshotHelperCalls:t.snapshotCalls-priorCalls});
  }
 }finally{if(helper)HonroAct5.snapshot46Opening=helper;}
 if(a.dialogue||(q.stage===46&&!byCall.length))throw Error('entry dialogue remains');
 mark('dialogueFinished');a.close();HonroStoryFraming.clear(a.scene);mark('cleanupDone');
 if(b!==a.engine.b||b.round!==1||b.phase!=='aim')throw Error('unexpected gameplay or battle state');
 let outer=null;
 if(q.pose){
  mark('decodeStarted');const d=await eval('('+q.decode+')')();mark('decoded');if(d.failed.length)throw Error('registered image preparation failed');
  const draw=await eval('('+q.paint+')')(q.pose);
  const stats=performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin===location.origin&&q.stageStarts.includes(new URL(r.name).pathname.slice(1)));
  if(!stats.length||stats.some(r=>r.requestStart<=0))throw Error('actual initial Stage46 route timing missing');
  const start=Math.min(...stats.map(r=>r.requestStart));
  outer={draw,firstRegisteredDrawMs:draw.draw1-draw.draw0,firstRequestToEnsureResolvedMs:marks.ensureResolved-start,
       firstRequestToReadyMs:draw.ready-start,imageDecodeAfterHelperMs:marks.decoded-marks.cleanupDone};
 }
 return {outer,marks,byCall,counts:{before:start,during:t.rows.length-start,fast:t.fast,helper:t.snapshotCalls},
    opening,finishRows:t.rows.slice(start),startRows:t.rows.slice(0,start),disk:localStorage.getItem(q.key)};
}"""
AFTER=r"""async cfg=>{
 const a=HonroApp,s=a.scene,e=a.engine,b=e.b,[x,y,z]=[cfg.x,cfg.y,cfg.scale];
 const now=()=>performance.now(),tick=()=>new Promise(requestAnimationFrame);
 Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y,scale:z});
 HonroBounds.constrain(s,b);
 if(Math.abs(s.x-x)>1e-6||Math.abs(s.y-y)>1e-6||Math.abs(s.scale-z)>1e-6)throw Error('camera waypoint clamped');
 const geo=()=>{const r=s.canvas.getBoundingClientRect();return{css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],
  pose:{x:s.x,y:s.y,scale:s.scale},viewport:HonroBounds.viewport(s,r.width,r.height)};};
 await tick();const draw0=now();s.render(e,0,'',.6,false,0);const draw1=now();const before=geo();await tick();const ready=now();
 return {draw0,draw1,ready,before,after:geo(),dpr:devicePixelRatio};
}"""
RESUME=r"""arg=>{
 const a=HonroApp,b=a.engine?.b;
 if(a.profileStore.locked||a.screen!=='battle'||b?.honroStage!==46||b.honroCustom!==false||!b.honroCanonical||b.mode!=='campaign'||b.honroMapOrigin!=='campaign')
   throw Error('not actual Stage46 title Continue');
 const owners=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements].flatMap(rows=>(rows||[]).filter(z=>z.asset?.id==='act5:near:46'));
 const p=HONRO_PROJECT.library.filter(x=>x.id==='act5:near:46');if(p.length!==1)throw Error('missing authoritative registered source');
 const raw=JSON.stringify(p[0]);let h=2166136261;
 for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
 if(raw.length+':'+(h>>>0).toString(16)!==arg.provider)throw Error('wrong current restored provider');
 const slots=owners(b);
 if(slots.length!==arg.slots||slots.some(z=>z.asset.honroStaticAssetRef||JSON.stringify(z.asset)!==raw))throw Error('Continue did not restore exact current provider');
 return JSON.stringify({terrain:b.terrain,units:b.units,objectives:b.honroObjectives,goals:b.honroGoalState,round:b.round,phase:b.phase,active:b.active,
    width:b.width,height:b.height,slots:slots.map(({asset,...x})=>x)});
}"""
def state_snapshot(b):
 slots=[{k:v for k,v in z.items() if k!='asset'} for field in [b.get('honroLandmarks'),b.get('honroElements'),(b.get('honroEnvironment') or {}).get('placements')] for z in field or [] if (z.get('asset') or {}).get('id')=='act5:near:46']
 return {k:b[k] for k in ['terrain','units','round','phase','active','width','height']}|{'slots':slots,**{k:b[k] for k in ['honroObjectives','honroGoalState'] if k in b}}
def browser_context(ch,origin,dev,variant,seed=None):
 ct=ch.new_context(**P['devices'][dev],service_workers='block');host=HOST[origin];cfg=P[origin]
 ct.add_init_script('('+O['INIT']+')();'+O['INIT_SEED']+';'+hook+'('+json.dumps({'origin':host.rstrip('/'),'seed':seed,'key':KEY},ensure_ascii=True)+');')
 requests={};blocked=[];pageerr=[];response={}
 module=P['module'];expected=cfg['files']
 def route(r):
  a=r.request;u=urlsplit(a.url); p=u.path.lstrip('/')
  if not a.url.startswith(host) or a.method not in ('GET','HEAD'):
   blocked.append((u.scheme,u.hostname,a.method));r.abort();return
  requests[p]=requests.get(p,0)+1
  if origin=='current' and variant=='N' and p==module:
   if a.method!='GET' or a.url!=host+module:r.abort();return
   r.fulfill(status=200,content_type='application/javascript; charset=utf-8',body=overlay);return
  r.continue_()
 ct.route('**/*',route)
 p=ct.new_page()
 p.on('pageerror',lambda e:pageerr.append(type(e).__name__))
 p.on('response',lambda r:response.setdefault(r.url[len(host):],r) if r.url.startswith(host) and r.url[len(host):] in expected else None)
 p.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&window.HonroApp?.screen==='title'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=65000)
 def verify(stage):
  x=cfg['stages'][str(stage)];paths={'HONRO.html',cfg['campaign'],cfg['entry'],x['map'],x['packet'],*x['parts']}
  if origin=='current':paths.update((module,cfg['profileModule']))
  need(not blocked and not pageerr,'external/nonread request attempted or native page error')
  for k in paths:
   got=response.get(k)
   want=P['overlay'] if origin=='current' and variant=='N' and k==module else expected[k]
   need(got is not None and got.status==200 and not got.from_service_worker and pin(got.body())==want,'unexpected or absent real HTTP '+k)
  if origin=='current':need(all(requests.get(k)==1 for k in (module,cfg['profileModule'])),'stock/overlay and exact stock ProfileStore modules must each be requested once')
  return sorted(paths)
 return ct,p,verify
def saved(x,stage,provider=None):
 need(isinstance(x,str) and bool(x),'missing actual saved profile')
 b=json.loads(x)['honroBattle'];need(b['honroStage']==stage,'wrong actual saved stage')
 s=state_snapshot(b)
 if provider is not None:
  refs=[z['asset'] for f in [b.get('honroLandmarks'),b.get('honroElements'),(b.get('honroEnvironment') or {}).get('placements')] for z in f or [] if (z.get('asset') or {}).get('id')=='act5:near:46']
  need(len(refs)>=2 and all(a=={'honroStaticAssetRef':1,'signature':provider,'id':'act5:near:46'} for a in refs),'wrong real compact refs')
 return s
def pak(l,stage,head):
 cfg=P[head]; counts=l['counts']; r=l['finishRows']; p=l['startRows']
 need(len(r)==counts['during'] and len(p)==counts['before'] and p and (stage!=46 or r),'actual browser native write receipt absent')
 need(l['opening']==p[-1] and l['disk']==(r or p)[-1],'real immediate stored text differs from observed native writes')
 if stage==46:
  saved(l['opening'],stage,cfg['provider']);saved(l['disk'],stage,cfg['provider'])
  seen=[bool(json.loads(x)['seen'].get('rest-interlude-v1-46')) for x in [l['opening'],*r]]
  need(seen==[False,False,True], 'fresh Stage46 must preserve two ordered writes and real first interlude seen transition')
 else:seen=None
 times=l['marks'];before=times['appLaunchReturn'];after=times['dialogueFinished'];call=l['byCall']
 need((not call or before<=call[0]['enter']<=call[-1]['exit']<=after) and all(a['enter']<=a['exit'] and math.isfinite(a['exit']) for a in call),'non-monotonic dialogue/launch attribution')
 need(sum(z['newProfileWrites'] for z in call)==counts['during'],'per-call private writer counts disagree')
 target=[z for z in call if z['initialEntryClosed']]
 if stage==46:
  need(len(target)==1 and target[0]['snapshotHelperCalls']==counts['helper'],'did not attribute the sole first-dialogue close')
 return {'opening':digest(l['opening']),'start':[digest(x) for x in p],'close':[digest(x) for x in r],'disk':digest(l['disk']),
         'seen':seen,'counts':counts,'calls':call,'marks':times,'onlyClosingCallMs':target[0]['exit']-target[0]['enter'] if len(target)==1 else None,
         'allPostLaunchDialogueMs':after-before,'appLaunchInclusiveMs':before-times['appLaunchEnter'],'ensureInclusiveMs':times['ensureResolved']-times['ensureEnter']}
def picture(p,dev,stage,label):
 cfg={'id':stage,'mapId':f'stage-{stage}','name':'ordinary' if stage==46 else 'south','ordinary':P['ordinary'][dev] if stage==46 else None,'dx':0,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 a=p.evaluate(O['FROZEN'],cfg)['meta'];d=p.evaluate(O['DECODE']);b=p.evaluate(O['FROZEN'],{**cfg,'readback':True})['meta'];need(a==b and not d['failed'],'native frame or actor/physics state not stable')
 a['physics']=digest(a.pop('signature'))
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); name=label+'-RAW.png';(out/name).write_bytes(raw)
 with Image.open(io.BytesIO(raw)) as im:
  need(list(im.size)==a['backing'],'native backing mismatch')
  rgba=pin(im.convert('RGBA').tobytes())
 return {'name':name,'rgba':rgba,'png':pin(raw),'camera':a}
def trial(ch,dev,arm,stage=46,pair=0,origin='current',visual=False):
 ct,p,verify=browser_context(ch,origin,dev,arm); entry={'device':dev,'variant':arm,'stage':stage,'pair':pair,'origin':origin};q['samples'].append(entry);report()
 try:
  p.evaluate("()=>performance.setResourceTimingBufferSize(4096)")
  stage_cfg=P[origin]['stages'][str(stage)];pose=P['camera'][dev]['actual'] if stage==46 and origin=='current' else None
  a=p.evaluate(LAUNCH,{'stage':stage,'key':KEY,'historical':origin=='historical','decode':O['DECODE'],'paint':AFTER,'pose':pose,'stageStarts':[stage_cfg['map'],stage_cfg['packet']]})
  d=pak(a,stage,origin); entry['data']=d
  need(d['counts']['fast']==d['counts']['helper']==int(stage==46 and arm=='N'),'unexpected one-shot fast path scope')
  if stage==46 and origin=='current':
   outer=a['outer'];paint=outer['draw']
   m=P['camera'][dev];expected={k:m[k] for k in ('css','backing','viewport')}|{'pose':m['actual']}
   need(paint['before']==paint['after']==expected and paint['dpr']==P['devices'][dev]['device_scale_factor'],'actual registered camera/backing differs')
   entry['outer']=outer
   need(outer['firstRequestToEnsureResolvedMs']>0 and paint['draw0']>=a['marks']['decoded'] and paint['ready']>=paint['draw1']>=paint['draw0'],'outer attribution invalid')
  entry['routes']=verify(stage)
  if visual:entry['image']=picture(p,dev,stage,f'{dev}-{stage}-{arm}')
  entry['completed']=True;report()
  return a,entry
 finally:ct.close()
def compare(a,n):
 for k in ('opening','startRows','finishRows','disk'):equal_bytes(a[k],n[k],'protected native storage byte/write sequence mismatch '+k)
 need(a['counts']['during']==n['counts']['during'] and a['counts']['before']==n['counts']['before'],'native write counts drift')
 need([(z['newProfileWrites'],z['dialogueLeft'],z['initialEntryClosed']) for z in a['byCall']]==[(z['newProfileWrites'],z['dialogueLeft'],z['initialEntryClosed']) for z in n['byCall']], 'native close progression order drift')
def resume(ch,dev,arm,seed,kind):
 state=saved(seed,46,P['historical' if kind=='historical-eaf' else 'current']['provider'])
 ct,p,verify=browser_context(ch,'current',dev,arm,seed)
 try:
  ok=p.evaluate('k=>localStorage.getItem(k)===HonroApp.profileStore.original().text',KEY)
  need(ok,'disk seed not exact at fresh native title')
  p.evaluate('()=>{HonroApp.frame=()=>{};}')
  p.locator('[data-action="continue"]').first.click(timeout=16000)
  p.wait_for_function("()=>HonroApp.screen==='battle'&&HonroApp.engine?.b?.honroStage===46&&!HonroApp.profileStore.locked",timeout=24000)
  plain=json.loads(p.evaluate(RESUME,{'slots':len(state['slots']),'provider':P['current']['provider']}))
  need(plain==state,'actual Continue changed source save actor/physics/state')
  q['resumes'][f'{dev}-{arm}-{kind}']={'seed':digest(seed),'state':digest(json.dumps(plain,sort_keys=True,ensure_ascii=True)),
                                     'routes':verify(46),'actualTitleContinue':True,'currentProvider':P['current']['provider']};report()
 finally:ct.close()
def run(ch):
 for index,dev in enumerate(P['devices']):
  mint=None;paired=[]
  for i in range(3):
   t={}
   order='AN' if (i+index)%2==0 else 'NA'
   for arm in order:t[arm]=trial(ch,dev,arm,pair=i+1,visual=i==0)
   compare(t['A'][0],t['N'][0])
   aa,nn=t['A'][1],t['N'][1]
   if i==0:
    mint=t['A'][0]['disk']
    need(all(aa['image'][k]==nn['image'][k] for k in ['rgba','camera']),'matched actual registered native pixels/physics drift')
   paired.append({k:aa['data'][k]-nn['data'][k] for k in ['onlyClosingCallMs','allPostLaunchDialogueMs','appLaunchInclusiveMs','ensureInclusiveMs']}|
                 {k:aa['outer'][k]-nn['outer'][k] for k in ['firstRegisteredDrawMs','firstRequestToEnsureResolvedMs','firstRequestToReadyMs']}|{'order':order})
  a,n=[trial(ch,dev,arm,stage=11,visual=True) for arm in ('A','N')]
  compare(a[0],n[0]);need(all(a[1]['image'][k]==n[1]['image'][k] for k in ['rgba','camera']),'Stage11 negative control native frame or physics drift')
  q['negative'][dev]={'sameWrites':True,'samePixels':True,'fastCalls':[0,0]};report()
  hist=trial(ch,dev,'H',origin='historical')[0]['disk']
  for kind,seed in [('current-e59',mint),('historical-eaf',hist)]:
   for arm in 'AN':resume(ch,dev,arm,seed,kind)
  d=[p['onlyClosingCallMs'] for p in paired]
  q['compares'][dev]={'AminusNPairedMs':paired,'medianCloseMs':statistics.median(d),'directionConsistent':all(v>0 for v in d),'sampleCount':len(d),
                      'measuredCloseOnlyNotEndToEnd':True};report()
 need(len(q['resumes'])==8 and len(q['compares'])==2 and len(q['negative'])==2,'incomplete native scope')
 q['status']='NATIVE_EQUIVALENCE_CLOSE_MEASURED_NO_RELEASE'
report()
try:
 with sync_playwright() as pw:
  ch=pw.chromium.launch(headless=True)
  try:need(ch.version==P['chromium'],'wrong exact Chromium');run(ch)
  finally:ch.close()
except Exception as e:
 # Only fixed guard messages; avoid emitting app source, Storage payload or external console.
 q['error']={'type':type(e).__name__,'fixedGuard':str(e) if isinstance(e,AssertionError) else 'inspect failing sample/phase'};raise SystemExit(1)
finally:report()
