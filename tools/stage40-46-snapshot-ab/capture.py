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
OWN=[P['stage46Provider']['id']]
BATTLE=r"""
 const a=HonroApp,b=a.engine?.b;
 if(!b||b.honroStage!==46||b.mode!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||a.profileStore.locked)throw Error('actual canonical Stage46 save required');
 const sig=x=>JSON.stringify(x);
 const state=x=>({terrain:sig(x.terrain),units:sig(x.units),goals:sig([x.honroObjectives,x.objectives,x.honroQuestTargets,x.honroGoalState,x.honroEncounterState]),round:x.round,phase:x.phase,placements:sig([x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].map(r=>(r||[]).filter(i=>i.asset?.id).map(({asset,...keep})=>[asset.id,keep])))});
 const owners=(x,list)=>[x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].flatMap(r=>(r||[]).filter(i=>list.includes(i.asset?.id)));
"""
MINTED='arg=>{'+BATTLE+r"""
 const text=localStorage.getItem(arg.key);if(text===null)throw Error('native opening did not produce an ordinary disk save');
 const s=JSON.parse(text).honroBattle;
 if(!s||s.honroStage!==46||HonroCampaignMapRevision.obsolete(s))throw Error('wrong original actual save');
 const found=owners(s,arg.ids),refs=Object.fromEntries(found.map(x=>[x.asset.id,x.asset.signature]));
 if(!found.length||found.some(x=>x.asset.honroStaticAssetRef!==1||x.asset.signature!==arg.expected)||!arg.ids.every(k=>refs[k]===arg.expected))throw Error('missing native compact provider refs');
 return {text,refs,state:state(s)};
}"""
RESTORE='async arg=>{'+BATTLE+r"""
 const e=owners(b,arg.ids),hash=(s)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(v=>[...new Uint8Array(v)].map(n=>n.toString(16).padStart(2,'0')).join(''));
 const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
 if(!arg.ids.every(i=>e.some(x=>x.asset.id===i)))throw Error('missing restored canonical provider');
 if(e.some(x=>x.asset.honroStaticAssetRef||!x.asset.shaftExterior||x.asset.shaftExteriorParts?.length!==5))throw Error('near46 must be genuine restored canonical vector provider');
 const rows=HONRO_PROJECT.library.filter(a=>arg.ids.includes(a.id)),declared=rows.map(a=>[a.id,sig(a)]);
 if(!arg.ids.every(id=>declared.filter(x=>x[0]===id).length===1)||!declared.every(x=>fnv(x[1])===arg.expected))throw Error('wrong registered restored asset');
 const provider=await Promise.all(e.map(async x=>{
  const v=sig(x.asset);if(!declared.some(([i,t])=>i===x.asset.id&&t===v))throw Error('restored owner differs from registered asset');
  return [x.asset.id,await hash(v)];
 }));
 return {state:state(b),provider};
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
   proof=p.evaluate("""()=>{const a=HonroApp,b=a.engine?.b,f=globalThis.HonroAct5,k=['snapshot46Launch','take46OpeningSnapshot','snapshot46Opening'];
    const present=k.map(n=>typeof f?.[n]==='function'),root=!!b&&b.mode==='campaign'&&b.honroStage===46&&b.stage===46&&b.honroAct5===1&&
      b.honroMapOrigin==='campaign'&&b.honroCanonical===true&&b.honroCustom===false&&b.honroAuthoredId==='stage-46'&&
      b.honroTerrainDomainVersion===1&&b.width===4096&&b.height===6504;
    const slots=[b?.honroElements,b?.honroLandmarks].map(q=>Array.isArray(q)?q.filter(x=>x?.id==='a5-near'):[]);
    const eligible=root&&slots.every(q=>q.length===1&&q.every(x=>x.kind==='canonical-element'&&x.assetId==='act5:near:46'&&
      x.x===0&&x.y===0&&x.scale===4&&x.rotation===0&&Array.isArray(x.collisionIds)&&x.collisionIds.length===0&&
      x.asset?.id===x.assetId&&!!x.asset.shaftExterior&&x.asset.shaftExteriorParts?.length===5));
    return {present,eligible};}""")
   prove40=p.evaluate("()=>{const a=HonroApp,x=globalThis.HonroAct4Campaign?.ownsFreshHarborSnapshot;return {present:typeof x==='function',accepted:x?.(a,a.engine?.b)===true};}")
   rr['nativeStage40SourceAndOwner']=prove40
   need(prove40['present']==(arm=='B') and prove40['accepted']==(arm=='B' and stage==40),'exact native Stage40 shortcut scope differ')
   rr['nativeStage46SourceAndOwner']=proof
   need(proof['present']==[arm=='B']*3 and proof['eligible']==(stage==46),'exact entry helpers or Stage46 owner not available')
   rr['times']={'launchToDrawEnd':f['end']-marks['launchStart'],'readyToDrawEnd':f['end']-e[0]['end'],'readyToDrawStart':f['start']-e[0]['end'],'firstDrawCpu':f['cpu']};rr['nativeReady']=True;rr['firstFrame']=f;v();rr['status']='OBSERVED';save()
  finally:c.close()
 finally:b.close()
def waitbattle(p,n):p.wait_for_function(f"()=>HonroApp.engine?.b?.honroStage==={n}&&!HonroApp.profileStore.locked",timeout=22000)
def parked(p,n,record_opening=None):
 p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
 if record_opening is not None:
  launch,finish=O['LAUNCH'].split(' for(let n=0;',1)
  p.evaluate(launch+'}',n);waitbattle(p,n)
  record_opening(p)
  p.evaluate('()=>{const a=HonroApp;for(let n=0;'+finish)
 else:
  p.evaluate(O['LAUNCH'],n);waitbattle(p,n)
def image(p,stage,dev,tag):
 d={'id':stage,'mapId':f'stage-{stage}','name':'ordinary' if stage in (40,46) else 'south','ordinary':P['exactOrdinaryTargets'][dev][str(stage)] if stage in (40,46) else None,'dx':0,'dy':1,'readback':False,'fixedNow':O['PHASE']}
 m=p.evaluate(O['FROZEN'],d)['meta'];m['physics']=sha(m.pop('signature'));ready=p.evaluate(O['DECODE']);m2=p.evaluate(O['FROZEN'],{**d,'readback':True})['meta'];m2['physics']=sha(m2.pop('signature'))
 raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); fn=tag+'-RAW.png';(OFF/fn).write_bytes(raw)
 with Image.open(io.BytesIO(raw))as im:
  need(list(im.size)==m['backing'],'wrong framebuffer');rgba=hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()
 return {'file':fn,'png':pin(raw),'rgba':rgba,'meta':m2,'quiescent':m==m2 and not ready['failed']}
def pictures_and_save46(pw,dev):
 b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong exact Chromium')
 seed=None;actual={}
 try:
  for stage in (11,46):
   for arm in 'AB':
    c,p,_,v=brand(b,arm,dev,stage,False)
    try:
     def read(m):
      return m.evaluate(MINTED,{'key':key,'ids':OWN,'expected':P['stage46Provider']['current']})
     def receipt(s):
      return {'bytesAndSHA':pin(s['text'].encode()),'refs':s['refs'],'state':{x:sha(y)if isinstance(y,str)else y for x,y in s['state'].items()}}
     def read_opening(m):
      actual['openingBeforeAdvance'+arm]=receipt(read(m))
      q['saves'].setdefault('46',{})[dev]=actual;save()
     parked(p,stage,read_opening if stage==46 else None)
     t=q['images'].setdefault(f'{dev}-{stage}',{});t[arm]=image(p,stage,dev,f'{dev}-{stage}-{arm}')
     save()
     if stage==46:
      s=read(p)
      if arm=='A': seed=s['text']
      actual['nativeMinted'+arm]=receipt(s)
      q['saves'].setdefault('46',{})[dev]=actual;save()
     v();save()
    finally:c.close()
   a,b0=(q['images'][f'{dev}-{stage}'][x]for x in 'AB')
   need(a['quiescent'] and b0['quiescent'] and a['meta']==b0['meta'] and a['rgba']==b0['rgba'],'actual physics/appearance drift stage '+str(stage))
  need(actual['openingBeforeAdvanceA']==actual['openingBeforeAdvanceB'],'initial opening save A/B mismatch before story advancement')
  need(actual['nativeMintedA']==actual['nativeMintedB'],'fresh ordinary opening saves differ with fixed scene seed')
  recovered={}
  for arm in 'AB':
   c,p,_,v=brand(b,arm,dev,46,False,seed)
   try:
    need(p.evaluate("()=>HonroApp.profileStore.original().text")==seed,'actual prior save bytes not present at cold title')
    p.evaluate("()=>{HonroApp.frame=()=>{};}")
    p.locator('[data-action="continue"]').first.click(timeout=15000);waitbattle(p,46)
    r=p.evaluate(RESTORE,{'ids':OWN,'expected':P['stage46Provider']['current']});recovered[arm]=r
    st={x:sha(y)if isinstance(y,str)else y for x,y in r['state'].items()}
    need(st==actual['nativeMintedA']['state'],'native continued state/terrain/actors/placements differ')
    actual['resume'+arm]={'actualNativeTitleClick':True,'state':st,'providers':r['provider']}
    v();save()
   finally:c.close()
  need(recovered['A']==recovered['B'],'native restored complete provider identity drift')
  q['saves'].setdefault('46',{})[dev]=actual;save()
 finally:b.close()
OWN40=['approved40:body','approved40:coastal-foundation','approved40:terrain-left-join','approved40:terrain-right-join']
BATTLE40=r"""
 const a=HonroApp,b=a.engine?.b;
 if(!b||b.honroStage!==40||b.mode!=='campaign'||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||a.profileStore.locked)throw Error('actual canonical Stage40 save required');
 const sig=x=>JSON.stringify(x);
 const state=x=>({terrain:sig(x.terrain),units:sig(x.units),goals:sig([x.honroObjectives,x.objectives,x.honroQuestTargets,x.honroGoalState,x.honroEncounterState]),round:x.round,phase:x.phase,placements:sig([x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].map(r=>(r||[]).filter(i=>i.asset?.id).map(({asset,...keep})=>[asset.id,keep])))});
 const owners=(x,list)=>[x.honroLandmarks,x.honroElements,x.honroEnvironment?.placements].flatMap(r=>(r||[]).filter(i=>list.includes(i.asset?.id)));
