"""Actual ordinary detached A/B: unmodified launch timing plus separate deterministic visual/save checks."""
import asyncio,base64,hashlib,io,json,sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
from playwright.async_api import async_playwright
from guard import P,need,fact as pin,save as out
W=Path(sys.argv[1]);OFF=W/'out';D=Path(__file__).resolve().parent;O=json.loads((D/'observer.json').read_bytes());R=json.loads((W/'REFERENCE.json').read_bytes());G=R['graph']
URL={'A':'http://127.0.0.1:18961/','B':P['publicRoot']}
q={'status':'HOLD','images':{},'saves':{},'errors':[],'rawSaveExported':False}
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
def brand(br,arm,dev,stage,seed=None):
 label=arm.lower();ct=br.new_context(**P['devices'][dev],service_workers='block')
 main=G[label];needed={main['manifest']['project'],main['manifest']['gameEntry'],*P['stages'][str(stage)]['files']};seen={};errors=[]
 ct.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
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
async def read_arm(pw,arm):
 br=await pw.chromium.launch(headless=True)
 need(br.version==P['chromium'],'wrong exact Chromium')
 c=await br.new_context(**P['devices']['PC'],service_workers='block')
 await c.add_init_script(O['INIT_SEED'])
 h=G[arm.lower()];m=h['manifest'];root=URL[arm]
 expected=(m['workshopEntry'],m['playtest'],m['gameEntry'])
 guards={root+n:h['active'][n.split('?',1)[0]]for n in expected};jobs={};errors=[]
 async def witness(r):
  need(r.status==200 and not r.from_service_worker and r.request.method=='GET','not actual successful native workshop request '+r.url)
  b=await r.body()
  proven=pin(b)
  need(proven==guards[r.url],'actual first body digest mismatch '+r.url)
  return proven
 def on_response(r):
  if r.url in guards and r.url not in jobs:jobs[r.url]=asyncio.create_task(witness(r))
 p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',on_response)
 row=q['workshop'][arm]={'status':'STARTED','HTTP':{}};save()
 try:
  resp=await p.goto(root+'HONRO_WORKSHOP.html',wait_until='domcontentloaded',timeout=55000)
  need(resp and resp.url==root+'HONRO_WORKSHOP.html' and resp.status==200 and not resp.from_service_worker,'wrong actual workshop shell navigation')
  row['shell']=pin(await asyncio.wait_for(resp.body(),10))
  need(row['shell']==h['workshopShell'],'native workshop shell mismatch')
  await p.wait_for_function("()=>typeof window.HonroWorkshopAPI?.startPlaytest==='function' && typeof window.HONRO_READY?.then==='function'",timeout=55000)
  actual=await p.evaluate("async()=>{await Promise.race([window.HONRO_READY,new Promise((_,r)=>setTimeout(()=>r(Error('native startup deadline')),12000))]);return window.HONRO_PLAYTEST_URL;}")
  need(actual==m['playtest'],'native workshop globals read wrong playtest route')
  first=expected[0]
  need(root+first in jobs,'actual workshop JS request missing')
  row['HTTP'][first]=await asyncio.wait_for(asyncio.shield(jobs[root+first]),12)
  counts=await p.evaluate("()=>{const p=window.HonroWorkshopAPI.getProject();return {stages:p.stages.length,library:p.library.length};}")
  need(counts=={'stages':50,'library':1194},'native workshop map/library empty')
  await p.evaluate("()=>{window.HonroWorkshopAPI.selectStage('stage-1');window.HonroWorkshopAPI.startPlaytest();}")
  await p.wait_for_function("""()=>{const f=document.querySelector('#runtimeFrame'),a=f?.contentWindow?.HonroApp;
    return a?.customMap?.stageId==='stage-1'&&a?.engine?.b?.units?.length>0&&f.contentWindow.HONRO_EMBEDDED===true;}""",timeout=50000)
  view=await p.evaluate("""()=>{const f=document.querySelector('#runtimeFrame'),a=f.contentWindow.HonroApp,b=a.engine.b;
    return {frame:f.src,embedded:f.contentWindow.HONRO_EMBEDDED,stage:a.customMap.stageId,started:a.stageId,
    battle:JSON.stringify([b.width,b.height,b.terrain,b.units,b.honroObjectives,b.honroGoalState,b.objectives])};}""")
  need(view['frame']==root+m['playtest'] and view['embedded'] is True and view['started']==1 and not errors,'native embedded launcher wrong or page errors')
  need(set(jobs)==set(guards),'some actual embedded data routes missing')
  for n,result in zip(expected,await asyncio.wait_for(asyncio.gather(*(jobs[root+n]for n in expected)),15)):
   row['HTTP'][n]=result
  state=hashlib.sha256(view.pop('battle').encode()).hexdigest()
  row.update(view,**counts,stateSHA=state,status='OBSERVED');save()
  old=R['workshop'][arm]
  need(row['shell']==old['shell'] and row['HTTP']==old['HTTP'] and state==old['stateSHA'],'public exact real Workshop graph/semantic evidence drift')
  return (state,counts)
 finally:
  for t in jobs.values():
   if not t.done():t.cancel()
  await asyncio.gather(*jobs.values(),return_exceptions=True)
  await c.close();await br.close()
