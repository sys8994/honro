"""Actual ordinary detached A/B: unmodified launch timing plus separate deterministic visual/save checks."""
import base64,hashlib,io,json,statistics,sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
from guard import P,need,pin,out
W=Path(sys.argv[1]);OFF=W/'out';D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes());G=json.loads((OFF/'GRAPH.json').read_bytes())
URL={'A':'http://127.0.0.1:18961/','B':'http://127.0.0.1:18962/'}
q={'status':'HOLD','trials':[],'images':{},'saves':{},'errors':[],'rawSaveExported':False}
def save():out(OFF/'ACCEPTANCE.json',q)
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
key='honro-first-act-profile-1'
OWN=['approved40:body','approved40:coastal-foundation','approved40:terrain-left-join','approved40:terrain-right-join']
BATTLE=r"""
 const a=HonroApp,b=a.engine?.b;
 if(!b||b.honroStage!==40||b.mode!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||a.profileStore.locked)throw Error('actual canonical Stage40 save required');
 const sig=x=>JSON.stringify(x);
 const state=x=>({terrain:sig(x.terrain),units:sig(x.units),goals:sig([x.honroObjectives,x.objectives,x.honroQuestTargets,x.honroGoalState,x.honroEncounterState]),round:x.round,phase:x.phase,placements:sig([x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].map(r=>(r||[]).filter(i=>i.asset?.id).map(({asset,...keep})=>[asset.id,keep])))});
 const owners=(x,list)=>[x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].flatMap(r=>(r||[]).filter(i=>list.includes(i.asset?.id)));
"""
PERSIST='arg=>{'+BATTLE+r"""
 if(a.persist()!==true)throw Error('native persist denied');
 const text=localStorage.getItem(arg.key),s=JSON.parse(text).honroBattle;
 if(!s||s.honroStage!==40||HonroCampaignMapRevision.obsolete(s))throw Error('wrong original actual save');
 const found=owners(s,arg.ids),refs=Object.fromEntries(found.map(x=>[x.asset.id,x.asset.signature]));
 if(found.some(x=>x.asset.honroStaticAssetRef!==1)||!arg.ids.every(k=>refs[k]))throw Error('missing native compact provider refs');
 return {text,refs,state:state(s)};
}"""
RESTORE='arg=>{'+BATTLE+r"""
 const e=owners(b,arg.ids);
 if(!arg.ids.every(i=>e.some(x=>x.asset.id===i)))throw Error('missing restored canonical provider');
 const ref=Object.fromEntries(e.map(x=>[x.asset.id,sig(x.asset)]));return {state:state(b),provider:ref};
}"""
def brand(br,arm,dev,stage,obs=True,seed=None):
 label=arm.lower();ct=br.new_context(**P['devices'][dev],service_workers='block')
 main=G[label];needed={main['manifest']['project'],main['manifest']['gameEntry'],*P['stages'][str(stage)]['files']};seen={};errors=[]
 if obs:ct.add_init_script((D/'observe.js').read_text())
 else:ct.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 if seed:
  ct.add_init_script('if(location.origin==='+json.dumps(URL[arm].rstrip('/'))+'){localStorage.setItem('+json.dumps(key)+','+json.dumps(seed,ensure_ascii=True)+');}')
 p=ct.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:seen.setdefault(r.url,r) if r.url in {URL[arm]+k for k in needed} else None)
 n=p.goto(URL[arm]+'HONRO.html',wait_until='domcontentloaded',timeout=45000)
 need(n and n.status==200 and n.url==URL[arm]+'HONRO.html' and not n.from_service_worker and pin(n.body())==main['shell'],'wrong detached normal shell')
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&HonroApp.screen==='title'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=60000)
 def verify():
  for r in sorted(needed):
   z=seen.get(URL[arm]+r);need(z and z.status==200 and not z.from_service_worker and pin(z.body())==main['active'][r],'wrong immutable routes '+r)
  need(not errors,'native page errors '+repr(errors))
 return ct,p,needed,verify
def timed(pw,arm,dev,stage,r):
 rr={'arm':arm,'device':dev,'stage':stage,'rep':r};q['trials'].append(rr);save()
 b=pw.chromium.launch(headless=True)
 try:
  need(b.version==P['chromium'],'wrong exact Chromium')
  c,p,paths,v=brand(b,arm,dev,stage)
  try:
   p.evaluate('id=>__honroP1Budget.start(id)',stage)
   p.wait_for_function("()=>__honroP1Budget.state.marks.firstFollowingRaf!==undefined||!!HonroApp.lastError",timeout=35000,polling=75)
   gather=p.evaluate('xs=>__honroP1Budget.read(xs)',list(paths));marks=gather['marks'];f=gather['firstFrame'];e=gather['ensures']
   need(gather['stage']==stage and gather['map']['id']==f'stage-{stage}' and not gather['map']['pending'] and f['pose']['mode']=='campaign' and not f['pose']['custom'] and not gather['appError'],'noncanonical native measured stage')
   need(not gather['eager'] and len(e)==1 and e[0]['stage']==stage and not e[0].get('error') and e[0]['end']<=f['start']<=f['end'],'native stage ready not observed')
   proof=p.evaluate("()=>{const a=HonroApp,x=HonroAct4Campaign?.ownsFreshHarborSnapshot;return {present:typeof x==='function',accepted:x?.(a,a.engine?.b)===true};}")
   rr['nativeOwnerPredicate']=proof
   need(proof['present']==(arm=='B') and proof['accepted']==(arm=='B' and stage==40),'candidate actual native owner shortcut is not active only in Stage40')
   rr['times']={'launchToDrawEnd':f['end']-marks['launchStart'],'readyToDrawEnd':f['end']-e[0]['end'],'readyToDrawStart':f['start']-e[0]['end'],'firstDrawCpu':f['cpu']};rr['nativeReady']=True;rr['firstFrame']=f;v();rr['status']='OBSERVED';save()
  finally:c.close()
 finally:b.close()