"""
PERSIST40='arg=>{'+BATTLE40+r"""
 if(a.persist()!==true)throw Error('native persist denied');
 const text=localStorage.getItem(arg.key),s=JSON.parse(text).honroBattle;
 if(!s||s.honroStage!==40||HonroCampaignMapRevision.obsolete(s))throw Error('wrong original actual save');
 const found=owners(s,arg.ids),refs=Object.fromEntries(found.map(x=>[x.asset.id,x.asset.signature]));
 if(found.some(x=>x.asset.honroStaticAssetRef!==1)||!arg.ids.every(k=>refs[k]))throw Error('missing native compact provider refs');
 return {text,refs,state:state(s)};
}"""
RESTORE40='arg=>{'+BATTLE40+r"""
 const e=owners(b,arg.ids);
 if(!arg.ids.every(i=>e.some(x=>x.asset.id===i)))throw Error('missing restored canonical provider');
 const ref=Object.fromEntries(e.map(x=>[x.asset.id,sig(x.asset)]));return {state:state(b),provider:ref};
}"""
def pictures_and_save40(pw,dev):
 b=pw.chromium.launch(headless=True);need(b.version==P['chromium'],'wrong exact Chromium')
 seed=None;actual={}
 try:
  for stage in (40,):
   for arm in 'AB':
    c,p,_,v=brand(b,arm,dev,stage,False)
    try:
     parked(p,stage)
     t=q['images'].setdefault(f'{dev}-{stage}',{});t[arm]=image(p,stage,dev,f'{dev}-{stage}-{arm}')
     if stage==40 and arm=='A':
      s=p.evaluate(PERSIST40,{'key':key,'ids':OWN40});seed=s['text'];actual['saved']={'bytesAndSHA':pin(seed.encode()),'refs':s['refs'],'state':{x:sha(y)if isinstance(y,str)else y for x,y in s['state'].items()}}
     v();save()
    finally:c.close()
   a,b0=(q['images'][f'{dev}-{stage}'][x]for x in 'AB')
   need(a['quiescent'] and b0['quiescent'] and a['meta']==b0['meta'] and a['rgba']==b0['rgba'],'actual physics/appearance drift stage '+str(stage))
  recovered={}
  for arm in 'AB':
   c,p,_,v=brand(b,arm,dev,40,False,seed)
   try:
    need(p.evaluate("()=>HonroApp.profileStore.original().text")==seed,'actual prior save bytes not present at cold title')
    p.evaluate("()=>{HonroApp.frame=()=>{};}")
    p.locator('[data-action="continue"]').first.click(timeout=15000);waitbattle(p,40)
    r=p.evaluate(RESTORE40,{'ids':OWN40});recovered[arm]=r
    st={x:sha(y)if isinstance(y,str)else y for x,y in r['state'].items()}
    need(st==actual['saved']['state'],'native continued state/terrain/actors/placements differ')
    actual['resume'+arm]={'actualNativeTitleClick':True,'state':st,'providers':{x:sha(y)for x,y in r['provider'].items()}}
    v();save()
   finally:c.close()
  need(recovered['A']==recovered['B'],'native restored complete provider identity drift')
  q['saves'].setdefault('40',{})[dev]=actual;save()
 finally:b.close()
def workshop(pw):
 result={}
 for arm in 'AB':
  br=pw.chromium.launch(headless=True)
  c=br.new_context(**P['devices']['PC'],service_workers='block')
  c.add_init_script(O['INIT_SEED'])
  h=G[arm.lower()];m=h['manifest'];root=URL[arm];errors=[];seen={}
  expected=(m['workshopEntry'],m['playtest'],m['gameEntry'])
  p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('response',lambda r:seen.setdefault(r.url,r) if r.url in {root+n for n in expected} else None)
  q.setdefault('workshop',{})[arm]={'status':'STARTED'};save()
  try:
   response=p.goto(root+'HONRO_WORKSHOP.html',wait_until='domcontentloaded',timeout=55000)
   need(response and response.url==root+'HONRO_WORKSHOP.html' and response.status==200 and not response.from_service_worker and pin(response.body())==G['ordered']['workshopShell'][arm.lower()],'native workshop shell mismatch')
   p.wait_for_function("()=>typeof window.HonroWorkshopAPI?.startPlaytest==='function' && typeof window.HONRO_READY?.then==='function'",timeout=55000)
   actual=p.evaluate("async()=>{await Promise.race([window.HONRO_READY,new Promise((_,r)=>setTimeout(()=>r(Error('native workshop readiness deadline')),12000))]);return window.HONRO_PLAYTEST_URL;}")
   need(actual==m['playtest'],'native workshop globals read wrong playtest route')
   p.evaluate("()=>{window.HonroWorkshopAPI.selectStage('stage-1');window.HonroWorkshopAPI.startPlaytest();}")
   p.wait_for_function("""()=>{const f=document.querySelector('#runtimeFrame'),a=f?.contentWindow?.HonroApp;
     return a?.customMap?.stageId==='stage-1'&&a?.engine?.b?.units?.length>0&&f.contentWindow.HONRO_EMBEDDED===true;}""",timeout=50000)
   view=p.evaluate("""()=>{const f=document.querySelector('#runtimeFrame'),a=f.contentWindow.HonroApp,b=a.engine.b;
      return {frame:f.src,embedded:f.contentWindow.HONRO_EMBEDDED,stage:a.customMap.stageId,started:a.stageId,
       battle:JSON.stringify([b.width,b.height,b.terrain,b.units,b.honroObjectives,b.honroGoalState,b.objectives])};}""")
   need(view['frame']==root+m['playtest'] and not errors,'native embedded stage incorrect')
   bytes_at={}
   for n in expected:
    o=seen.get(root+n);physical=n.split('?',1)[0]
    need(o and o.status==200 and not o.from_service_worker and pin(o.body())==h['active'][physical],'wrong exact workshop bytes '+n)
    bytes_at[n]=h['active'][physical]
   result[arm]=sha(view.pop('battle'))
   q['workshop'][arm]={**view,'stateSHA':result[arm],'HTTP':bytes_at,'status':'OBSERVED'};save()
  finally:c.close();br.close()
 need(result['A']==result['B'],'native editor-embedded starter battle state changed')

def summary():
 groups={}
 for r in q['trials']:groups.setdefault((r['device'],r['stage'],r['rep']),{})[r['arm']]=r['times']
 q['timing']={}
 for dev in P['devices']:
  q['timing'][dev]={}
  for st in (40,46):
   d=[]
   for i in range(3):
    a,b=[groups[dev,st,i][k]['readyToDrawEnd']for k in 'AB']
    d.append((a,b,a-b))
   ds=[r[2]for r in d];a0,b0=[groups[dev,11,0][k]['readyToDrawEnd']for k in 'AB']
   gain=statistics.median(ds);stock=statistics.median([r[0]for r in d]);control=b0-a0
   passed=all(x>0 for x in ds) and gain>=max(30,.08*stock,abs(control)) and control<=max(30,.10*a0)
   q['timing'][dev][str(st)]={'paired':d,'medianDeltaMs':gain,'largestControlShiftMs':control,'firstScreenBenefitQualified':passed}
 q['status']='NATIVE_EQUIVALENCE_TIMING_QUALIFIED' if all(r['firstScreenBenefitQualified']for dev in q['timing'].values() for r in dev.values()) else 'HOLD_TIMING_NOT_CONCLUSIVE'
save()
try:
 with sync_playwright() as pw:
  for i in range(3):
   for j,d in enumerate(P['devices']):
    for k,st in enumerate((40,46) if i%2==0 else (46,40)):
     for x in ('AB' if (i+j+k)%2==0 else 'BA'):timed(pw,x,d,st,i)
  for i,d in enumerate(P['devices']):
   for x in ('BA' if i%2==0 else 'AB'):timed(pw,x,d,11,0)
  for d in P['devices']:
   pictures_and_save40(pw,d)
   pictures_and_save46(pw,d)
  workshop(pw)
 summary();save();need(q['status']=='NATIVE_EQUIVALENCE_TIMING_QUALIFIED','strict real timing not qualified; screenshots/save receipts retained')
except Exception as e:
 q['errors'].append(repr(e));raise
finally:save()