async def workshop():
 q['workshop']={}
 async with async_playwright() as pw:
  a=await read_arm(pw,'A'); b=await read_arm(pw,'B')
 need(a==b,'real predecessor/public embedded starter state differs')

def stages(br,dev,stage):
 ids=OWN40 if stage==40 else OWN
 args={'key':key,'ids':ids,'expected':P['stage46Provider']['current']}
 def mint(p):return p.evaluate(PERSIST40 if stage==40 else MINTED,args)
 def state(x):return {k:sha(v) if isinstance(v,str) else v for k,v in x.items()}
 def receipt(s):return {'bytesAndSHA':pin(s['text'].encode()),'refs':s['refs'],'state':state(s['state'])}
 def known(_,role):return R['nativeSaves'][str(stage)][dev][role]
 row=q['saves'].setdefault(str(stage),{}).setdefault(dev,{})
 c,p,_,v=brand(br,'A',dev,stage)
 try:
  # Match the already approved union mint sequence: native parked scene,
  # same visual pair/decode/settled draw, then original app save/read.
  # Stage46 also samples the genuine pre-advance save at the same boundary.
  def opening(m):
   x=receipt(mint(m));expected=known('A','openingBeforeAdvanceA')
   row['predecessorOpening']={'observed':x,'expected':expected};save()
   need(x==expected,'genuine predecessor Stage46 opening bytes differ before story advancement')
  label=f'{dev}-{stage}'
  parked(p,stage,opening if stage==46 else None)
  checkpoint=image(p,stage,dev,'PREDECESSOR-'+label+'-mint-checkpoint')
  row['predecessorMintVisualCheckpoint']={**checkpoint,'archivedSamePose':checkpoint['meta']==R['nativeImages'][label]['A']['meta']}
  # A screenshot already exists in R1 archive; capture here invokes original
  # same native draws, but clean the duplicate JPEG/PNG from the new artifact.
  (OFF/checkpoint['file']).unlink()
  row['predecessorMintVisualCheckpoint'].pop('file')
  a=mint(p)
  seed=a.pop('text')
  previous=state(a['state'])
  a={'bytesAndSHA':pin(seed.encode()),'state':previous,'refs':a['refs']}
  wanted=known('A','saved' if stage==40 else 'nativeMintedA')
  row['predecessorMinted']=a
  row['predecessorMintAudit']={
   'expected':wanted,
   'wholeBytesEqual':a['bytesAndSHA']==wanted['bytesAndSHA'],
   'providerRefsEqual':a['refs']==wanted['refs'],
   'stateFieldsEqual':{k:a['state'].get(k)==wanted['state'].get(k) for k in sorted(a['state'].keys()|wanted['state'].keys())}}
  save()
  need(a==wanted,'genuine predecessor ordinary save hash/state/provider differs after receipt-exact native raster checkpoint')
  v();save()
 finally:c.close()
 c,p,_,v=brand(br,'B',dev,stage)
 try:
  parked(p,stage)
  label=f'{dev}-{stage}'
  raw=image(p,stage,dev,'PUBLIC-'+label+'-fresh')
  q['images'][label]={'fresh':raw};save()
  old=R['nativeImages'][label]['B']
  need(raw['quiescent'] and raw['rgba']==old['rgba'] and raw['meta']==old['meta'],'public same-pose actual RAW graph differs from accepted candidate')
  b=mint(p)
  curr=receipt(b);b.pop('text')
  expected=(wanted if stage==40 else known('B','nativeMintedB'))
  if stage==40:
   need(curr['refs']==expected['refs'] and curr['state']==expected['state'],'public fresh Stage40 canonical storage/provider changed')
  else:need(curr==expected,'public fresh Stage46 post-entry storage differs')
  row['publicFresh']=curr;v();save()
 finally:c.close()
 c,p,_,v=brand(br,'B',dev,stage,seed=seed)
 try:
  need(p.evaluate("()=>HonroApp.profileStore.original().text")==seed,'wrong predecessor-minted private input at new title')
  p.evaluate("()=>{HonroApp.frame=()=>{};}")
  p.locator('[data-action="continue"]').first.click(timeout=15000);waitbattle(p,stage)
  rr=p.evaluate(RESTORE40 if stage==40 else RESTORE,args);st=state(rr['state'])
  pp=({k:sha(v)for k,v in rr['provider'].items()} if stage==40 else rr['provider'])
  q['images'][label]['continued']=image(p,stage,dev,'PUBLIC-'+label+'-continued');save()
  need(st==previous and pp==known('B','resumeB')['providers'],'new public Continue state or canonical vector provider mismatch')
  row['publicContinued']={'actualTitleClick':True,'noSaveWriteBackRequired':True,'state':st,'providerHashes':pp}
  v();save()
 finally:c.close()

save()
try:
 with sync_playwright() as pw:
  for dev in P['devices']:
   br=pw.chromium.launch(headless=True)
   try:
    need(br.version==P['chromium'],'wrong expected Chromium')
    for stage in (40,46):stages(br,dev,stage)
   finally:br.close()
 asyncio.run(workshop())
 q['status']='EXACT_ANONYMOUS_CURRENT_NATIVE_AND_EAF_CONTINUE'
except Exception as e:
 q['errors'].append(repr(e));raise
finally:save()