def waitbattle(p,n):p.wait_for_function(f"()=>HonroApp.engine?.b?.honroStage==={n}&&!HonroApp.profileStore.locked",timeout=22000)
def parked(p,n):
 p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
 p.evaluate(O['LAUNCH'],n);waitbattle(p,n)
def image(p,stage,tag):
 d={'id':stage,'mapId':f'stage-{stage}','name':'ordinary' if stage==40 else 'south','ordinary':[2850,2850,.30] if stage==40 else None,'dx':0,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 m=p.evaluate(O['FROZEN'],d)['meta'];m['physics']=sha(m.pop('signature'));p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**d,'readback':True})
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); fn=tag+'-RAW.png';(OFF/fn).write_bytes(raw)
 with Image.open(io.BytesIO(raw))as im:
  need(list(im.size)==m['backing'],'wrong framebuffer');rgba=hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()
 return {'file':fn,'png':pin(raw),'rgba':rgba,'meta':m}
def pictures_and_save(pw,dev):
 b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong exact Chromium')
 seed=None;actual={}
 try:
  for stage in (11,40):
   for arm in 'AB':
    c,p,_,v=brand(b,arm,dev,stage,False)
    try:
     parked(p,stage)
     t=q['images'].setdefault(f'{dev}-{stage}',{});t[arm]=image(p,stage,f'{dev}-{stage}-{arm}')
     if stage==40 and arm=='A':
      s=p.evaluate(PERSIST,{'key':key,'ids':OWN});seed=s['text'];actual['saved']={'bytesAndSHA':pin(seed.encode()),'refs':s['refs'],'state':{x:sha(y)if isinstance(y,str)else y for x,y in s['state'].items()}}
     v();save()
    finally:c.close()
   a,b0=(q['images'][f'{dev}-{stage}'][x]for x in 'AB')
   need(a['meta']==b0['meta'] and a['rgba']==b0['rgba'],'actual physics/appearance drift stage '+str(stage))
  recovered={}
  for arm in 'AB':
   c,p,_,v=brand(b,arm,dev,40,False,seed)
   try:
    need(p.evaluate("()=>HonroApp.profileStore.original().text")==seed,'actual prior save bytes not present at cold title')
    p.evaluate("()=>{HonroApp.frame=()=>{};}")
    p.locator('[data-action="continue"]').first.click(timeout=15000);waitbattle(p,40)
    r=p.evaluate(RESTORE,{'ids':OWN});recovered[arm]=r
    st={x:sha(y)if isinstance(y,str)else y for x,y in r['state'].items()}
    need(st==actual['saved']['state'],'native continued state/terrain/actors/placements differ')
    actual['resume'+arm]={'actualNativeTitleClick':True,'state':st,'providers':{x:sha(y)for x,y in r['provider'].items()}}
    v();save()
   finally:c.close()
  need(recovered['A']==recovered['B'],'native restored complete provider identity drift')
  q['saves'][dev]=actual;save()
 finally:b.close()
def summary():
 groups={}
 for r in q['trials']:groups.setdefault((r['device'],r['stage'],r['rep']),{})[r['arm']]=r['times']
 q['timing']={}
 for dev in P['devices']:
  d=[]
  for i in range(3):
   a,b=[groups[dev,40,i][k]['readyToDrawEnd']for k in 'AB']
   d.append((a,b,a-b))
  ds=[r[2]for r in d];a0,b0=[groups[dev,11,0][k]['readyToDrawEnd']for k in 'AB']
  gain=statistics.median(ds);stock=statistics.median([r[0]for r in d]);control=b0-a0
  passed=all(x>0 for x in ds) and gain>=max(30,.08*stock,abs(control)) and control<=max(30,.10*a0)
  q['timing'][dev]={'pairedStage40':d,'medianDeltaMs':gain,'largestControlShiftMs':control,'firstScreenBenefitQualified':passed}
 q['status']='NATIVE_EQUIVALENCE_TIMING_QUALIFIED' if all(x['firstScreenBenefitQualified']for x in q['timing'].values()) else 'HOLD_TIMING_NOT_CONCLUSIVE'
save()
try:
 with sync_playwright() as pw:
  for i in range(3):
   for j,d in enumerate(P['devices']):
    for x in ('AB' if (i+j)%2==0 else 'BA'):timed(pw,x,d,40,i)
  for i,d in enumerate(P['devices']):
   for x in ('BA' if i%2==0 else 'AB'):timed(pw,x,d,11,0)
  for d in P['devices']:pictures_and_save(pw,d)
 summary();save();need(q['status']=='NATIVE_EQUIVALENCE_TIMING_QUALIFIED','strict real timing not qualified; screenshots/save receipts retained')
except Exception as e:
 q['errors'].append(repr(e));raise
finally:save()
